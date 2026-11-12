from fastapi.testclient import TestClient

from app.geo import distancia_m
from app.main import app
from app.retos import validar


def test_health():
    assert TestClient(app).get("/health").json() == {"estado": "ok"}


def test_endpoints_piden_sesion():
    assert TestClient(app).get("/api/saldo").status_code == 401


def test_distancia_misma_posicion_es_cero():
    assert distancia_m(19.19935, -96.13705, 19.19935, -96.13705) == 0


def test_distancia_cerca_y_lejos():
    # 0.0003 grados de latitud son unos 33 m
    assert 30 < distancia_m(19.19935, -96.13705, 19.19965, -96.13705) < 36
    assert distancia_m(19.19935, -96.13705, 19.21, -96.13705) > 1000


def test_validar_palabras():
    c = {"respuestas": ["brujería", "Diamante"]}
    assert validar("palabras", c, [" Brujería", "diamante"])
    assert not validar("palabras", c, ["medicina", "diamante"])
    assert not validar("palabras", c, ["brujería"])


def test_catalogo_no_filtra_respuestas():
    from app.retos import ocultar_respuestas

    p = ocultar_respuestas("palabras", {"texto": ["a"], "respuestas": ["x"], "opciones": ["x", "y"]})
    assert "respuestas" not in p and p["opciones"] == ["x", "y"]
    o = ocultar_respuestas("orden", {"eventos": [], "orden_correcto": ["e1"]})
    assert "orden_correcto" not in o and "eventos" in o


def test_sesion_sin_supabase_configurado(monkeypatch):
    from app.config import Settings
    from app.routers import sesion

    monkeypatch.setattr(sesion, "get_settings", lambda: Settings(_env_file=None))
    assert TestClient(app).post("/api/sesion").status_code == 503


def test_validar_orden():
    c = {"orden_correcto": ["e1", "e2", "e3"]}
    assert validar("orden", c, ["e1", "e2", "e3"])
    assert not validar("orden", c, ["e2", "e1", "e3"])


def _cliente_con_sesion(monkeypatch, respuesta_rpc):
    from app import db
    from app.auth import perfil_id_actual

    async def rpc_falso(funcion, **args):
        assert funcion == "canjear" and args["p_promocion_slug"] == "cafe-2x1"
        return respuesta_rpc

    monkeypatch.setattr(db, "rpc", rpc_falso)
    app.dependency_overrides[perfil_id_actual] = lambda: "perfil-prueba"
    return TestClient(app)


def test_canje_ok(monkeypatch):
    c = _cliente_con_sesion(monkeypatch, {"ok": True, "codigo": "A1B2C3", "saldo": 20})
    r = c.post("/api/promociones/cafe-2x1/canjear")
    app.dependency_overrides.clear()
    assert r.status_code == 201 and r.json() == {"codigo": "A1B2C3", "saldo": 20}


def test_canje_saldo_insuficiente(monkeypatch):
    c = _cliente_con_sesion(monkeypatch, {"ok": False, "error": "saldo_insuficiente", "saldo": 10})
    r = c.post("/api/promociones/cafe-2x1/canjear")
    app.dependency_overrides.clear()
    assert r.status_code == 402
