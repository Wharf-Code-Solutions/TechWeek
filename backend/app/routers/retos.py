from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import perfil_id_actual
from ..retos import respuesta_correcta, validar
from ..schemas import RetoIn, RetoOut

router = APIRouter(prefix="/api", tags=["retos"])


@router.post("/retos/{lugar_slug}/completar", response_model=RetoOut)
async def completar_reto(lugar_slug: str, datos: RetoIn, perfil_id: str = Depends(perfil_id_actual)):
    """Valida la respuesta en el servidor y paga una sola vez.

    Nunca bloquea al turista: con `revelar` se cierra el reto con el premio reducido.
    """
    # Una sola consulta: el lugar con su reto y la visita de este celular (embebidos por PostgREST).
    lugares = await db.seleccionar(
        "lugares",
        slug=f"eq.{lugar_slug}",
        select="id,retos(*),visitas(id,reto_ok)",
        **{"visitas.perfil_id": f"eq.{perfil_id}"},
    )
    if not lugares:
        raise HTTPException(404, "Lugar no encontrado")
    lugar_id = lugares[0]["id"]

    visitas = lugares[0].get("visitas") or []
    if not visitas:
        raise HTTPException(409, "Primero registra la llegada al lugar")
    if visitas[0]["reto_ok"] is not None:
        return RetoOut(
            correcto=bool(visitas[0]["reto_ok"]), completado=True, tlacos_ganados=0,
            saldo=await db.saldo_de(perfil_id), ya_visitado=True,
        )

    retos = lugares[0].get("retos")
    reto = (retos[0] if retos else None) if isinstance(retos, list) else retos
    if not reto:
        raise HTTPException(404, "Este lugar no tiene reto")

    # El francés que aún no esté traducido se juega (y se valida) en inglés, igual que en la app.
    contenido = reto.get(f"contenido_{datos.idioma}") or reto["contenido_en"]
    correcto = validar(reto["tipo"], contenido, datos.respuesta)
    if not correcto and not datos.revelar:
        return RetoOut(correcto=False, completado=False, tlacos_ganados=0, saldo=await db.saldo_de(perfil_id))

    premio = reto[db.COL_PREMIO] if correcto else reto[db.COL_PREMIO_REVELADO]
    motivo = "reto" if correcto else "reto_revelado"

    # Actualización condicional: solo una petición puede pasar reto_ok de null a un valor.
    cerrada = await db.actualizar(
        "visitas",
        {"reto_ok": correcto, db.COL_PREMIO: premio},
        perfil_id=f"eq.{perfil_id}",
        lugar_id=f"eq.{lugar_id}",
        reto_ok="is.null",
    )
    if not cerrada:
        raise HTTPException(409, "El reto ya fue completado")

    if premio > 0:
        await db.insertar(
            db.TABLA_MOVIMIENTOS,
            {"perfil_id": perfil_id, "cantidad": premio, "motivo": motivo, "ref_id": lugar_id},
        )
    return RetoOut(
        correcto=correcto, completado=True, tlacos_ganados=premio, saldo=await db.saldo_de(perfil_id),
        respuesta_correcta=respuesta_correcta(reto["tipo"], contenido),
    )
