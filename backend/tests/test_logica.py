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


def test_sesion_sin_supabase_configurado():
    assert TestClient(app).post("/api/sesion").status_code == 503


def test_validar_orden():
    c = {"orden_correcto": ["e1", "e2", "e3"]}
    assert validar("orden", c, ["e1", "e2", "e3"])
    assert not validar("orden", c, ["e2", "e1", "e3"])
