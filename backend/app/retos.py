"""Validación de respuestas de los minijuegos (formato del contrato 3)."""


def _norm(t: str) -> str:
    return t.strip().casefold()


def validar_palabras(contenido: dict, respuestas: list[str]) -> bool:
    esperadas = contenido["respuestas"]
    return len(respuestas) == len(esperadas) and all(
        _norm(a) == _norm(b) for a, b in zip(respuestas, esperadas)
    )


def validar_orden(contenido: dict, orden: list[str]) -> bool:
    return orden == contenido["orden_correcto"]


def ocultar_respuestas(tipo: str, contenido: dict) -> dict:
    """Copia del contenido sin las respuestas correctas, para enviarlo al navegador."""
    ocultas = {"palabras": "respuestas", "orden": "orden_correcto"}
    return {k: v for k, v in contenido.items() if k != ocultas.get(tipo)}


def validar(tipo: str, contenido: dict, respuesta: list[str]) -> bool:
    if tipo == "palabras":
        return validar_palabras(contenido, respuesta)
    if tipo == "orden":
        return validar_orden(contenido, respuesta)
    return False
