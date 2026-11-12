"""M3 · Algoritmo de ruta (Dev 1). Lógica pura: no habla con la base, se prueba sola.

Elige los lugares que caben en el tiempo del turista, prioriza sus intereses
y los ordena para caminar lo menos posible (vecino más cercano).
"""
from dataclasses import dataclass

from .geo import distancia_m

VELOCIDAD_M_MIN = 75  # caminata tranquila de turista (~4.5 km/h)
FACTOR_CALLES = 1.3  # las calles no van en línea recta
MIN_POR_PARADA = 10  # leer la curiosidad + jugar el reto


@dataclass
class RutaCalculada:
    lugares: list[dict]  # en orden de visita
    tiempo_min: int  # estimado total (caminata + paradas)
    caminata_m: int


def minutos_caminando(metros: float) -> float:
    return metros * FACTOR_CALLES / VELOCIDAD_M_MIN


def _ordenar(lugares: list[dict], inicio: tuple[float, float] | None) -> list[dict]:
    """Vecino más cercano desde el inicio (o desde el de menor orden sugerido)."""
    pendientes = sorted(lugares, key=lambda l: l.get("orden_sugerido") or 999)
    if not pendientes:
        return []
    if inicio is None:
        actual = pendientes.pop(0)
        orden = [actual]
    else:
        orden, actual = [], None
    pos = inicio if actual is None else (actual["lat"], actual["lng"])
    while pendientes:
        sig = min(pendientes, key=lambda l: distancia_m(pos[0], pos[1], l["lat"], l["lng"]))
        pendientes.remove(sig)
        orden.append(sig)
        pos = (sig["lat"], sig["lng"])
    return orden


def _medir(orden: list[dict], inicio: tuple[float, float] | None) -> tuple[float, float]:
    """Devuelve (minutos totales, metros caminados) de una ruta ya ordenada."""
    metros = 0.0
    pos = inicio
    for l in orden:
        if pos is not None:
            metros += distancia_m(pos[0], pos[1], l["lat"], l["lng"])
        pos = (l["lat"], l["lng"])
    return minutos_caminando(metros) + MIN_POR_PARADA * len(orden), metros


def calcular_ruta(
    lugares: list[dict],
    tiempo_min: int,
    intereses: list[str],
    inicio: tuple[float, float] | None = None,
    demo: bool = False,
) -> RutaCalculada:
    """Arma la ruta.

    - `demo=True`: las paradas marcadas `en_demo`, en su orden sugerido (guion de 4 minutos).
    - Si no: primero los lugares de sus intereses (en orden sugerido), luego el resto,
      y se agregan mientras la ruta completa quepa en `tiempo_min`. Siempre hay al menos 1 parada.
    """
    if demo:
        orden = sorted((l for l in lugares if l.get("en_demo")), key=lambda l: l.get("orden_sugerido") or 999)
        minutos, metros = _medir(orden, inicio)
        return RutaCalculada(orden, round(minutos), round(metros))

    gustos = set(intereses)
    candidatos = sorted(
        lugares,
        key=lambda l: (0 if not gustos or l["categoria"] in gustos else 1, l.get("orden_sugerido") or 999),
    )

    elegidos: list[dict] = []
    for c in candidatos:
        prueba = _ordenar(elegidos + [c], inicio)
        minutos, _ = _medir(prueba, inicio)
        if minutos <= tiempo_min or not elegidos:
            elegidos.append(c)

    orden = _ordenar(elegidos, inicio)
    minutos, metros = _medir(orden, inicio)
    return RutaCalculada(orden, round(minutos), round(metros))
