-- =====================================================================
-- crear_pedido(p_cliente_id, p_items)
--
-- Crea un pedido completo (pedidos + pedido_items) y descuenta el stock
-- de forma atómica. Se ejecuta como función de Postgres (RPC) porque:
--   - los clientes NO tienen permiso UPDATE sobre `productos` (solo
--     select público, ver RLS existente), así que el stock no se puede
--     descontar directo desde el navegador
--   - hace falta bloquear las filas de producto (FOR UPDATE) para que
--     dos clientes comprando al mismo tiempo no vendan más stock del
--     que hay disponible
--
-- Pégalo una sola vez en Supabase → SQL Editor → Run.
--
-- Uso desde el navegador (ver js/cart.js):
--   supabase.rpc('crear_pedido', {
--     p_cliente_id: '...uuid del cliente...',
--     p_items: [{ producto_id: '...', cantidad: 2 }, ...]
--   })
-- =====================================================================

create or replace function crear_pedido(p_cliente_id uuid, p_items jsonb)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
  v_item jsonb;
  v_producto productos%rowtype;
  v_total numeric(10,2) := 0;
begin
  if p_cliente_id is distinct from (select id from clientes where auth_user_id = auth.uid()) then
    raise exception 'No autorizado para crear pedidos a nombre de este cliente';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  -- Primero se valida y bloquea el stock de todos los productos
  -- (evita sobreventa si dos clientes compran al mismo tiempo).
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

  insert into pedidos (cliente_id, origen)
    values (p_cliente_id, 'online')
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

grant execute on function crear_pedido(uuid, jsonb) to authenticated;
