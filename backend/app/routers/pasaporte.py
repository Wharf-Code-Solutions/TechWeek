"""Pasaporte: sellos ganados y piezas del rompecabezas fotográfico (Dev 1, fase 3).

Regla de piezas (por ruta): 1 pieza por cada reto completado en la ruta actual
(acertado o con "ver respuesta"). El total es el número de paradas de esa ruta.
Al crear otra ruta el rompecabezas vuelve a cero y cambia de imagen; los sellos se conservan.
"""
from fastapi import APIRouter, Depends

from .. import db
from ..auth import perfil_id_actual

router = APIRouter(prefix="/api", tags=["pasaporte"])


def contar_piezas(retos_completados: int, total: int) -> int:
    return max(0, min(total, retos_completados))


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
            "nombre_fr": l.get("nombre_fr"),
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

    total = len(ruta["lugares"]) if ruta else (foto["piezas"] if foto else 6)
    hechas = sum(
        1 for v in visitas
        if ruta and v.get("ruta_id") == ruta["id"] and v["reto_ok"] is not None and v["lugar_id"] in ruta["lugares"]
    )
    ganadas = contar_piezas(hechas, total)
    return {
        "sellos": sellos,
        "piezas": {"total": total, "ganadas": ganadas, "indices": list(range(ganadas)), "completa": total > 0 and ganadas >= total},
        "foto": foto,
        "ruta_terminada": terminada,
        "ruta_id": ruta["id"] if ruta else None,
    }
