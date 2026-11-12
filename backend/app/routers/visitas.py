from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import perfil_id_actual
from ..geo import distancia_m
from ..schemas import LlegadaIn
from .rutas import ruta_activa

router = APIRouter(prefix="/api", tags=["visitas"])


@router.get("/saldo")
async def saldo(perfil_id: str = Depends(perfil_id_actual)):
    return {"saldo": await db.saldo_de(perfil_id)}


@router.post("/visitas", status_code=201)
async def registrar_llegada(datos: LlegadaIn, perfil_id: str = Depends(perfil_id_actual)):
    """Una sola vez por celular y lugar. Con método gps se valida el radio del lugar."""
    lugares = await db.seleccionar("lugares", slug=f"eq.{datos.lugar_slug}")
    if not lugares:
        raise HTTPException(404, "Lugar no encontrado")
    lugar = lugares[0]

    if datos.metodo == "gps":
        if datos.lat is None or datos.lng is None:
            raise HTTPException(422, "El método gps requiere lat y lng")
        if distancia_m(datos.lat, datos.lng, lugar["lat"], lugar["lng"]) > lugar["radio_m"]:
            raise HTTPException(403, "Estás fuera del radio del lugar")

    await db.asegurar_perfil(perfil_id)
    ruta = await ruta_activa(perfil_id)
    ruta_id = ruta["id"] if ruta else None
    # Inserta directo; si ya existía (unique perfil_id+lugar_id) no se duplica y se lee la existente.
    filas = await db.insertar(
        "visitas", {"perfil_id": perfil_id, "lugar_id": lugar["id"], "metodo": datos.metodo, "ruta_id": ruta_id},
        ignorar_duplicado=True, conflicto="perfil_id,lugar_id",
    )
    if filas:
        return filas[0]
    existente = (await db.seleccionar("visitas", perfil_id=f"eq.{perfil_id}", lugar_id=f"eq.{lugar['id']}"))[0]
    # Llegó otra vez sin haber jugado: la visita pasa a la ruta de ahora (su rompecabezas cuenta aquí).
    if ruta_id and existente["reto_ok"] is None and existente.get("ruta_id") != ruta_id:
        existente = (await db.actualizar("visitas", {"ruta_id": ruta_id}, id=f"eq.{existente['id']}"))[0]
    return existente
