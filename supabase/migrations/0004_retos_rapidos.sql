-- JARANA · 0004 Retos rápidos: trivia, verdadero/falso e intruso.
-- Son de un toque y dan menos Tlacos (30, o 10 si se revela) para animar a visitar más lugares.

alter table public.retos drop constraint retos_tipo_check;
alter table public.retos
  add constraint retos_tipo_check
    check (tipo in ('palabras', 'orden', 'trivia', 'verdadero_falso', 'intruso'));
