"""Pasaporte: sellos ganados y piezas del rompecabezas fotográfico (Dev 1, fase 3).

Regla de piezas: 1 pieza por cada reto completado (acertado o con "ver respuesta")
y 1 más al terminar la ruta, hasta el total de piezas de la foto (6).
Así la ruta de la demo (5 paradas + fin) completa la foto.
"""
from fastapi import APIRouter, Depends

from .. import db
from ..auth import perfil_id_actual

router = APIRouter(prefix="/api", tags=["pasaporte"])


def contar_piezas(retos_completados: int, ruta_terminada: bool, total: int) -> int:
    return min(total, retos_completados + (1 if ruta_terminada else 0))


@router.get("/pasaporte")
async def pasaporte(perfil_id: str = Depends(perfil_id_actual)):
    visitas = await db.seleccionar("visitas", perfil_id=f"eq.{perfil_id}", order="llegada_en.asc")
    lugares = {l["id"]: l for l in await db.seleccionar("lugares")}

    sellos = []
    for v in visitas:
        if v["reto_ok"] is None:
            continue
        l = lugares.get(v["lugar_id"], {})
        sellos.append({
            "lugar_slug": l.get("slug"),
            "nombre_es": l.get("nombre_es"),
            "nombre_en": l.get("nombre_en"),
            "categoria": l.get("categoria"),
            "ilustracion": l.get("ilustracion"),
            "acerto": v["reto_ok"],
            "tlacos": v[db.COL_PREMIO],
            "fecha": v["llegada_en"],
        })

    rutas = await db.seleccionar("rutas_usuario", perfil_id=f"eq.{perfil_id}", order="creado_en.desc", limit="1")
    ruta = rutas[0] if rutas else None
    terminada = bool(ruta and ruta["estado"] == "terminada")

    foto = None
    if ruta and ruta.get("foto_id"):
        fotos = await db.seleccionar("fotos_historicas", id=f"eq.{ruta['foto_id']}")
        foto = fotos[0] if fotos else None
    if foto is None:
        fotos = await db.seleccionar("fotos_historicas", order="id.asc", limit="1")
        foto = fotos[0] if fotos else None

    total = foto["piezas"] if foto else 6
    ganadas = contar_piezas(len(sellos), terminada, total)
    return {
        "sellos": sellos,
        "piezas": {"total": total, "ganadas": ganadas, "indices": list(range(ganadas)), "completa": ganadas >= total},
        "foto": foto,
        "ruta_terminada": terminada,
    }
