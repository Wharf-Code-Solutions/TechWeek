"""Pruebas de Dev 1: algoritmo de ruta (M3), llegada (visitas), rutas y bono de fin.

Usan el seed real (src/data/seed.json) y una base falsa en memoria: no tocan Supabase.
"""
import json
from pathlib import Path

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app import db
from app.auth import perfil_id_actual
from app.main import app
from app.ruta import calcular_ruta

SEED = json.loads((Path(__file__).resolve().parents[2] / "src" / "data" / "seed.json").read_text(encoding="utf-8"))
LUGARES = [{"id": i + 1, **l} for i, l in enumerate(SEED["lugares"])]
ZOCALO = (19.20023, -96.13853)


# ───────────── Algoritmo de ruta ─────────────

def test_ruta_cabe_en_el_tiempo():
    for minutos in (30, 60, 120):
        r = calcular_ruta(LUGARES, minutos, [], inicio=ZOCALO)
        assert r.tiempo_min <= minutos or len(r.lugares) == 1


def test_mas_tiempo_mas_lugares():
    corta = calcular_ruta(LUGARES, 30, [], inicio=ZOCALO)
    media = calcular_ruta(LUGARES, 120, [], inicio=ZOCALO)
    larga = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO)
    assert len(corta.lugares) < len(media.lugares) < len(larga.lugares) <= len(LUGARES)
    assert larga.tiempo_min <= 240


def test_prioriza_intereses():
    # Con poco tiempo, entran primero los lugares de su interés (3 puntos) y no los demás (1 punto).
    for interes in ("mar", "leyendas"):
        r = calcular_ruta(LUGARES, 30, [interes], inicio=ZOCALO)
        categorias = [l["categoria"] for l in r.lugares]
        assert interes in categorias and categorias.count(interes) >= len(categorias) / 2


def test_siempre_hay_una_parada():
    assert len(calcular_ruta(LUGARES, 1, ["leyendas"]).lugares) == 1


# ───────────── Base falsa ─────────────

class BaseFalsa:
    def __init__(self):
        self.t = {"lugares": [dict(l) for l in LUGARES], "visitas": [], "rutas_usuario": [],
                  "movimientos_tlacos": [], "perfiles": [],
                  "fotos_historicas": [{"id": i, "slug": f"foto-{i}", "url": "", "piezas": 6} for i in (1, 2, 3)]}
        self.n = 100

    @staticmethod
    def _cumple(fila, filtros):
        for k, v in filtros.items():
            if k in ("select", "order", "limit"):
                continue
            op, val = v.split(".", 1)
            x = fila.get(k)
            if op == "eq" and str(x).lower() != val.lower():
                return False
            if op == "is" and val == "null" and x is not None:
                return False
            if op == "in" and str(x) not in val.strip("()").split(","):
                return False
        return True

    async def seleccionar(self, tabla, **f):
        filas = [dict(x) for x in self.t[tabla] if self._cumple(x, f)]
        orden = f.get("order", "")
        if orden.endswith(".desc") and filas and orden.split(".")[0] in filas[0]:
            filas.sort(key=lambda x: x[orden.split(".")[0]], reverse=True)
        if "limit" in f:
            filas = filas[: int(f["limit"])]
        return filas

    async def insertar(self, tabla, fila, *, ignorar_duplicado=False, conflicto=None):
        if tabla == "movimientos_tlacos" and fila["motivo"] == "bono_fin" and any(
            m["perfil_id"] == fila["perfil_id"] and m["motivo"] == "bono_fin" for m in self.t[tabla]
        ):
            raise HTTPException(409, "Ya existe")
        if tabla == "movimientos_tlacos" and fila["motivo"] in ("distancia", "compartir") and any(
            m["perfil_id"] == fila["perfil_id"] and m["motivo"] == fila["motivo"]
            and (fila["motivo"] == "compartir" or m["ref_id"] == fila["ref_id"])
            for m in self.t[tabla]
        ):
            raise HTTPException(409, "Ya existe")
        if tabla == "perfiles" and any(p["id"] == fila["id"] for p in self.t[tabla]):
            return []
        if tabla == "visitas" and any(  # unique (perfil_id, lugar_id)
            v["perfil_id"] == fila["perfil_id"] and v["lugar_id"] == fila["lugar_id"] for v in self.t[tabla]
        ):
            if ignorar_duplicado:
                return []
            raise HTTPException(409, "Ya existe")
        self.n += 1
        nueva = {"id": self.n, "reto_ok": None, "estado": "activa", "creado_en": str(self.n),
                 "llegada_en": str(self.n), "tlacos": 0, **fila}
        self.t[tabla].append(nueva)
        return [dict(nueva)]

    async def actualizar(self, tabla, cambios, **f):
        hechas = []
        for x in self.t[tabla]:
            if self._cumple(x, f):
                x.update(cambios)
                hechas.append(dict(x))
        return hechas

    async def asegurar_perfil(self, perfil_id):
        await self.insertar("perfiles", {"id": perfil_id})

    async def saldo_de(self, perfil_id):
        return sum(m["cantidad"] for m in self.t["movimientos_tlacos"] if m["perfil_id"] == perfil_id)


@pytest.fixture
def cliente(monkeypatch):
    base = BaseFalsa()
    for nombre in ("seleccionar", "insertar", "actualizar", "asegurar_perfil", "saldo_de"):
        monkeypatch.setattr(db, nombre, getattr(base, nombre))
    app.dependency_overrides[perfil_id_actual] = lambda: "celular-1"
    yield TestClient(app), base
    app.dependency_overrides.clear()


DEMO5 = ["catedral", "condesa-malibran", "baluarte-santiago", "portales", "zocalo"]


def armar(c, slugs=None):
    """Crea una ruta real y la ajusta (PATCH) a estos lugares para tener paradas conocidas. Devuelve la ruta."""
    c.post("/api/rutas", json={"tiempo_min": 240, "intereses": ["historia"]})
    return c.patch("/api/rutas/actual", json={"lugares": slugs or DEMO5}).json()


def llegar(c, slug):
    """Llegada por GPS justo en el lugar."""
    l = next(x for x in LUGARES if x["slug"] == slug)
    return c.post("/api/visitas", json={"lugar_slug": slug, "metodo": "gps", "lat": l["lat"], "lng": l["lng"]})


# ───────────── Visitas (llegada) ─────────────

def test_llegada_gps_dentro_del_radio(cliente):
    c, _ = cliente
    r = c.post("/api/visitas", json={"lugar_slug": "zocalo", "metodo": "gps", "lat": 19.20030, "lng": -96.13853})
    assert r.status_code == 201 and r.json()["metodo"] == "gps"


def test_llegada_gps_fuera_del_radio(cliente):
    c, _ = cliente
    r = c.post("/api/visitas", json={"lugar_slug": "zocalo", "metodo": "gps", "lat": 19.2010, "lng": -96.13853})
    assert r.status_code == 403


def test_llegada_gps_sin_coordenadas(cliente):
    c, _ = cliente
    assert c.post("/api/visitas", json={"lugar_slug": "zocalo", "metodo": "gps"}).status_code == 422


def test_llegada_no_se_duplica(cliente):
    c, base = cliente
    a = llegar(c, "catedral").json()
    b = llegar(c, "catedral").json()
    assert a["id"] == b["id"] and len(base.t["visitas"]) == 1


def test_llegada_lugar_inexistente(cliente):
    c, _ = cliente
    r = c.post("/api/visitas", json={"lugar_slug": "callejon-del-diamante", "metodo": "gps", "lat": 0, "lng": 0})
    assert r.status_code == 404


# ───────────── Rutas y bono ─────────────

def test_crear_y_leer_ruta(cliente):
    c, _ = cliente
    r = c.post("/api/rutas", json={"tiempo_min": 120, "intereses": ["historia", "mar"]})
    assert r.status_code == 201 and len(r.json()["lugares"]) >= 3
    primero = r.json()["lugares"][0]["slug"]
    actual = c.get("/api/rutas/actual").json()
    assert [l["slug"] for l in actual["lugares"]][0] == primero


def test_ajustar_ruta_saltando_un_lugar(cliente):
    c, _ = cliente
    armar(c)
    r = c.patch("/api/rutas/actual", json={"lugares": ["catedral", "zocalo"]})
    assert [l["slug"] for l in r.json()["lugares"]] == ["catedral", "zocalo"]


def test_bono_solo_con_reto_y_una_vez(cliente):
    c, base = cliente
    armar(c)
    sin_reto = c.post("/api/rutas/actual/terminar").json()
    assert sin_reto["bono"] == 0

    armar(c)
    llegar(c, "catedral")
    base.t["visitas"][0]["reto_ok"] = True
    fin = c.post("/api/rutas/actual/terminar").json()
    assert fin["bono"] == 100 and fin["saldo"] == 100 and fin["retos_completados"] == 1

    armar(c)
    otra = c.post("/api/rutas/actual/terminar").json()
    assert otra["bono"] == 0 and otra["saldo"] == 100


def test_perfil(cliente):
    c, _ = cliente
    r = c.put("/api/perfil", json={"apodo": "Jarocho", "avatar": "jarana", "idioma": "en"})
    assert r.json()["apodo"] == "Jarocho" and c.get("/api/perfil").json()["idioma"] == "en"


# ───────────── Pasaporte ─────────────

def test_contar_piezas():
    from app.routers.pasaporte import contar_piezas
    assert contar_piezas(0, 5) == 0
    assert contar_piezas(3, 5) == 3
    assert contar_piezas(9, 5) == 5


def test_pasaporte_sellos_y_piezas(cliente):
    c, base = cliente
    vacio = c.get("/api/pasaporte").json()
    assert vacio["sellos"] == [] and vacio["piezas"]["ganadas"] == 0

    armar(c)
    for slug in ("catedral", "condesa-malibran", "baluarte-santiago"):
        llegar(c, slug)
    for v in base.t["visitas"][:2]:
        v["reto_ok"] = True  # dos retos completados; el tercero solo tiene llegada
    p = c.get("/api/pasaporte").json()
    assert [s["lugar_slug"] for s in p["sellos"]] == ["catedral", "condesa-malibran"]
    assert p["piezas"] == {"total": 5, "ganadas": 2, "indices": [0, 1], "completa": False}

    c.post("/api/rutas/actual/terminar")  # terminar ya no regala una pieza
    assert c.get("/api/pasaporte").json()["piezas"]["ganadas"] == 2

    armar(c)  # otra ruta: el rompecabezas vuelve a cero
    nuevo = c.get("/api/pasaporte").json()
    assert nuevo["piezas"]["ganadas"] == 0 and len(nuevo["sellos"]) == 2  # los sellos se conservan


# ───────────── Vitrina de comercios ─────────────

def test_comercios_filtra_por_tipo_y_ordena_aliados(monkeypatch):
    pedidos = []

    async def seleccionar(tabla, **filtros):
        pedidos.append((tabla, filtros))
        return []

    monkeypatch.setattr(db, "seleccionar", seleccionar)
    c = TestClient(app)
    assert c.get("/api/comercios?tipo=libreria").status_code == 200
    assert pedidos[-1] == ("comercios", {"order": "aliado.desc,nombre.asc", "tipo": "eq.libreria"})
    assert c.get("/api/comercios").status_code == 200
    assert "tipo" not in pedidos[-1][1]
    assert c.get("/api/comercios?tipo=bar").status_code == 422


def test_seed_comercios_validos():
    tipos = {"cafeteria", "restaurante", "fonda", "neveria", "mercado", "libreria", "artesanias", "tienda"}
    comercios = SEED["comercios"]
    assert len({c["slug"] for c in comercios}) == len(comercios)
    for c in comercios:
        assert c["tipo"] in tipos, c["slug"]
        assert c["descripcion_es"] and c["descripcion_en"] and c["horario_es"] and c["horario_en"], c["slug"]
        assert 19.18 < c["lat"] < 19.21 and -96.15 < c["lng"] < -96.12, c["slug"]
    slugs = {c["slug"] for c in comercios}
    assert all(p["comercio_slug"] in slugs for p in SEED["promociones"])


# ───────────── Retos rápidos: trivia, verdadero/falso, intruso ─────────────

def test_trivia_e_intruso():
    from app.retos import validar
    c = {"pregunta": "¿?", "opciones": ["Café lechero", "Agua"], "correcta": "Café lechero"}
    assert validar("trivia", c, [" café LECHERO "])
    assert not validar("trivia", c, ["Agua"])
    assert not validar("trivia", c, ["Café lechero", "Agua"])
    assert validar("intruso", {"opciones": ["a", "b"], "correcta": "Tornillos"}, ["tornillos"])


def test_verdadero_falso():
    from app.retos import validar
    assert validar("verdadero_falso", {"afirmacion": "x", "correcta": True}, ["verdadero"])
    assert validar("verdadero_falso", {"afirmacion": "x", "correcta": True}, ["true"])
    assert validar("verdadero_falso", {"afirmacion": "x", "correcta": False}, ["Falso"])
    assert not validar("verdadero_falso", {"afirmacion": "x", "correcta": False}, ["verdadero"])
    assert not validar("verdadero_falso", {"afirmacion": "x", "correcta": True}, ["quizá"])


def test_retos_rapidos_no_envian_la_respuesta():
    from app.retos import ocultar_respuestas
    for tipo in ("trivia", "verdadero_falso", "intruso"):
        assert "correcta" not in ocultar_respuestas(tipo, {"pregunta": "p", "correcta": "x"})


def test_seed_retos_bien_formados():
    from app.retos import validar
    lugares = {l["slug"] for l in SEED["lugares"]}
    assert {r["lugar_slug"] for r in SEED["retos"]} == lugares  # todos los lugares tienen reto
    for r in SEED["retos"]:
        for idioma in ("es", "en", "fr"):
            c = r.get(f"contenido_{idioma}")
            if c is None and idioma == "fr":
                continue  # el francés es opcional: sin traducir se juega en inglés
            assert c is not None, (r["lugar_slug"], idioma)
            if r["tipo"] == "palabras":
                assert validar("palabras", c, c["respuestas"]) and set(c["respuestas"]) <= set(c["opciones"])
            elif r["tipo"] == "orden":
                assert validar("orden", c, c["orden_correcto"])
            elif r["tipo"] == "verdadero_falso":
                assert validar("verdadero_falso", c, ["verdadero" if c["correcta"] else "falso"])
            else:
                assert c["correcta"] in c["opciones"] and c["opciones"][0] != c["correcta"]
                assert validar(r["tipo"], c, [c["correcta"]])
        if r["tipo"] in ("trivia", "verdadero_falso", "intruso"):
            assert r["tlacos"] < 50, r["lugar_slug"]


# ───────────── Bloque 2: ruta inteligente, piezas por ruta, distancia ─────────────

def _largo_ruta(r, inicio):
    from app.ruta import _largo
    return _largo(r.lugares, inicio)


def test_ruta_excluye_visitados():
    visitados = {l["id"] for l in LUGARES if l["categoria"] == "historia"}
    r = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO, visitados=visitados)
    assert r.lugares and not any(l["id"] in visitados for l in r.lugares)


def test_ruta_con_todo_visitado_no_se_queda_vacia():
    r = calcular_ruta(LUGARES, 60, [], inicio=ZOCALO, visitados={l["id"] for l in LUGARES})
    assert len(r.lugares) >= 1


def test_ruta_prefiere_intereses_y_completa_si_faltan_paradas():
    r = calcular_ruta(LUGARES, 120, ["mar"], inicio=ZOCALO)
    categorias = [l["categoria"] for l in r.lugares]
    assert "mar" in categorias and r.tiempo_min <= 120
    assert categorias.count("mar") == sum(1 for l in LUGARES if l["categoria"] == "mar") or len(r.lugares) >= 3


def test_ruta_ordenada_no_es_peor_que_vecino_mas_cercano():
    from app.ruta import _vecino
    elegidos = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO).lugares
    ingenuo = _vecino(elegidos, None, ZOCALO)
    from app.ruta import _largo
    assert _largo(elegidos, ZOCALO) <= _largo(ingenuo, ZOCALO) + 1e-6


def test_ruta_sin_inicio_empieza_donde_acorta():
    from app.ruta import _largo, _ordenar
    sel = [l for l in LUGARES if l["slug"] in ("catedral", "zocalo", "portales", "faro-carranza")]
    orden = _ordenar(sel, None)
    assert sorted(l["slug"] for l in orden) == sorted(l["slug"] for l in sel)
    # ninguna permutación es más corta (4 lugares: se prueba entera)
    from itertools import permutations
    assert _largo(orden, None) <= min(_largo(list(p), None) for p in permutations(sel)) + 1e-6


def test_tlacos_por_distancia():
    from app.ruta import tlacos_por_distancia
    assert tlacos_por_distancia(0) == 0 and tlacos_por_distancia(99) == 0
    assert tlacos_por_distancia(250) == 2 and tlacos_por_distancia(10_000) == 60


def test_crear_ruta_no_ofrece_lugares_con_sello(cliente):
    c, base = cliente
    armar(c)
    llegar(c, "catedral")
    base.t["visitas"][0]["reto_ok"] = True
    nueva = c.post("/api/rutas", json={"tiempo_min": 240, "intereses": ["historia"]}).json()
    assert "catedral" not in [l["slug"] for l in nueva["lugares"]]


def test_la_visita_queda_ligada_a_la_ruta_activa(cliente):
    c, base = cliente
    ruta = armar(c)
    llegar(c, "catedral")
    assert base.t["visitas"][0]["ruta_id"] == ruta["id"]
    otra = armar(c)
    llegar(c, "catedral")  # sin jugar: pasa a la ruta nueva
    assert base.t["visitas"][0]["ruta_id"] == otra["id"]


def test_ruta_nueva_cambia_de_foto(cliente):
    c, _ = cliente
    fotos = [c.post("/api/rutas", json={"tiempo_min": 60, "intereses": ["historia"]}).json()["foto_id"] for _ in range(8)]
    assert all(a != b for a, b in zip(fotos, fotos[1:]))


def test_puntos_por_distancia_una_vez_por_ruta(cliente):
    c, base = cliente
    armar(c)
    for slug in ("catedral", "condesa-malibran", "baluarte-santiago"):
        llegar(c, slug)
    for v in base.t["visitas"]:
        v["reto_ok"] = True
    fin = c.post("/api/rutas/actual/terminar").json()
    assert fin["distancia_m"] > 0 and fin["tlacos_distancia"] == min(60, fin["distancia_m"] // 100)
    assert fin["saldo"] == fin["bono"] + fin["tlacos_distancia"]
    movs = [m for m in base.t["movimientos_tlacos"] if m["motivo"] == "distancia"]
    assert len(movs) == 1


def test_reto_ya_completado_no_es_error(monkeypatch):
    async def seleccionar(tabla, **f):
        return [{"id": 1, "retos": [{"tipo": "trivia"}], "visitas": [{"id": 9, "reto_ok": True}]}]

    async def saldo_de(_):
        return 50

    monkeypatch.setattr(db, "seleccionar", seleccionar)
    monkeypatch.setattr(db, "saldo_de", saldo_de)
    app.dependency_overrides[perfil_id_actual] = lambda: "celular-1"
    try:
        r = TestClient(app).post("/api/retos/catedral/completar", json={"respuesta": ["x"]})
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 200
    assert r.json() == {"correcto": True, "completado": True, "tlacos_ganados": 0, "saldo": 50, "ya_visitado": True, "respuesta_correcta": None}


def test_compartir_paga_una_vez_con_ruta_terminada(cliente):
    c, base = cliente
    ruta = armar(c)
    assert c.post(f"/api/rutas/{ruta['id']}/compartir").status_code == 409  # sigue activa
    fin = c.post("/api/rutas/actual/terminar").json()
    assert fin["ruta_id"] == ruta["id"]
    a = c.post(f"/api/rutas/{ruta['id']}/compartir").json()
    b = c.post(f"/api/rutas/{ruta['id']}/compartir").json()
    assert a == {"tlacos": 30, "saldo": 30} and b == {"tlacos": 0, "saldo": 30}
    assert len([m for m in base.t["movimientos_tlacos"] if m["motivo"] == "compartir"]) == 1


def test_compartir_no_se_repite_creando_rutas(cliente):
    c, base = cliente
    ids = []
    for _ in range(3):
        ids.append(armar(c)["id"])
        c.post("/api/rutas/actual/terminar")
    assert [c.post(f"/api/rutas/{i}/compartir").json()["tlacos"] for i in ids] == [30, 0, 0]
    assert len([m for m in base.t["movimientos_tlacos"] if m["motivo"] == "compartir"]) == 1


def test_compartir_ruta_ajena_o_inexistente(cliente):
    c, base = cliente
    assert c.post("/api/rutas/999/compartir").status_code == 404
    ruta = armar(c)
    base.t["rutas_usuario"][0]["perfil_id"] = "otro-celular"
    assert c.post(f"/api/rutas/{ruta['id']}/compartir").status_code == 404


def test_respuesta_correcta_legible():
    from app.retos import respuesta_correcta
    assert respuesta_correcta("palabras", {"respuestas": ["a", "b"]}) == ["a", "b"]
    orden = {"eventos": [{"id": "e2", "texto": "Después"}, {"id": "e1", "texto": "Antes"}], "orden_correcto": ["e1", "e2"]}
    assert respuesta_correcta("orden", orden) == ["Antes", "Después"]
    assert respuesta_correcta("verdadero_falso", {"correcta": False}) == ["falso"]
    assert respuesta_correcta("trivia", {"correcta": "1808"}) == ["1808"]
    assert respuesta_correcta("intruso", {"correcta": "Mariachi"}) == ["Mariachi"]


def test_vidas_por_tipo():
    vidas = {"verdadero_falso": 1, "trivia": 2, "intruso": 2, "palabras": 3, "orden": 3}
    for r in SEED["retos"]:
        assert r["intentos_max"] == vidas[r["tipo"]], r["lugar_slug"]


# ───────────── Afluencia ─────────────

def _id(slug):
    return next(l["id"] for l in LUGARES if l["slug"] == slug)


def test_nivel_y_peso_de_afluencia():
    from app.ruta import CONCURRIDO, LLENO, TRANQUILO, nivel_afluencia, peso_afluencia
    assert [nivel_afluencia(o) for o in (0, 0.49, 0.5, 0.99, 1, 3)] == [TRANQUILO, TRANQUILO, CONCURRIDO, CONCURRIDO, LLENO, LLENO]
    pesos = [peso_afluencia(o) for o in (0.3, 0.7, 1.0, 1.5, 3.0, 10.0)]
    assert pesos[0] == 1.0 and pesos == sorted(pesos, reverse=True) and len(set(pesos)) == len(pesos) and pesos[-1] > 0


def test_ruta_deja_fuera_el_lugar_lleno():
    sin = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO)
    assert "zocalo" in [l["slug"] for l in sin.lugares]
    lleno = {_id("zocalo"): 60}  # el doble de su capacidad
    con = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO, afluencia=lleno)
    assert "zocalo" not in [l["slug"] for l in con.lugares] and len(con.lugares) >= 3


def test_lugar_lleno_se_usa_si_no_hay_otra_opcion():
    # Con tres lugares y todos llenos, la ruta no queda vacía.
    pocos = LUGARES[:3]
    llenos = {l["id"]: 100 for l in pocos}
    assert len(calcular_ruta(pocos, 240, [], inicio=ZOCALO, afluencia=llenos).lugares) == 3


def test_afluencia_no_cambia_la_ruta_si_todo_esta_tranquilo():
    base = calcular_ruta(LUGARES, 120, ["historia"], inicio=ZOCALO)
    tranquila = calcular_ruta(LUGARES, 120, ["historia"], inicio=ZOCALO, afluencia={_id("zocalo"): 2})
    assert [l["slug"] for l in base.lugares] == [l["slug"] for l in tranquila.lugares]


def test_endpoint_afluencia_y_ruta_evitan_lo_lleno(cliente):
    from app.routers import visitas
    c, base = cliente
    visitas._cache_afluencia["hasta"] = 0.0
    for i in range(40):  # 40 celulares llegaron al Zócalo en la última hora (capacidad 30)
        base.t["visitas"].append({"id": 900 + i, "perfil_id": f"otro-{i}", "lugar_id": _id("zocalo"), "reto_ok": None,
                                  "llegada_en": "2099-01-01T00:00:00+00:00"})
    por_slug = {a["slug"]: a for a in c.get("/api/afluencia").json()}
    assert por_slug["zocalo"]["nivel"] == "lleno" and por_slug["zocalo"]["llegadas"] == 40
    assert por_slug["catedral"]["nivel"] == "tranquilo"
    ruta = c.post("/api/rutas", json={"tiempo_min": 240, "intereses": []}).json()
    assert "zocalo" not in [l["slug"] for l in ruta["lugares"]]
    visitas._cache_afluencia["hasta"] = 0.0


# ───────────── Rutas para varias personas ─────────────

def _cargas(rutas):
    carga = {}
    for r in rutas:
        for l in r.lugares:
            carga[l["id"]] = carga.get(l["id"], 0) + 1
    return carga


def test_grupo_reparte_en_vez_de_mandar_a_todos_al_mismo_lugar():
    from app.ruta import Solicitud, calcular_rutas_grupo
    n = 40
    sols = [Solicitud(60, [], ZOCALO) for _ in range(n)]
    ingenuo = _cargas([calcular_ruta(LUGARES, 60, [], inicio=ZOCALO)] * n)  # todos reciben la misma ruta
    repartido = _cargas(calcular_rutas_grupo(LUGARES, sols))
    assert max(ingenuo.values()) == n
    assert max(repartido.values()) <= 30  # la capacidad por hora de un lugar
    assert len(repartido) >= 2 * len(ingenuo)


def test_grupo_con_todo_saturado_sigue_repartiendo():
    from app.ruta import Solicitud, calcular_rutas_grupo
    saturado = {l["id"]: 40 for l in LUGARES}  # todos por encima de su capacidad
    rutas = calcular_rutas_grupo(LUGARES, [Solicitud(60, [], ZOCALO) for _ in range(40)], saturado)
    carga = _cargas(rutas)
    assert all(len(r.lugares) >= 1 for r in rutas) and max(carga.values()) < 40 * 0.75


def test_grupo_no_modifica_la_carga_previa_ni_cambia_a_una_sola_persona():
    from app.ruta import Solicitud, calcular_rutas_grupo
    previa = {_id("zocalo"): 5}
    sola = calcular_rutas_grupo(LUGARES, [Solicitud(120, ["historia"], ZOCALO)], previa)[0]
    assert previa == {_id("zocalo"): 5}
    assert [l["slug"] for l in sola.lugares] == [l["slug"] for l in calcular_ruta(LUGARES, 120, ["historia"], inicio=ZOCALO, afluencia=previa).lugares]


def test_rutas_activas_cuentan_como_gente_en_camino(cliente):
    c, base = cliente
    for i in range(40):  # 40 celulares ya van al Zócalo, aunque nadie ha llegado
        base.t["rutas_usuario"].append({"id": 500 + i, "perfil_id": f"otro-{i}", "estado": "activa",
                                        "lugares": [_id("zocalo")], "creado_en": "2099-01-01T00:00:00+00:00"})
    ruta = c.post("/api/rutas", json={"tiempo_min": 240, "intereses": []}).json()
    assert "zocalo" not in [l["slug"] for l in ruta["lugares"]]
