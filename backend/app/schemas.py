from typing import Literal

from pydantic import BaseModel


class LlegadaIn(BaseModel):
    lugar_slug: str
    metodo: Literal["gps", "demo"]
    lat: float | None = None
    lng: float | None = None


class RetoIn(BaseModel):
    respuesta: list[str] = []
    revelar: bool = False
    idioma: Literal["es", "en"] = "es"


class RetoOut(BaseModel):
    correcto: bool
    completado: bool
    tlacos_ganados: int
    saldo: int


class CanjeOut(BaseModel):
    codigo: str
    saldo: int
