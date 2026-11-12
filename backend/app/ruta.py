"""M3 · Algoritmo de ruta (Dev 1). Lógica pura: no habla con la base, se prueba sola.

1. Excluye los lugares ya visitados.
2. Puntúa cada lugar (interés = 3, otro = 1) y elige el conjunto que más puntos da
   dentro del tiempo del turista (voraz por puntos por minuto adicional).
3. Ordena como ruta abierta desde el inicio: vecino más cercano + mejora 2-opt.

Afluencia: cada lugar tiene una capacidad por hora y un conteo de llegadas recientes. Un lugar
concurrido pierde puntos, uno lleno se deja fuera mientras haya alternativas, así la gente se reparte sola.
"""
from dataclasses import dataclass

from .geo import distancia_m

VELOCIDAD_M_MIN = 75  # caminata tranquila de turista (~4.5 km/h)
FACTOR_CALLES = 1.3  # las calles no van en línea recta
MIN_POR_PARADA = 10  # leer la curiosidad + jugar el reto
PUNTOS_INTERES = 3
PUNTOS_OTRO = 1
MIN_PARADAS = 3  # si caben, la ruta no se queda con menos

CAPACIDAD_POR_HORA = 30  # llegadas por hora que un lugar absorbe bien, si el lugar no trae `capacidad`
VENTANA_AFLUENCIA_MIN = 60  # las llegadas de la última hora cuentan como "gente en el lugar"
TRANQUILO, CONCURRIDO, LLENO = "tranquilo", "concurrido", "lleno"
UMBRAL_CONCURRIDO = 0.5  # ocupación (llegadas / capacidad) desde la que se avisa "concurrido"
UMBRAL_LLENO = 1.0  # desde aquí el lugar se considera lleno
PENDIENTE_PESO = 2.0  # qué tan rápido pierde peso un lugar al pasar de concurrido (mayor = más rápido)


@dataclass
class RutaCalculada:
    lugares: list[dict]  # en orden de visita
    tiempo_min: int  # estimado total (caminata + paradas)
    caminata_m: int


def minutos_caminando(metros: float) -> float:
    return metros * FACTOR_CALLES / VELOCIDAD_M_MIN


def _d(a: tuple[float, float], l: dict) -> float:
    return distancia_m(a[0], a[1], l["lat"], l["lng"])


def _largo(orden: list[dict], inicio: tuple[float, float] | None) -> float:
    """Metros de caminata de una ruta abierta ya ordenada."""
    metros, pos = 0.0, inicio
    for l in orden:
        if pos is not None:
            metros += _d(pos, l)
        pos = (l["lat"], l["lng"])
    return metros


def _vecino(lugares: list[dict], primero: dict | None, inicio: tuple[float, float] | None) -> list[dict]:
    pendientes = list(lugares)
    orden: list[dict] = []
    pos = inicio
    if primero is not None:
        pendientes.remove(primero)
        orden.append(primero)
        pos = (primero["lat"], primero["lng"])
    while pendientes:
        sig = min(pendientes, key=lambda l: _d(pos, l))
        pendientes.remove(sig)
        orden.append(sig)
        pos = (sig["lat"], sig["lng"])
    return orden


def _dos_opt(orden: list[dict], inicio: tuple[float, float] | None) -> list[dict]:
    """Invierte tramos mientras acorten la caminata (ruta abierta: el final también se puede invertir)."""
    mejor = list(orden)
    largo = _largo(mejor, inicio)
    mejoro = True
    while mejoro:
        mejoro = False
        for i in range(len(mejor) - 1):
            for j in range(i + 1, len(mejor)):
                prueba = mejor[:i] + mejor[i : j + 1][::-1] + mejor[j + 1 :]
                l = _largo(prueba, inicio)
                if l < largo - 1e-6:
                    mejor, largo, mejoro = prueba, l, True
    return mejor


def _ordenar(lugares: list[dict], inicio: tuple[float, float] | None) -> list[dict]:
    """Ruta abierta corta desde `inicio`. Sin inicio, prueba salir de cada lugar y se queda con la más corta."""
    if not lugares:
        return []
    if inicio is not None:
        return _dos_opt(_vecino(lugares, None, inicio), inicio)
    opciones = (_dos_opt(_vecino(lugares, p, None), None) for p in lugares)
    return min(opciones, key=lambda o: _largo(o, None))


def _medir(orden: list[dict], inicio: tuple[float, float] | None) -> tuple[float, float]:
    """Devuelve (minutos totales, metros caminados) de una ruta ya ordenada."""
    metros = _largo(orden, inicio)
    return minutos_caminando(metros) + MIN_POR_PARADA * len(orden), metros


def puntos(lugar: dict, gustos: set[str]) -> int:
    return PUNTOS_INTERES if not gustos or lugar["categoria"] in gustos else PUNTOS_OTRO


def ocupacion(lugar: dict, afluencia: dict[int, int] | None) -> float:
    """Llegadas recientes entre la capacidad por hora del lugar (1.0 = lleno)."""
    if not afluencia:
        return 0.0
    return afluencia.get(lugar.get("id"), 0) / (lugar.get("capacidad") or CAPACIDAD_POR_HORA)


def nivel_afluencia(ocup: float) -> str:
    if ocup >= UMBRAL_LLENO:
        return LLENO
    return CONCURRIDO if ocup >= UMBRAL_CONCURRIDO else TRANQUILO


def peso_afluencia(ocup: float) -> float:
    """1 mientras esté tranquilo y luego baja sin llegar nunca a 0: 0.5 al llenarse, 0.25 al doble.

    No tiene piso plano a propósito: con todos los lugares saturados (un crucero) los menos cargados
    siguen pesando más, y así la gente se sigue repartiendo.
    """
    if ocup <= UMBRAL_CONCURRIDO:
        return 1.0
    return 1.0 / (1.0 + PENDIENTE_PESO * (ocup - UMBRAL_CONCURRIDO))


def _llenar(
    elegidos: list[dict],
    candidatos: list[dict],
    gustos: set[str],
    tiempo_min: int,
    inicio: tuple[float, float] | None,
    tope: int | None = None,
    afluencia: dict[int, int] | None = None,
) -> list[dict]:
    """Agrega, uno a uno, el candidato con más puntos por minuto adicional que aún quepa en el tiempo."""
    elegidos = list(elegidos)
    restantes = list(candidatos)
    minutos_actuales = _medir(_ordenar(elegidos, inicio), inicio)[0] if elegidos else 0.0
    while restantes and (tope is None or len(elegidos) < tope):
        mejor, mejor_valor, mejor_min = None, -1.0, 0.0
        for c in restantes:
            minutos, _ = _medir(_ordenar(elegidos + [c], inicio), inicio)
            if minutos > tiempo_min:
                continue
            valor = puntos(c, gustos) * peso_afluencia(ocupacion(c, afluencia)) / max(minutos - minutos_actuales, 1.0)
            if valor > mejor_valor:
                mejor, mejor_valor, mejor_min = c, valor, minutos
        if mejor is None:
            break
        elegidos.append(mejor)
        restantes.remove(mejor)
        minutos_actuales = mejor_min
    return elegidos


def calcular_ruta(
    lugares: list[dict],
    tiempo_min: int,
    intereses: list[str],
    inicio: tuple[float, float] | None = None,
    visitados: set[int] | frozenset[int] = frozenset(),
    afluencia: dict[int, int] | None = None,
) -> RutaCalculada:
    """Arma la ruta.

    - Sin los `visitados` (ids de lugar), con los lugares de sus intereses que más
      puntos den en `tiempo_min`; si quedan menos de 3 paradas se completa con otros lugares
      mientras quepan. Siempre hay al menos 1 parada.
    - `afluencia` (id de lugar -> llegadas recientes): los lugares llenos solo entran si no alcanzan
      3 paradas sin ellos; los concurrentes valen menos puntos por minuto.
    """
    disponibles = [l for l in lugares if l.get("id") not in visitados] or list(lugares)
    gustos = set(intereses)
    llenos = [l for l in disponibles if ocupacion(l, afluencia) >= UMBRAL_LLENO]
    libres = [l for l in disponibles if l not in llenos] or disponibles
    orden_sug = lambda l: l.get("orden_sugerido") or 999  # noqa: E731
    de_interes = sorted((l for l in libres if puntos(l, gustos) == PUNTOS_INTERES), key=orden_sug)
    otros = sorted((l for l in libres if puntos(l, gustos) != PUNTOS_INTERES), key=orden_sug)

    elegidos = _llenar([], de_interes, gustos, tiempo_min, inicio, afluencia=afluencia)
    if len(elegidos) < MIN_PARADAS:
        elegidos = _llenar(elegidos, otros, gustos, tiempo_min, inicio, tope=MIN_PARADAS, afluencia=afluencia)
    if len(elegidos) < MIN_PARADAS and llenos and libres is not disponibles:
        # Sin alternativas suficientes: se completa con los menos saturados.
        llenos.sort(key=lambda l: ocupacion(l, afluencia))
        elegidos = _llenar(elegidos, llenos, gustos, tiempo_min, inicio, tope=MIN_PARADAS, afluencia=afluencia)
    if not elegidos:  # ni una parada cabe: se da la más cercana de sus intereses
        pool = de_interes or otros
        ref = inicio or (pool[0]["lat"], pool[0]["lng"])
        elegidos = [min(pool, key=lambda l: _d(ref, l))]

    orden = _ordenar(elegidos, inicio)
    minutos, metros = _medir(orden, inicio)
    return RutaCalculada(orden, round(minutos), round(metros))


@dataclass
class Solicitud:
    """Lo que pide un turista al armar su ruta."""
    tiempo_min: int
    intereses: list[str]
    inicio: tuple[float, float] | None = None
    visitados: frozenset[int] = frozenset()


def calcular_rutas_grupo(
    lugares: list[dict],
    solicitudes: list[Solicitud],
    afluencia: dict[int, int] | None = None,
) -> list[RutaCalculada]:
    """Rutas para varias personas a la vez, repartiéndolas.

    Se arman una tras otra y cada ruta ya armada cuenta como una persona más en cada una de sus paradas
    antes de armar la siguiente. Sin esto, 3,000 solicitudes a la misma hora verían los mismos lugares
    vacíos (nadie ha llegado todavía) y recibirían la misma ruta. `afluencia` es la carga previa
    (llegadas recientes y rutas ya activas); no se modifica.
    """
    carga = dict(afluencia or {})
    rutas = []
    for sol in solicitudes:
        ruta = calcular_ruta(lugares, sol.tiempo_min, sol.intereses, sol.inicio, sol.visitados, carga)
        for l in ruta.lugares:
            carga[l["id"]] = carga.get(l["id"], 0) + 1
        rutas.append(ruta)
    return rutas


def metros_entre_paradas(paradas: list[dict]) -> float:
    """Metros en línea recta entre paradas consecutivas (en el orden recibido)."""
    return _largo(paradas, None)


TLACOS_POR_100M = 1
TOPE_DISTANCIA = 60


def tlacos_por_distancia(metros: float) -> int:
    """1 doblón por cada 100 m recorridos entre paradas, hasta 60."""
    return min(TOPE_DISTANCIA, int(metros // 100) * TLACOS_POR_100M)
