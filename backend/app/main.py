from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import canjes, catalogo, pasaporte, retos, rutas, sesion, visitas

app = FastAPI(title="JARANA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().origenes,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sesion.router)
app.include_router(catalogo.router)
app.include_router(visitas.router)
app.include_router(retos.router)
app.include_router(canjes.router)
app.include_router(rutas.router)
app.include_router(pasaporte.router)


@app.get("/health")
async def health():
    return {"estado": "ok"}
