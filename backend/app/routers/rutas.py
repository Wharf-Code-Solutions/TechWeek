"""Perfil del turista, ruta armada con sus preferencias y bono de fin de ruta (Dev 1)."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..auth import perfil_id_actual
import random

from ..ruta import calcular_ruta, metros_entre_paradas, tlacos_por_distancia

router = APIRouter(prefix="/api", tags=["rutas"])

BONO_FIN = 100  # doblones al terminar la ruta (una sola vez por celular)
BONO_COMPARTIR = 30  # doblones por compartir una ruta terminada (una sola vez por celular)
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

async def ruta_activa(perfil_id: str) -> dict | None:
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


async def elegir_foto(ultima_id: int | None) -> int | None:
    """Imagen del rompecabezas: al azar, distinta de la última ruta cuando hay más de una."""
    fotos = await db.seleccionar("fotos_historicas", order="id.asc")
    if not fotos:
        return None
    otras = [f for f in fotos if f["id"] != ultima_id]
    return random.choice(otras or fotos)["id"]


@router.post("/rutas", status_code=201)
async def crear_ruta(datos: RutaIn, perfil_id: str = Depends(perfil_id_actual)):
    """Arma la ruta con el algoritmo M3 y la guarda. Si había una activa, queda abandonada."""
    lugares = await db.seleccionar("lugares")
    if not lugares:
        raise HTTPException(503, "No hay lugares cargados")
    inicio = (datos.lat, datos.lng) if datos.lat is not None and datos.lng is not None else None
    # Los lugares con sello (reto completado) no se vuelven a ofrecer: ya no dan doblones.
    visitas = await db.seleccionar("visitas", perfil_id=f"eq.{perfil_id}")
    visitados = {v["lugar_id"] for v in visitas if v["reto_ok"] is not None}
    calc = calcular_ruta(lugares, datos.tiempo_min, list(datos.intereses), inicio, visitados=visitados)

    await db.asegurar_perfil(perfil_id)
    anterior = await db.seleccionar("rutas_usuario", perfil_id=f"eq.{perfil_id}", order="creado_en.desc", limit="1")
    await db.actualizar("rutas_usuario", {"estado": "abandonada"}, perfil_id=f"eq.{perfil_id}", estado="eq.activa")
    foto_id = await elegir_foto(anterior[0].get("foto_id") if anterior else None)
    fila = (
        await db.insertar(
            "rutas_usuario",
            {
                "perfil_id": perfil_id,
                "lugares": [l["id"] for l in calc.lugares],
                "tiempo_min": datos.tiempo_min,
                "intereses": list(datos.intereses),
                "foto_id": foto_id,
            },
        )
    )[0]
    return {**fila, "lugares": calc.lugares, "estimado_min": calc.tiempo_min, "caminata_m": calc.caminata_m}


@router.get("/rutas/actual")
async def ruta_actual(perfil_id: str = Depends(perfil_id_actual)):
    ruta = await ruta_activa(perfil_id)
    if not ruta:
        raise HTTPException(404, "No hay ruta activa")
    return await _con_lugares(ruta)


class AjusteIn(BaseModel):
    """Saltar un lugar o recortar la ruta: se manda la lista de slugs que quedan, en orden."""
    lugares: list[str]


@router.patch("/rutas/actual")
async def ajustar_ruta(datos: AjusteIn, perfil_id: str = Depends(perfil_id_actual)):
    ruta = await ruta_activa(perfil_id)
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
    ruta = await ruta_activa(perfil_id)
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

    # Puntos por distancia: 1 doblón por 100 m entre las paradas completadas (tope 60), una vez por ruta.
    hechas = sorted(
        (v for v in en_ruta if v.get("ruta_id") == ruta["id"] and v["reto_ok"] is not None),
        key=lambda v: v["llegada_en"],
    )
    por_id = {l["id"]: l for l in await db.seleccionar("lugares", id=f"in.({','.join(str(v['lugar_id']) for v in hechas)})")} if hechas else {}
    metros = metros_entre_paradas([por_id[v["lugar_id"]] for v in hechas if v["lugar_id"] in por_id])
    por_distancia = 0
    if tlacos_por_distancia(metros) > 0:
        try:
            await db.insertar(
                db.TABLA_MOVIMIENTOS,
                {"perfil_id": perfil_id, "cantidad": tlacos_por_distancia(metros), "motivo": "distancia", "ref_id": ruta["id"]},
            )
            por_distancia = tlacos_por_distancia(metros)
        except HTTPException as e:  # 409: ya se pagó la distancia de esta ruta
            if e.status_code != 409:
                raise

    await db.actualizar("rutas_usuario", {"estado": "terminada"}, id=f"eq.{ruta['id']}")
    return {
        "ruta_id": ruta["id"],
        "bono": bono,
        "distancia_m": round(metros),
        "tlacos_distancia": por_distancia,
        "saldo": await db.saldo_de(perfil_id),
        "visitados": len(en_ruta),
        "retos_completados": retos_hechos,
        "total_lugares": len(ruta["lugares"]),
        "foto_id": ruta["foto_id"],
    }


@router.post("/rutas/{ruta_id}/compartir")
async def compartir_ruta(ruta_id: int, perfil_id: str = Depends(perfil_id_actual)):
    """+30 doblones una sola vez por celular (con una ruta terminada). No se puede verificar que de verdad compartió: premia el intento."""
    rutas = await db.seleccionar("rutas_usuario", id=f"eq.{ruta_id}", perfil_id=f"eq.{perfil_id}")
    if not rutas:
        raise HTTPException(404, "Ruta no encontrada")
    if rutas[0]["estado"] != "terminada":
        raise HTTPException(409, "Solo se puede compartir una ruta terminada")
    tlacos = 0
    try:
        await db.insertar(
            db.TABLA_MOVIMIENTOS,
            {"perfil_id": perfil_id, "cantidad": BONO_COMPARTIR, "motivo": "compartir", "ref_id": ruta_id},
        )
        tlacos = BONO_COMPARTIR
    except HTTPException as e:  # 409: este celular ya cobró el bono por compartir (índice único)
        if e.status_code != 409:
            raise
    return {"tlacos": tlacos, "saldo": await db.saldo_de(perfil_id)}
