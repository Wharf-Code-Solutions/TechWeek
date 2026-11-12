"""Perfil del turista, ruta armada con sus preferencias y bono de fin de ruta (Dev 1)."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..auth import perfil_id_actual
from ..ruta import calcular_ruta

router = APIRouter(prefix="/api", tags=["rutas"])

BONO_FIN = 100  # Tlacos al terminar la ruta (una sola vez por celular)
CATEGORIAS = Literal["historia", "leyendas", "musica", "comida", "mar", "artesania"]


class PerfilIn(BaseModel):
    apodo: str | None = Field(default=None, max_length=30)
    avatar: str | None = Field(default=None, max_length=40)
    idioma: Literal["es", "en"] = "es"
    preferencias: dict = {}


class RutaIn(BaseModel):
    tiempo_min: int = Field(ge=15, le=480)  # 30, 60, 120 o 240 en la pantalla de preferencias
    intereses: list[CATEGORIAS] = []
    lat: float | None = None  # posición actual, si hay permiso de GPS
    lng: float | None = None
    demo: bool = False  # ?demo=1: las 5 paradas del guion


# ───────────── Perfil ─────────────

@router.get("/perfil")
async def ver_perfil(perfil_id: str = Depends(perfil_id_actual)):
    await db.asegurar_perfil(perfil_id)
    return (await db.seleccionar("perfiles", id=f"eq.{perfil_id}"))[0]


@router.put("/perfil")
async def guardar_perfil(datos: PerfilIn, perfil_id: str = Depends(perfil_id_actual)):
    await db.asegurar_perfil(perfil_id)
    filas = await db.actualizar("perfiles", datos.model_dump(), id=f"eq.{perfil_id}")
    return filas[0]


# ───────────── Ruta ─────────────

async def _ruta_activa(perfil_id: str) -> dict | None:
    filas = await db.seleccionar(
        "rutas_usuario", perfil_id=f"eq.{perfil_id}", estado="eq.activa", order="creado_en.desc", limit="1"
    )
    return filas[0] if filas else None


async def _con_lugares(ruta: dict) -> dict:
    """Agrega los lugares completos, en el orden guardado."""
    ids = ruta["lugares"]
    filas = await db.seleccionar("lugares", id=f"in.({','.join(map(str, ids))})") if ids else []
    por_id = {l["id"]: l for l in filas}
    return {**ruta, "lugares": [por_id[i] for i in ids if i in por_id]}


@router.post("/rutas", status_code=201)
async def crear_ruta(datos: RutaIn, perfil_id: str = Depends(perfil_id_actual)):
    """Arma la ruta con el algoritmo M3 y la guarda. Si había una activa, queda abandonada."""
    lugares = await db.seleccionar("lugares")
    if not lugares:
        raise HTTPException(503, "No hay lugares cargados")
    inicio = (datos.lat, datos.lng) if datos.lat is not None and datos.lng is not None else None
    calc = calcular_ruta(lugares, datos.tiempo_min, list(datos.intereses), inicio, datos.demo)

    await db.asegurar_perfil(perfil_id)
    await db.actualizar("rutas_usuario", {"estado": "abandonada"}, perfil_id=f"eq.{perfil_id}", estado="eq.activa")
    fotos = await db.seleccionar("fotos_historicas", order="id.asc", limit="1")
    fila = (
        await db.insertar(
            "rutas_usuario",
            {
                "perfil_id": perfil_id,
                "lugares": [l["id"] for l in calc.lugares],
                "tiempo_min": datos.tiempo_min,
                "intereses": list(datos.intereses),
                "foto_id": fotos[0]["id"] if fotos else None,
            },
        )
    )[0]
    return {**fila, "lugares": calc.lugares, "estimado_min": calc.tiempo_min, "caminata_m": calc.caminata_m}


@router.get("/rutas/actual")
async def ruta_actual(perfil_id: str = Depends(perfil_id_actual)):
    ruta = await _ruta_activa(perfil_id)
    if not ruta:
        raise HTTPException(404, "No hay ruta activa")
    return await _con_lugares(ruta)


class AjusteIn(BaseModel):
    """Saltar un lugar o recortar la ruta: se manda la lista de slugs que quedan, en orden."""
    lugares: list[str]


@router.patch("/rutas/actual")
async def ajustar_ruta(datos: AjusteIn, perfil_id: str = Depends(perfil_id_actual)):
    ruta = await _ruta_activa(perfil_id)
    if not ruta:
        raise HTTPException(404, "No hay ruta activa")
    if not datos.lugares:
        raise HTTPException(422, "La ruta necesita al menos un lugar; para acabar usa /terminar")
    filas = await db.seleccionar("lugares", slug=f"in.({','.join(datos.lugares)})")
    por_slug = {l["slug"]: l["id"] for l in filas}
    faltan = [s for s in datos.lugares if s not in por_slug]
    if faltan:
        raise HTTPException(404, f"Lugares no encontrados: {', '.join(faltan)}")
    nueva = (await db.actualizar("rutas_usuario", {"lugares": [por_slug[s] for s in datos.lugares]}, id=f"eq.{ruta['id']}"))[0]
    return await _con_lugares(nueva)


@router.post("/rutas/actual/terminar")
async def terminar_ruta(perfil_id: str = Depends(perfil_id_actual)):
    """Cierra la ruta y paga el bono de fin una sola vez, si completó al menos un reto."""
    ruta = await _ruta_activa(perfil_id)
    if not ruta:
        raise HTTPException(404, "No hay ruta activa")

    visitas = await db.seleccionar("visitas", perfil_id=f"eq.{perfil_id}")
    en_ruta = [v for v in visitas if v["lugar_id"] in ruta["lugares"]]
    retos_hechos = sum(1 for v in en_ruta if v["reto_ok"] is not None)

    bono = 0
    if retos_hechos > 0:
        ya = await db.seleccionar(db.TABLA_MOVIMIENTOS, perfil_id=f"eq.{perfil_id}", motivo="eq.bono_fin")
        if not ya:
            try:
                await db.insertar(
                    db.TABLA_MOVIMIENTOS,
                    {"perfil_id": perfil_id, "cantidad": BONO_FIN, "motivo": "bono_fin", "ref_id": ruta["id"]},
                )
                bono = BONO_FIN
            except HTTPException as e:  # 409: otra petición ya pagó el bono (índice único)
                if e.status_code != 409:
                    raise

    await db.actualizar("rutas_usuario", {"estado": "terminada"}, id=f"eq.{ruta['id']}")
    return {
        "bono": bono,
        "saldo": await db.saldo_de(perfil_id),
        "visitados": len(en_ruta),
        "retos_completados": retos_hechos,
        "total_lugares": len(ruta["lugares"]),
        "foto_id": ruta["foto_id"],
    }
