-- =====================================================================
-- Esquema base de DentiBox. CORRE ESTE ARCHIVO PRIMERO, antes que
-- cualquier otro en sql/ — los demás (crear_pedido.sql,
-- crear_pedido_invitado.sql, profiles_and_admin.sql) asumen que estas
-- tablas ya existen.
--
-- Pégalo una sola vez en Supabase → SQL Editor → Run.
-- =====================================================================

create extension if not exists pg_trgm;

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  email text,
  foto_fachada_url text,
  auth_user_id uuid unique references auth.users(id),
  created_at timestamptz default now()
);
create index clientes_nombre_idx on clientes using gin (nombre gin_trgm_ops);

create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  stock integer not null default 0,
  imagen_url text,
  categoria text,
  activo boolean default true,
  created_at timestamptz default now()
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido bigserial unique,
  cliente_id uuid references clientes(id) not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','alistado','entregado','cancelado')),
  origen text not null default 'online'
    check (origen in ('online','presencial')),
  total numeric(10,2) not null default 0,
  created_at timestamptz default now(),
  entregado_at timestamptz
);

create table pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade not null,
  producto_id uuid references productos(id) not null,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) generated always as (cantidad * precio_unitario) stored
);

create table facturas (
  id uuid primary key default gen_random_uuid(),
  numero_factura bigserial unique,
  pedido_id uuid references pedidos(id) unique not null,
  cliente_id uuid references clientes(id) not null,
  total numeric(10,2) not null,
  created_at timestamptz default now()
);

create table promociones (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references productos(id),
  tipo text not null check (tipo in ('dia','semana','mes')),
  precio_promocional numeric(10,2),
  fecha_inicio date not null,
  fecha_fin date not null,
  activo boolean default true
);

create table solicitudes_producto (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) not null,
  descripcion text not null,
  estado text default 'pendiente' check (estado in ('pendiente','resuelto')),
  created_at timestamptz default now()
);

-- ============ RLS: clientes ven/editan solo su propia ficha ============
alter table clientes enable row level security;
create policy "clientes_select_own" on clientes
  for select using (auth_user_id = auth.uid());
create policy "clientes_insert_own" on clientes
  for insert with check (auth_user_id = auth.uid());
create policy "clientes_update_own" on clientes
  for update using (auth_user_id = auth.uid());

-- ============ RLS: pedidos/pedido_items — el cliente ve solo los suyos ============
-- (los INSERT reales de checkout pasan por las RPC crear_pedido /
--  crear_pedido_invitado, que son security definer y no dependen de estas
--  políticas — esto es solo para que un cliente logueado pueda VER su
--  propio historial desde /cuenta)
alter table pedidos enable row level security;
create policy "pedidos_select_own" on pedidos
  for select using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

alter table pedido_items enable row level security;
create policy "pedido_items_select_own" on pedido_items
  for select using (
    pedido_id in (
      select id from pedidos where cliente_id in (select id from clientes where auth_user_id = auth.uid())
    )
  );

-- ============ RLS: solicitudes_producto — el cliente ve/crea las suyas ============
alter table solicitudes_producto enable row level security;
create policy "solicitudes_select_own" on solicitudes_producto
  for select using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));
create policy "solicitudes_insert_own" on solicitudes_producto
  for insert with check (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

-- ============ RLS: catálogo público (cualquiera, logueado o no) ============
alter table productos enable row level security;
create policy "productos_select_public" on productos
  for select using (true);

alter table promociones enable row level security;
create policy "promociones_select_public" on promociones
  for select using (true);

-- facturas: sin políticas de cliente todavía (nadie las usa aún desde la
-- app) — RLS queda activado y por defecto niega todo hasta que se necesite.
alter table facturas enable row level security;
