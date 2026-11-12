-- JARANA · 0002 Cerrar tablas al navegador, pagos de una sola vez y canje atómico.
-- Desde aquí solo el backend FastAPI (rol service_role) lee y escribe. Ver docs/backend.md.

-- ───────────── 1. Cerrar tablas a anon y authenticated ─────────────
-- Quitamos las políticas de 0001: con RLS activo y sin políticas, nadie más que service_role entra.

drop policy "catalogo lectura" on public.lugares;
drop policy "catalogo lectura" on public.retos;
drop policy "catalogo lectura" on public.fotos_historicas;
drop policy "catalogo lectura" on public.comercios;
drop policy "catalogo lectura" on public.promociones;
drop policy "catalogo lectura" on public.eventos;
drop policy "perfil propio" on public.perfiles;
drop policy "ruta propia" on public.rutas_usuario;
drop policy "visitas propias lectura" on public.visitas;
drop policy "movimientos propios lectura" on public.movimientos_tlacos;
drop policy "canjes propios lectura" on public.canjes;

-- Además quitamos los permisos de tabla (doble candado) y los de objetos futuros.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- ───────────── 2. Pagos de una sola vez (respaldo en la base) ─────────────
-- Un premio de reto por celular y lugar, y un solo bono de fin de ruta por celular.

create unique index movimientos_reto_unico
  on public.movimientos_tlacos (perfil_id, ref_id)
  where motivo in ('reto', 'reto_revelado');

create unique index movimientos_bono_unico
  on public.movimientos_tlacos (perfil_id)
  where motivo = 'bono_fin';

-- ───────────── 3. Canje atómico ─────────────
-- Revisa saldo, descuenta y genera el código en una sola transacción.
-- El candado por perfil evita que dos toques rápidos gasten el mismo saldo.
-- Devuelve: { ok: true, codigo, saldo } o { ok: false, error: 'promocion_no_disponible' | 'saldo_insuficiente', saldo }.

create or replace function public.canjear(p_perfil_id uuid, p_promocion_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_promo  public.promociones%rowtype;
  v_saldo  integer;
  v_codigo text;
begin
  perform pg_advisory_xact_lock(hashtext(p_perfil_id::text));

  select * into v_promo
  from public.promociones
  where slug = p_promocion_slug and activa;

  select coalesce(sum(cantidad), 0)::integer into v_saldo
  from public.movimientos_tlacos
  where perfil_id = p_perfil_id;

  if v_promo.id is null then
    return jsonb_build_object('ok', false, 'error', 'promocion_no_disponible', 'saldo', v_saldo);
  end if;

  if v_saldo < v_promo.costo_tlacos then
    return jsonb_build_object('ok', false, 'error', 'saldo_insuficiente', 'saldo', v_saldo);
  end if;

  v_codigo := upper(encode(extensions.gen_random_bytes(3), 'hex'));

  insert into public.movimientos_tlacos (perfil_id, cantidad, motivo, ref_id)
  values (p_perfil_id, -v_promo.costo_tlacos, 'canje', v_promo.id);

  insert into public.canjes (perfil_id, promocion_id, codigo)
  values (p_perfil_id, v_promo.id, v_codigo);

  return jsonb_build_object('ok', true, 'codigo', v_codigo, 'saldo', v_saldo - v_promo.costo_tlacos);
end;
$$;

revoke all on function public.canjear(uuid, text) from public, anon, authenticated;
grant execute on function public.canjear(uuid, text) to service_role;
