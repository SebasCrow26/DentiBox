-- =====================================================================
-- Políticas RLS para el administrador — acceso total gateado por correo.
-- Aditivo: no toca las políticas de cliente que ya existen, solo agrega
-- las que le faltaban al admin (que hasta ahora solo tenía select
-- público en productos/promociones, igual que cualquier visitante).
--
-- Pégalo una sola vez en Supabase → SQL Editor → Run.
--
-- Si en el futuro agregas más administradores, cambia la condición
-- `auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com'`
-- por `auth.jwt() ->> 'email' = any(array['correo1@x.com','correo2@x.com'])`
-- en cada política de abajo.
-- =====================================================================

-- PRODUCTOS: el admin puede crear/editar/eliminar (el select público ya existe)
create policy "admin_insert_productos" on productos
  for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_update_productos" on productos
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_delete_productos" on productos
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

-- PROMOCIONES: igual, el select público ya existe
create policy "admin_insert_promociones" on promociones
  for insert to authenticated
  with check (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_update_promociones" on promociones
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_delete_promociones" on promociones
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

-- CLIENTES: el admin ve y edita todas las fichas (no solo la propia)
create policy "admin_select_clientes" on clientes
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_update_clientes" on clientes
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_delete_clientes" on clientes
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

-- PEDIDOS: el admin ve todos y actualiza estado (alistado/entregado/cancelado)
create policy "admin_select_pedidos" on pedidos
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_update_pedidos" on pedidos
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

-- PEDIDO_ITEMS: el admin ve todos y puede quitar un producto de un pedido
create policy "admin_select_pedido_items" on pedido_items
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');

create policy "admin_delete_pedido_items" on pedido_items
  for delete to authenticated
  using (auth.jwt() ->> 'email' = 'sebastian.ramos26122005@gmail.com');
