from fastapi import APIRouter, Depends, HTTPException

import time

from .. import db
from ..afluencia import llegadas_recientes
from ..auth import perfil_id_actual
from ..geo import distancia_m
from ..ruta import CAPACIDAD_POR_HORA, nivel_afluencia, ocupacion
from ..schemas import LlegadaIn
from .rutas import ruta_activa

router = APIRouter(prefix="/api", tags=["visitas"])


@router.get("/saldo")
async def saldo(perfil_id: str = Depends(perfil_id_actual)):
    return {"saldo": await db.saldo_de(perfil_id)}


@router.post("/visitas", status_code=201)
async def registrar_llegada(datos: LlegadaIn, perfil_id: str = Depends(perfil_id_actual)):
    """Una sola vez por celular y lugar. Siempre se valida el radio del lugar con las coordenadas enviadas."""
    lugares = await db.seleccionar("lugares", slug=f"eq.{datos.lugar_slug}")
    if not lugares:
        raise HTTPException(404, "Lugar no encontrado")
    lugar = lugares[0]

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


_cache_afluencia: dict = {"hasta": 0.0, "datos": []}
TTL_AFLUENCIA_S = 30  # la app consulta seguido; con mucha gente no se pega a la base en cada petición


@router.get("/afluencia")
async def afluencia(perfil_id: str = Depends(perfil_id_actual)):
    """Nivel de afluencia de cada lugar (tranquilo, concurrido o lleno), para avisar y sugerir alternativas."""
    if time.monotonic() >= _cache_afluencia["hasta"]:
        conteo = await llegadas_recientes()
        datos = []
        for l in await db.seleccionar("lugares"):
            ocup = ocupacion(l, conteo)
            datos.append({
                "slug": l["slug"],
                "llegadas": conteo.get(l["id"], 0),
                "capacidad": l.get("capacidad") or CAPACIDAD_POR_HORA,
                "ocupacion": round(ocup, 2),
                "nivel": nivel_afluencia(ocup),
            })
        _cache_afluencia.update(hasta=time.monotonic() + TTL_AFLUENCIA_S, datos=datos)
    return _cache_afluencia["datos"]
