-- =====================================================================
-- profiles + gate de admin por rol (reemplaza sql/admin_policies.sql).
--
-- Antes: cada política RLS de admin comparaba auth.jwt() ->> 'email'
-- contra un correo fijo escrito en el SQL. Ahora: una tabla `profiles`
-- con una columna `is_admin`, igual patrón que Bodega Cómpralo Colombia
-- y SanMiguel — agregar un admin nuevo es un UPDATE, no tocar políticas.
--
-- Pégalo una sola vez en Supabase → SQL Editor → Run.
-- =====================================================================

-- profiles: una fila por usuario autenticado (cliente o admin).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- crea la fila de profiles automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ reemplazo de sql/admin_policies.sql ============
drop policy if exists "admin_insert_productos" on productos;
drop policy if exists "admin_update_productos" on productos;
drop policy if exists "admin_delete_productos" on productos;
drop policy if exists "admin_insert_promociones" on promociones;
drop policy if exists "admin_update_promociones" on promociones;
drop policy if exists "admin_delete_promociones" on promociones;
drop policy if exists "admin_select_clientes" on clientes;
drop policy if exists "admin_update_clientes" on clientes;
drop policy if exists "admin_delete_clientes" on clientes;
drop policy if exists "admin_select_pedidos" on pedidos;
drop policy if exists "admin_update_pedidos" on pedidos;
drop policy if exists "admin_select_pedido_items" on pedido_items;
drop policy if exists "admin_delete_pedido_items" on pedido_items;

create policy "admin_insert_productos" on productos
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_update_productos" on productos
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_delete_productos" on productos
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "admin_insert_promociones" on promociones
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_update_promociones" on promociones
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_delete_promociones" on promociones
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "admin_select_clientes" on clientes
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_update_clientes" on clientes
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_delete_clientes" on clientes
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "admin_select_pedidos" on pedidos
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_update_pedidos" on pedidos
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "admin_select_pedido_items" on pedido_items
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "admin_delete_pedido_items" on pedido_items
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true));

-- Promueve al admin actual. Si en el futuro agregas otro, corre este
-- mismo UPDATE con su correo (necesita haberse registrado antes, para
-- que el trigger de arriba ya le haya creado la fila en profiles).
update public.profiles set is_admin = true where email = 'sebastian.ramos26122005@gmail.com';
