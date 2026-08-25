-- =====================================================================
-- crear_pedido_invitado(p_nombre, p_telefono, p_direccion, p_items)
--
-- Igual que crear_pedido() (ver sql/crear_pedido.sql) pero para
-- clientes SIN cuenta: crea la ficha en `clientes` (auth_user_id queda
-- NULL) y el pedido en un solo paso. No requiere sesión — se llama con
-- la key anónima, por eso el GRANT es a "anon" además de "authenticated".
--
-- Pégalo una sola vez en Supabase → SQL Editor → Run.
--
-- Uso desde el navegador (ver js/cart.js):
--   supabase.rpc('crear_pedido_invitado', {
--     p_nombre: 'Dra. Nombre Apellido',
--     p_telefono: '3001234567',   -- opcional
--     p_direccion: 'Consultorio, dirección completa',
--     p_items: [{ producto_id: '...', cantidad: 2 }, ...]
--   })
-- =====================================================================

create or replace function crear_pedido_invitado(
  p_nombre text,
  p_telefono text,
  p_direccion text,
  p_items jsonb
)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_pedido pedidos;
  v_item jsonb;
  v_producto productos%rowtype;
  v_total numeric(10,2) := 0;
begin
  if p_nombre is null or trim(p_nombre) = '' then
    raise exception 'El nombre es obligatorio';
  end if;
  if p_direccion is null or trim(p_direccion) = '' then
    raise exception 'La dirección es obligatoria';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  -- Igual que crear_pedido(): bloquea y valida stock antes de escribir nada.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_producto from productos
      where id = (v_item->>'producto_id')::uuid
      for update;
    if not found then
      raise exception 'Uno de los productos del pedido ya no existe';
    end if;
    if v_producto.stock < (v_item->>'cantidad')::integer then
      raise exception 'Stock insuficiente para "%": quedan % unidades', v_producto.nombre, v_producto.stock;
    end if;
  end loop;

  insert into clientes (nombre, telefono, direccion)
    values (trim(p_nombre), nullif(trim(p_telefono), ''), trim(p_direccion))
    returning id into v_cliente_id;

  insert into pedidos (cliente_id, origen)
    values (v_cliente_id, 'online')
    returning * into v_pedido;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_producto from productos where id = (v_item->>'producto_id')::uuid;

    insert into pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
      values (v_pedido.id, v_producto.id, (v_item->>'cantidad')::integer, v_producto.precio);

    update productos set stock = stock - (v_item->>'cantidad')::integer where id = v_producto.id;

    v_total := v_total + v_producto.precio * (v_item->>'cantidad')::integer;
  end loop;

  update pedidos set total = v_total where id = v_pedido.id returning * into v_pedido;

  return v_pedido;
end;
$$;

grant execute on function crear_pedido_invitado(text, text, text, jsonb) to anon, authenticated;
