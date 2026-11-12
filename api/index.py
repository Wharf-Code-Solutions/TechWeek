"""Entrada del backend FastAPI en Vercel (función de Python).

Vercel sirve el frontend (Vite) y manda /api/* aquí; la app real vive en backend/app.
Variables necesarias en Vercel: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402  (Vercel busca la variable `app`)

__all__ = ["app"]
