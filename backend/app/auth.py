"""Identifica al celular: valida el JWT de la sesión anónima de Supabase.

Ruta rápida: verifica la firma del token localmente con las llaves públicas del proyecto
(JWKS, en caché 1 h), sin preguntarle a Supabase en cada petición.
Respaldo: si el token no trae un `kid` conocido o no se pudo leer el JWKS, se pregunta a /auth/v1/user.
"""
import time

import jwt
from fastapi import Depends, Header, HTTPException

from .config import Settings, get_settings
from .db import cliente_http

_JWKS_TTL = 3600
_jwks: dict = {"llaves": {}, "hasta": 0.0, "url": ""}


async def _llaves(settings: Settings) -> dict[str, jwt.PyJWK]:
    ahora = time.monotonic()
    if _jwks["url"] == settings.supabase_url and ahora < _jwks["hasta"]:
        return _jwks["llaves"]
    r = await cliente_http().get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")
    r.raise_for_status()
    llaves = {k["kid"]: jwt.PyJWK(k) for k in r.json().get("keys", []) if k.get("kid")}
    _jwks.update(llaves=llaves, hasta=ahora + _JWKS_TTL, url=settings.supabase_url)
    return llaves


async def _verificar_local(token: str, settings: Settings) -> str | None:
    """Devuelve el id del usuario, o None si hay que usar el respaldo."""
    try:
        kid = jwt.get_unverified_header(token).get("kid")
        if not kid:
            return None
        llave = (await _llaves(settings)).get(kid)
        if llave is None:
            return None
    except Exception:  # sin JWKS o token ilegible: que decida el respaldo
        return None
    try:
        datos = jwt.decode(
            token,
            llave.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesión inválida o vencida")
    return datos["sub"]


async def _verificar_en_supabase(authorization: str, settings: Settings) -> str:
    r = await cliente_http().get(
        f"{settings.supabase_url}/auth/v1/user",
        headers={"Authorization": authorization, "apikey": settings.supabase_service_key},
    )
    if r.status_code != 200:
        raise HTTPException(401, "Sesión inválida o vencida")
    return r.json()["id"]


async def perfil_id_actual(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Falta el token de sesión")
    if not settings.supabase_url:
        raise HTTPException(503, "Supabase no está configurado en el servidor")
    token = authorization.split(" ", 1)[1].strip()
    return await _verificar_local(token, settings) or await _verificar_en_supabase(authorization, settings)
