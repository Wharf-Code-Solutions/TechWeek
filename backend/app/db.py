"""Acceso a Postgres vía PostgREST con la clave service_role (se salta el RLS).

Los nombres de la moneda (Tlacos) viven aquí para cambiarlos en un solo lugar.
"""
from typing import Any

import httpx
from fastapi import HTTPException

from .config import get_settings

COL_PREMIO = "tlacos"
COL_PREMIO_REVELADO = "tlacos_revelado"
COL_COSTO = "costo_tlacos"
TABLA_MOVIMIENTOS = "movimientos_tlacos"
VISTA_SALDO = "saldo"


def _headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    s = get_settings()
    base = {
        "apikey": s.supabase_service_key,
        "Authorization": f"Bearer {s.supabase_service_key}",
        "Content-Type": "application/json",
    }
    return {**base, **(extra or {})}


async def _pedir(metodo: str, ruta: str, *, params=None, json=None, prefer: str | None = None) -> Any:
    s = get_settings()
    if not s.supabase_url:
        raise HTTPException(503, "Supabase no está configurado en el servidor")
    extra = {"Prefer": prefer} if prefer else None
    async with httpx.AsyncClient(timeout=10) as http:
        r = await http.request(
            metodo, f"{s.supabase_url}/rest/v1/{ruta}", params=params, json=json, headers=_headers(extra)
        )
    if r.status_code == 409:
        raise HTTPException(409, "Ya existe")
    if r.status_code >= 400:
        raise HTTPException(502, f"Error de base de datos: {r.text[:200]}")
    return r.json() if r.content else None


async def seleccionar(tabla: str, **filtros: str) -> list[dict]:
    params = dict(filtros)
    params.setdefault("select", "*")
    return await _pedir("GET", tabla, params=params)


async def insertar(tabla: str, fila: dict, *, ignorar_duplicado: bool = False) -> list[dict]:
    prefer = "return=representation"
    if ignorar_duplicado:
        prefer += ",resolution=ignore-duplicates"
    return await _pedir("POST", tabla, json=fila, prefer=prefer)


async def actualizar(tabla: str, cambios: dict, **filtros: str) -> list[dict]:
    return await _pedir("PATCH", tabla, params=filtros, json=cambios, prefer="return=representation")


async def rpc(funcion: str, **args: Any) -> Any:
    """Ejecuta una función SQL de Supabase (solo service_role tiene permiso)."""
    return await _pedir("POST", f"rpc/{funcion}", json=args)


async def asegurar_perfil(perfil_id: str) -> None:
    await insertar("perfiles", {"id": perfil_id}, ignorar_duplicado=True)


async def saldo_de(perfil_id: str) -> int:
    filas = await seleccionar(VISTA_SALDO, perfil_id=f"eq.{perfil_id}")
    return filas[0][COL_PREMIO] if filas else 0
