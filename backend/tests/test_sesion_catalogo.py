from fastapi.testclient import TestClient

from app import db
from app.config import Settings
from app.main import app
from app.routers import sesion

cliente = TestClient(app)


class _Respuesta:
    def __init__(self, status, datos):
        self.status_code, self._datos = status, datos

    def json(self):
        return self._datos


def _falso_http(respuesta):
    class Falso:
        def __init__(self, *a, **k): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *a): ...
        async def post(self, *a, **k): return respuesta

    return Falso


def _configurar(monkeypatch):
    monkeypatch.setattr(
        sesion, "get_settings",
        lambda: Settings(_env_file=None, supabase_url="http://sb", supabase_anon_key="anon"),
    )


def test_sesion_iniciar_devuelve_tokens(monkeypatch):
    _configurar(monkeypatch)
    datos = {"access_token": "a", "refresh_token": "r", "expires_at": 123, "user": {}}
    monkeypatch.setattr(sesion.httpx, "AsyncClient", _falso_http(_Respuesta(200, datos)))
    r = cliente.post("/api/sesion")
    assert r.status_code == 201
    assert r.json() == {"access_token": "a", "refresh_token": "r", "expires_at": 123}


def test_sesion_renovar_rechaza_token_invalido(monkeypatch):
    _configurar(monkeypatch)
    monkeypatch.setattr(sesion.httpx, "AsyncClient", _falso_http(_Respuesta(400, {})))
    r = cliente.post("/api/sesion/renovar", json={"refresh_token": "malo"})
    assert r.status_code == 401


def test_reto_del_catalogo_no_incluye_respuestas(monkeypatch):
    async def seleccionar(tabla, **filtros):
        if tabla == "lugares":
            return [{"id": 1, "slug": "x"}]
        return [{
            "id": 9, "tipo": "palabras",
            "contenido_es": {"texto": ["a"], "respuestas": ["x"], "opciones": ["x"]},
            "contenido_en": {"texto": ["a"], "respuestas": ["x"], "opciones": ["x"]},
        }]

    monkeypatch.setattr(db, "seleccionar", seleccionar)
    r = cliente.get("/api/lugares/x/reto")
    assert r.status_code == 200
    assert "respuestas" not in r.json()["contenido_es"]
    assert "respuestas" not in r.json()["contenido_en"]


def test_reto_de_lugar_inexistente_es_404(monkeypatch):
    async def vacio(tabla, **filtros):
        return []

    monkeypatch.setattr(db, "seleccionar", vacio)
    assert cliente.get("/api/lugares/nada/reto").status_code == 404


def test_lista_de_lugares(monkeypatch):
    async def lugares(tabla, **filtros):
        return [{"slug": "a"}, {"slug": "b"}]

    monkeypatch.setattr(db, "seleccionar", lugares)
    r = cliente.get("/api/lugares")
    assert r.status_code == 200 and len(r.json()) == 2
    assert "max-age" in r.headers["cache-control"]
