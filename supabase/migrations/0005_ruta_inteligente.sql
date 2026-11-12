-- JARANA · 0005 Rompecabezas por ruta, puntos por distancia y compartir.
-- Aplicar DESPUÉS de 0004. La escribió Dev 3 (Manuel); la aplica Dev 1 (administra Supabase).
-- Aplícala ANTES de desplegar el backend nuevo: registrar_llegada ya escribe visitas.ruta_id.

-- 1. Cada visita recuerda la ruta en la que se hizo: así el rompecabezas cuenta por ruta
--    y se reinicia al crear otra (los sellos y los Tlacos se conservan).
alter table public.visitas
  add column ruta_id bigint references public.rutas_usuario(id) on delete set null;
create index visitas_ruta_idx on public.visitas (ruta_id);

-- 2. Nuevos motivos de movimiento: puntos por distancia y compartir la ruta.
alter table public.movimientos_tlacos drop constraint movimientos_tlacos_motivo_check;
alter table public.movimientos_tlacos
  add constraint movimientos_tlacos_motivo_check
  check (motivo in ('reto', 'reto_revelado', 'bono_fin', 'canje', 'distancia', 'compartir'));

-- Distancia y compartir se pagan una sola vez por ruta (ref_id = id de la ruta).
create unique index movimientos_ruta_unico
  on public.movimientos_tlacos (perfil_id, motivo, ref_id)
  where motivo in ('distancia', 'compartir');

-- 3. Varias imágenes para el rompecabezas: cada ruta nueva elige una distinta de la anterior.
--    Mientras no haya fotos históricas con permiso, 5 postales ilustradas propias (public/rompecabezas/).
insert into public.fotos_historicas (slug, url, titulo_es, titulo_en, piezas) values
  ('postal-faro',      '/rompecabezas/faro.svg',      'Faro Carranza al amanecer',      'Carranza Lighthouse at dawn',  6),
  ('postal-baluarte',  '/rompecabezas/baluarte.svg',  'Baluarte de Santiago',            'Santiago Bulwark',             6),
  ('postal-catedral',  '/rompecabezas/catedral.svg',  'Catedral y portales',             'Cathedral and arcades',        6),
  ('postal-danzon',    '/rompecabezas/danzon.svg',    'Noche de danzón en el Zócalo',    'Danzón night at the Zócalo',   6),
  ('postal-puerto',    '/rompecabezas/puerto.svg',    'El puerto de Veracruz',           'The port of Veracruz',         6)
on conflict (slug) do nothing;
