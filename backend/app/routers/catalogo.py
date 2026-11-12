"""Catálogo público de solo lectura. Reemplaza las lecturas directas a Supabase desde el navegador."""
from typing import Literal

from fastapi import APIRouter, HTTPException, Response

from .. import db
from ..retos import ocultar_respuestas

router = APIRouter(prefix="/api", tags=["catalogo"])


def _cache(res: Response) -> None:
    res.headers["Cache-Control"] = "public, max-age=300"


@router.get("/lugares")
async def lugares(res: Response):
    _cache(res)
    return await db.seleccionar("lugares", order="orden_sugerido.asc")


@router.get("/lugares/{slug}/reto")
async def reto_de_lugar(slug: str, res: Response):
    """El reto sin las respuestas correctas: se validan en el servidor al completarlo."""
    _cache(res)
    lugares = await db.seleccionar("lugares", slug=f"eq.{slug}")
    if not lugares:
        raise HTTPException(404, "Lugar no encontrado")
    retos = await db.seleccionar("retos", lugar_id=f"eq.{lugares[0]['id']}")
    if not retos:
        raise HTTPException(404, "Este lugar no tiene reto")
    r = retos[0]
    for idioma in ("es", "en"):
        r[f"contenido_{idioma}"] = ocultar_respuestas(r["tipo"], r[f"contenido_{idioma}"])
    return r


TipoComercio = Literal["cafeteria", "restaurante", "fonda", "neveria", "mercado", "libreria", "artesanias", "tienda"]


@router.get("/comercios")
async def comercios(res: Response, tipo: TipoComercio | None = None):
    """Vitrina de comercios. `?tipo=libreria` filtra; los aliados (con promoción) van primero."""
    _cache(res)
    filtros = {"order": "aliado.desc,nombre.asc"}
    if tipo:
        filtros["tipo"] = f"eq.{tipo}"
    return await db.seleccionar("comercios", **filtros)


@router.get("/promociones")
async def promociones(res: Response):
    _cache(res)
    return await db.seleccionar("promociones", activa="eq.true")


@router.get("/eventos")
async def eventos(res: Response):
    _cache(res)
    return await db.seleccionar("eventos", order="inicio.asc")


@router.get("/fotos")
async def fotos(res: Response):
    _cache(res)
    return await db.seleccionar("fotos_historicas")
