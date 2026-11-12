"""Carga src/data/seed.json en Supabase (insertar o actualizar por slug).

Uso (desde backend/, con el entorno virtual activo y backend/.env lleno):
    python -m scripts.cargar_seed

Es idempotente: se puede correr las veces que haga falta. No borra filas que ya no estén en el seed.
Usa la service_role de backend/.env. Solo Dev 1 debería correrlo contra la base compartida.
"""
import asyncio
import json
from pathlib import Path

import httpx

from app.config import get_settings

SEED = Path(__file__).resolve().parents[2] / "src" / "data" / "seed.json"


async def main() -> None:
    s = get_settings()
    if not s.supabase_url or not s.supabase_service_key:
        raise SystemExit("Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en backend/.env")
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    h = {
        "apikey": s.supabase_service_key,
        "Authorization": f"Bearer {s.supabase_service_key}",
        "Content-Type": "application/json",
    }
    rest = f"{s.supabase_url}/rest/v1"

    async with httpx.AsyncClient(timeout=30) as http:

        async def upsert(tabla: str, filas: list[dict], conflicto: str) -> list[dict]:
            r = await http.post(
                f"{rest}/{tabla}",
                params={"on_conflict": conflicto},
                json=filas,
                headers={**h, "Prefer": "resolution=merge-duplicates,return=representation"},
            )
            r.raise_for_status()
            print(f"  {tabla}: {len(filas)}")
            return r.json()

        print("Cargando seed en Supabase...")
        campos_lugar = ("slug", "nombre_es", "nombre_en", "categoria", "lat", "lng", "radio_m",
                        "curiosidad_es", "curiosidad_en", "ilustracion", "orden_sugerido", "en_demo")
        lugares = await upsert("lugares", [{k: l[k] for k in campos_lugar} for l in seed["lugares"]], "slug")
        id_lugar = {l["slug"]: l["id"] for l in lugares}

        campos_reto = ("tipo", "contenido_es", "contenido_en", "tlacos", "tlacos_revelado", "intentos_max")
        await upsert("retos", [{"lugar_id": id_lugar[r["lugar_slug"]], **{k: r[k] for k in campos_reto}}
                               for r in seed["retos"]], "lugar_id")

        await upsert("fotos_historicas", [{k: f[k] for k in ("slug", "url", "titulo_es", "titulo_en", "piezas")}
                                          for f in seed["fotos_historicas"]], "slug")

        campos_comercio = ("slug", "nombre", "categoria", "tipo", "lat", "lng", "descripcion_es", "descripcion_en",
                           "dato_es", "dato_en", "direccion", "horario_es", "horario_en", "foto_url", "aliado")
        comercios = await upsert("comercios", [{k: c.get(k) for k in campos_comercio} for c in seed["comercios"]], "slug")
        id_comercio = {c["slug"]: c["id"] for c in comercios}

        await upsert("promociones", [{"slug": p["slug"], "comercio_id": id_comercio[p["comercio_slug"]],
                                      **{k: p[k] for k in ("titulo_es", "titulo_en", "costo_tlacos", "activa")}}
                                     for p in seed["promociones"]], "slug")

        await upsert("eventos", [{k: e[k] for k in ("slug", "titulo_es", "titulo_en", "lugar", "lat", "lng",
                                                    "inicio", "fin", "categoria")}
                                 for e in seed["eventos"]], "slug")
        print("Listo.")


if __name__ == "__main__":
    asyncio.run(main())
