"""Afluencia: cuánta gente llegó a cada lugar en la última hora (sale de las visitas registradas)."""
from datetime import datetime, timedelta, timezone

from . import db
from .ruta import VENTANA_AFLUENCIA_MIN


async def llegadas_recientes() -> dict[int, int]:
    """id de lugar -> llegadas de los últimos VENTANA_AFLUENCIA_MIN minutos. Cada celular cuenta una vez por lugar."""
    desde = (datetime.now(timezone.utc) - timedelta(minutes=VENTANA_AFLUENCIA_MIN)).isoformat()
    filas = await db.seleccionar("visitas", select="lugar_id", llegada_en=f"gte.{desde}")
    conteo: dict[int, int] = {}
    for f in filas:
        conteo[f["lugar_id"]] = conteo.get(f["lugar_id"], 0) + 1
    return conteo


async def rutas_planificadas(excepto_perfil: str | None = None) -> dict[int, int]:
    """id de lugar -> rutas activas, creadas en la última ventana, que lo incluyen.

    Es la gente que va en camino: sus llegadas todavía no están en `visitas`, y sin contarlas
    muchas solicitudes seguidas recibirían la misma ruta. Se deja fuera la ruta que va a reemplazar `excepto_perfil`.
    """
    desde = (datetime.now(timezone.utc) - timedelta(minutes=VENTANA_AFLUENCIA_MIN)).isoformat()
    filas = await db.seleccionar("rutas_usuario", select="perfil_id,lugares", estado="eq.activa", creado_en=f"gte.{desde}")
    conteo: dict[int, int] = {}
    for f in filas:
        if f["perfil_id"] == excepto_perfil:
            continue
        for lugar_id in f["lugares"]:
            conteo[lugar_id] = conteo.get(lugar_id, 0) + 1
    return conteo


async def carga_actual(excepto_perfil: str | None = None) -> dict[int, int]:
    """Carga de cada lugar: lo mayor entre quienes ya llegaron y quienes van en camino.

    Se toma el mayor y no la suma porque quien sigue su ruta y llega ya está en las dos cuentas.
    """
    llegadas, planificadas = await llegadas_recientes(), await rutas_planificadas(excepto_perfil)
    return {i: max(llegadas.get(i, 0), planificadas.get(i, 0)) for i in llegadas.keys() | planificadas.keys()}
