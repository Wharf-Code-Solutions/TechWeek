-- JARANA · 0003 Vitrina de comercios (restaurantes, cafés, tiendas, artesanías y librerías).
-- Amplía la tabla comercios con lo que muestra la tarjeta de la vitrina. Sin precio ni enlaces externos.
-- foto_url queda vacío: el equipo agrega las fotos (public/comercios/) cuando las tenga con permiso.

alter table public.comercios
  add column tipo            text,
  add column descripcion_es  text,
  add column descripcion_en  text,
  add column dato_es         text,           -- etiqueta destacada opcional ("Desde 1808")
  add column dato_en         text,
  add column direccion       text,
  add column horario_es      text,
  add column horario_en      text,
  add column foto_url        text,
  add column aliado          boolean not null default false;  -- tiene promoción en JARANA

-- Los 4 comercios existentes son los aliados de las promociones.
update public.comercios set aliado = true;
update public.comercios set tipo = case slug
    when 'comercio-cafe' then 'cafeteria'
    when 'comercio-volovan' then 'fonda'
    when 'comercio-nieve' then 'neveria'
    when 'comercio-lancha' then 'artesanias'
  end;

alter table public.comercios
  alter column tipo set not null,
  add constraint comercios_tipo_check
    check (tipo in ('cafeteria', 'restaurante', 'fonda', 'neveria', 'mercado', 'libreria', 'artesanias', 'tienda'));

create index comercios_tipo_idx on public.comercios (tipo);
