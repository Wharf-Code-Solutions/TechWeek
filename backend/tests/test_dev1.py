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

def test_ruta_demo_son_las_5_paradas_en_orden():
    r = calcular_ruta(LUGARES, 60, [], demo=True)
    assert [l["slug"] for l in r.lugares] == ["catedral", "condesa-malibran", "baluarte-santiago", "portales", "zocalo"]


def test_ruta_cabe_en_el_tiempo():
    for minutos in (30, 60, 120):
        r = calcular_ruta(LUGARES, minutos, [], inicio=ZOCALO)
        assert r.tiempo_min <= minutos or len(r.lugares) == 1


def test_mas_tiempo_mas_lugares():
    corta = calcular_ruta(LUGARES, 30, [], inicio=ZOCALO)
    larga = calcular_ruta(LUGARES, 240, [], inicio=ZOCALO)
    assert len(corta.lugares) < len(larga.lugares) == len(LUGARES)


def test_prioriza_intereses():
    # Con poco tiempo, el lugar de su interés entra aunque esté más lejos que otros.
    r = calcular_ruta(LUGARES, 30, ["mar"], inicio=ZOCALO)
    assert "faro-carranza" in [l["slug"] for l in r.lugares]
    sin_interes = calcular_ruta(LUGARES, 30, ["leyendas"], inicio=ZOCALO)
    assert "condesa-malibran" in [l["slug"] for l in sin_interes.lugares]


def test_siempre_hay_una_parada():
    assert len(calcular_ruta(LUGARES, 1, ["leyendas"]).lugares) == 1


# ───────────── Base falsa ─────────────

class BaseFalsa:
    def __init__(self):
        self.t = {"lugares": [dict(l) for l in LUGARES], "visitas": [], "rutas_usuario": [],
                  "movimientos_tlacos": [], "perfiles": [], "fotos_historicas": [{"id": 1}]}
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
        return [dict(x) for x in self.t[tabla] if self._cumple(x, f)]

    async def insertar(self, tabla, fila, *, ignorar_duplicado=False):
        if tabla == "movimientos_tlacos" and fila["motivo"] == "bono_fin" and any(
            m["perfil_id"] == fila["perfil_id"] and m["motivo"] == "bono_fin" for m in self.t[tabla]
        ):
            raise HTTPException(409, "Ya existe")
        if tabla == "perfiles" and any(p["id"] == fila["id"] for p in self.t[tabla]):
            return []
        self.n += 1
        nueva = {"id": self.n, "reto_ok": None, "estado": "activa", "creado_en": str(self.n), **fila}
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


def test_llegada_demo_y_no_se_duplica(cliente):
    c, base = cliente
    a = c.post("/api/visitas", json={"lugar_slug": "catedral", "metodo": "demo"}).json()
    b = c.post("/api/visitas", json={"lugar_slug": "catedral", "metodo": "demo"}).json()
    assert a["id"] == b["id"] and len(base.t["visitas"]) == 1


def test_llegada_lugar_inexistente(cliente):
    c, _ = cliente
    assert c.post("/api/visitas", json={"lugar_slug": "callejon-del-diamante", "metodo": "demo"}).status_code == 404


# ───────────── Rutas y bono ─────────────

def test_crear_y_leer_ruta(cliente):
    c, _ = cliente
    r = c.post("/api/rutas", json={"tiempo_min": 60, "intereses": ["historia"], "demo": True})
    assert r.status_code == 201 and len(r.json()["lugares"]) == 5
    actual = c.get("/api/rutas/actual").json()
    assert [l["slug"] for l in actual["lugares"]][0] == "catedral"


def test_ajustar_ruta_saltando_un_lugar(cliente):
    c, _ = cliente
    c.post("/api/rutas", json={"tiempo_min": 60, "demo": True})
    r = c.patch("/api/rutas/actual", json={"lugares": ["catedral", "zocalo"]})
    assert [l["slug"] for l in r.json()["lugares"]] == ["catedral", "zocalo"]


def test_bono_solo_con_reto_y_una_vez(cliente):
    c, base = cliente
    c.post("/api/rutas", json={"tiempo_min": 60, "demo": True})
    sin_reto = c.post("/api/rutas/actual/terminar").json()
    assert sin_reto["bono"] == 0

    c.post("/api/rutas", json={"tiempo_min": 60, "demo": True})
    c.post("/api/visitas", json={"lugar_slug": "catedral", "metodo": "demo"})
    base.t["visitas"][0]["reto_ok"] = True
    fin = c.post("/api/rutas/actual/terminar").json()
    assert fin["bono"] == 100 and fin["saldo"] == 100 and fin["retos_completados"] == 1

    c.post("/api/rutas", json={"tiempo_min": 60, "demo": True})
    otra = c.post("/api/rutas/actual/terminar").json()
    assert otra["bono"] == 0 and otra["saldo"] == 100


def test_perfil(cliente):
    c, _ = cliente
    r = c.put("/api/perfil", json={"apodo": "Jarocho", "avatar": "jarana", "idioma": "en"})
    assert r.json()["apodo"] == "Jarocho" and c.get("/api/perfil").json()["idioma"] == "en"
