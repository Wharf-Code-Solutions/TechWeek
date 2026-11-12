"""Sesión anónima: el frontend ya no habla con Supabase, el backend la abre por él."""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import get_settings

router = APIRouter(prefix="/api/sesion", tags=["sesion"])


class SesionOut(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int


class RenovarIn(BaseModel):
    refresh_token: str


async def _auth(ruta: str, *, params=None, json=None) -> SesionOut:
    s = get_settings()
    if not s.supabase_url or not s.supabase_anon_key:
        raise HTTPException(503, "Supabase no está configurado en el servidor")
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.post(
            f"{s.supabase_url}/auth/v1/{ruta}",
            params=params,
            json=json if json is not None else {},
            headers={"apikey": s.supabase_anon_key},
        )
    if r.status_code != 200:
        raise HTTPException(401, "No se pudo abrir la sesión")
    d = r.json()
    return SesionOut(
        access_token=d["access_token"], refresh_token=d["refresh_token"], expires_at=d["expires_at"]
    )


@router.post("", response_model=SesionOut, status_code=201)
async def iniciar():
    """Crea un usuario anónimo (uno por celular)."""
    return await _auth("signup")


@router.post("/renovar", response_model=SesionOut)
async def renovar(datos: RenovarIn):
    return await _auth(
        "token", params={"grant_type": "refresh_token"}, json={"refresh_token": datos.refresh_token}
    )
