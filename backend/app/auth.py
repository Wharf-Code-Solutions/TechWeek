"""Identifica al celular: valida el JWT de la sesión anónima de Supabase."""
import httpx
from fastapi import Depends, Header, HTTPException

from .config import Settings, get_settings


async def perfil_id_actual(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Falta el token de sesión")
    if not settings.supabase_url:
        raise HTTPException(503, "Supabase no está configurado en el servidor")
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"Authorization": authorization, "apikey": settings.supabase_service_key},
        )
    if r.status_code != 200:
        raise HTTPException(401, "Sesión inválida o vencida")
    return r.json()["id"]
