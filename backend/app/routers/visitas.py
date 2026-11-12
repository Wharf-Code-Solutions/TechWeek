from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import perfil_id_actual
from ..geo import distancia_m
from ..schemas import LlegadaIn

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
    existente = await db.seleccionar("visitas", perfil_id=f"eq.{perfil_id}", lugar_id=f"eq.{lugar['id']}")
    if existente:
        return existente[0]
    filas = await db.insertar(
        "visitas", {"perfil_id": perfil_id, "lugar_id": lugar["id"], "metodo": datos.metodo}
    )
    return filas[0]
