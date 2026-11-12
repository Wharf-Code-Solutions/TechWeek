-- JARANA · 0006 Francés.
-- Aplicar DESPUÉS de 0005 y ANTES de desplegar el backend nuevo. La aplica Dev 1 (administra Supabase).
-- Columnas _fr opcionales: si un texto aún no está en francés, la app muestra el inglés.

alter table public.lugares
  add column nombre_fr     text,
  add column curiosidad_fr text;

alter table public.retos
  add column contenido_fr jsonb;

alter table public.fotos_historicas
  add column titulo_fr text;

alter table public.promociones
  add column titulo_fr text;

alter table public.eventos
  add column titulo_fr text;

alter table public.comercios
  add column descripcion_fr text,
  add column dato_fr        text,
  add column horario_fr     text;

-- El perfil puede guardar el francés como idioma.
alter table public.perfiles drop constraint if exists perfiles_idioma_check;
alter table public.perfiles
  add constraint perfiles_idioma_check check (idioma in ('es', 'en', 'fr'));
