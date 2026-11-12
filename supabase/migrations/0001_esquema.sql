-- Clacos · 0001 Esquema base (catálogo + progreso por celular) con RLS.
-- Todavía NO está aplicada en Supabase: se aplica cuando el equipo valide docs/contratos.md.
-- Las funciones del servidor (registrar_llegada, completar_reto, canjear) van en 0002.

-- ───────────── Catálogo (solo lectura para todos) ─────────────

create table public.lugares (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  nombre_es       text not null,
  nombre_en       text not null,
  categoria       text not null check (categoria in ('historia','leyendas','musica','comida','mar','artesania')),
  lat             double precision not null,
  lng             double precision not null,
  radio_m         integer not null default 40,
  curiosidad_es   text not null,
  curiosidad_en   text not null,
  ilustracion     text,
  orden_sugerido  integer,
  en_demo         boolean not null default false
);

create table public.retos (
  id               bigint generated always as identity primary key,
  lugar_id         bigint not null unique references public.lugares(id) on delete cascade,
  tipo             text not null check (tipo in ('palabras','orden')),
  contenido_es     jsonb not null,
  contenido_en     jsonb not null,
  clacos           integer not null check (clacos >= 0),
  clacos_revelado  integer not null check (clacos_revelado >= 0),
  intentos_max     integer not null default 3
);

create table public.fotos_historicas (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  url        text not null,
  titulo_es  text not null,
  titulo_en  text not null,
  piezas     integer not null default 6
);

create table public.comercios (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  nombre     text not null,
  categoria  text not null,
  lat        double precision not null,
  lng        double precision not null
);

create table public.promociones (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  comercio_id   bigint not null references public.comercios(id) on delete cascade,
  titulo_es     text not null,
  titulo_en     text not null,
  costo_clacos  integer not null check (costo_clacos > 0),
  activa        boolean not null default true
);

create table public.eventos (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  titulo_es  text not null,
  titulo_en  text not null,
  lugar      text,
  lat        double precision not null,
  lng        double precision not null,
  inicio     timestamptz not null,
  fin        timestamptz not null,
  categoria  text not null
);

-- ───────────── Progreso de cada celular (sesión anónima) ─────────────

create table public.perfiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  apodo         text,
  avatar        text,
  idioma        text not null default 'es' check (idioma in ('es','en')),
  preferencias  jsonb not null default '{}'::jsonb,
  creado_en     timestamptz not null default now()
);

create table public.rutas_usuario (
  id          bigint generated always as identity primary key,
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  lugares     bigint[] not null,            -- ids de lugares en orden
  tiempo_min  integer not null,
  intereses   text[] not null default '{}',
  foto_id     bigint references public.fotos_historicas(id),
  estado      text not null default 'activa' check (estado in ('activa','terminada','abandonada')),
  creado_en   timestamptz not null default now()
);

-- Las tres tablas siguientes solo las escriben funciones del servidor (0002).
create table public.visitas (
  id          bigint generated always as identity primary key,
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  lugar_id    bigint not null references public.lugares(id),
  llegada_en  timestamptz not null default now(),
  metodo      text not null check (metodo in ('gps','demo')),
  reto_ok     boolean,
  clacos      integer not null default 0,
  unique (perfil_id, lugar_id)
);

create table public.movimientos_clacos (
  id          bigint generated always as identity primary key,
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  cantidad    integer not null check (cantidad <> 0),
  motivo      text not null check (motivo in ('reto','reto_revelado','bono_fin','canje')),
  ref_id      bigint,
  creado_en   timestamptz not null default now()
);

create table public.canjes (
  id             bigint generated always as identity primary key,
  perfil_id      uuid not null references public.perfiles(id) on delete cascade,
  promocion_id   bigint not null references public.promociones(id),
  codigo         text not null unique,
  canjeado_en    timestamptz not null default now()
);

create index on public.movimientos_clacos (perfil_id);
create index on public.rutas_usuario (perfil_id);

-- Saldo = suma del libro de Clacos. security_invoker respeta el RLS de quien consulta.
create view public.saldo with (security_invoker = true) as
  select perfil_id, coalesce(sum(cantidad), 0)::integer as clacos
  from public.movimientos_clacos
  group by perfil_id;

-- ───────────── RLS ─────────────

alter table public.lugares            enable row level security;
alter table public.retos              enable row level security;
alter table public.fotos_historicas   enable row level security;
alter table public.comercios          enable row level security;
alter table public.promociones        enable row level security;
alter table public.eventos            enable row level security;
alter table public.perfiles           enable row level security;
alter table public.rutas_usuario      enable row level security;
alter table public.visitas            enable row level security;
alter table public.movimientos_clacos enable row level security;
alter table public.canjes             enable row level security;

-- Catálogo: lectura pública, sin escritura desde el navegador.
create policy "catalogo lectura" on public.lugares          for select using (true);
create policy "catalogo lectura" on public.retos            for select using (true);
create policy "catalogo lectura" on public.fotos_historicas for select using (true);
create policy "catalogo lectura" on public.comercios        for select using (true);
create policy "catalogo lectura" on public.promociones      for select using (true);
create policy "catalogo lectura" on public.eventos          for select using (true);

-- Perfil y ruta: el dueño lee y edita lo suyo.
create policy "perfil propio" on public.perfiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "ruta propia" on public.rutas_usuario
  for all using (perfil_id = (select auth.uid())) with check (perfil_id = (select auth.uid()));

-- Visitas, movimientos y canjes: el dueño solo LEE. Escriben las funciones (security definer).
create policy "visitas propias lectura" on public.visitas
  for select using (perfil_id = (select auth.uid()));
create policy "movimientos propios lectura" on public.movimientos_clacos
  for select using (perfil_id = (select auth.uid()));
create policy "canjes propios lectura" on public.canjes
  for select using (perfil_id = (select auth.uid()));
