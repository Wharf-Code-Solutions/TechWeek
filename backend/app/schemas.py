from typing import Literal

from pydantic import BaseModel


class LlegadaIn(BaseModel):
    lugar_slug: str
    metodo: Literal["gps"] = "gps"
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
    ya_visitado: bool = False  # el lugar ya tenía sello: no da doblones, pero no es un error
    # Solo cuando el reto se cierra (acertado o revelado): la respuesta correcta, para mostrarla.
    # palabras: las palabras en orden · orden: los textos de los eventos en orden
    # trivia/intruso: [opción correcta] · verdadero_falso: ["verdadero"] o ["falso"]
    respuesta_correcta: list[str] | None = None


class CanjeOut(BaseModel):
    codigo: str
    saldo: int
