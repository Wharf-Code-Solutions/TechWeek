"""Validación local del token de Supabase (JWKS) y su respaldo."""
import asyncio
import json
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from app import auth
from app.config import Settings

URL = "https://proyecto.supabase.co"
S = Settings(_env_file=None, supabase_url=URL, supabase_service_key="srv")


def _llave(kid="k1"):
    privada = ec.generate_private_key(ec.SECP256R1())
    publica = json.loads(jwt.algorithms.ECAlgorithm.to_jwk(privada.public_key()))
    return privada, {kid: jwt.PyJWK({**publica, "kid": kid, "alg": "ES256"})}


def _token(privada, kid="k1", **cambios):
    datos = {"sub": "usuario-1", "aud": "authenticated", "iss": f"{URL}/auth/v1", "exp": int(time.time()) + 600, **cambios}
    return jwt.encode(datos, privada, algorithm="ES256", headers={"kid": kid})


def _correr(token, monkeypatch, llaves, respaldo="desde-supabase"):
    async def _llaves(_s):
        return llaves

    async def _supabase(_a, _s):
        return respaldo

    monkeypatch.setattr(auth, "_llaves", _llaves)
    monkeypatch.setattr(auth, "_verificar_en_supabase", _supabase)
    return asyncio.run(auth.perfil_id_actual(authorization=f"Bearer {token}", settings=S))


def test_token_valido_sin_ir_a_supabase(monkeypatch):
    privada, llaves = _llave()
    assert _correr(_token(privada), monkeypatch, llaves) == "usuario-1"


def test_token_vencido_es_401(monkeypatch):
    privada, llaves = _llave()
    with pytest.raises(HTTPException) as e:
        _correr(_token(privada, exp=int(time.time()) - 10), monkeypatch, llaves)
    assert e.value.status_code == 401


def test_firma_de_otra_llave_es_401(monkeypatch):
    privada, _ = _llave()
    _, llaves_ajenas = _llave()
    with pytest.raises(HTTPException) as e:
        _correr(_token(privada), monkeypatch, llaves_ajenas)
    assert e.value.status_code == 401


def test_kid_desconocido_usa_el_respaldo(monkeypatch):
    privada, llaves = _llave("otro")
    assert _correr(_token(privada, kid="k1"), monkeypatch, llaves) == "desde-supabase"


def test_sin_bearer_es_401():
    with pytest.raises(HTTPException) as e:
        asyncio.run(auth.perfil_id_actual(authorization=None, settings=S))
    assert e.value.status_code == 401
