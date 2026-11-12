"""Validación de respuestas de los minijuegos (formato del contrato 3).

Tipos:
- palabras        {texto, respuestas, opciones}            → respuesta: las palabras en orden
- orden           {eventos, orden_correcto}                → respuesta: ids en orden
- trivia          {pregunta, opciones, correcta}           → respuesta: [opción elegida]
- verdadero_falso {afirmacion, correcta: bool}             → respuesta: ["verdadero"] o ["falso"]
- intruso         {pregunta, opciones, correcta}           → respuesta: [opción que no pertenece]
"""


def _norm(t: str) -> str:
    return str(t).strip().casefold()


def validar_palabras(contenido: dict, respuestas: list[str]) -> bool:
    esperadas = contenido["respuestas"]
    return len(respuestas) == len(esperadas) and all(
        _norm(a) == _norm(b) for a, b in zip(respuestas, esperadas)
    )


def validar_orden(contenido: dict, orden: list[str]) -> bool:
    return orden == contenido["orden_correcto"]


def validar_opcion(contenido: dict, respuesta: list[str]) -> bool:
    """Trivia e intruso: una sola opción, que debe ser la correcta."""
    return len(respuesta) == 1 and _norm(respuesta[0]) == _norm(contenido["correcta"])


_VERDADERO = {"verdadero", "true", "v", "sí", "si", "yes"}
_FALSO = {"falso", "false", "f", "no"}


def validar_verdadero_falso(contenido: dict, respuesta: list[str]) -> bool:
    if len(respuesta) != 1:
        return False
    r = _norm(respuesta[0])
    if r not in _VERDADERO | _FALSO:
        return False
    return (r in _VERDADERO) == bool(contenido["correcta"])


_OCULTAS = {
    "palabras": "respuestas",
    "orden": "orden_correcto",
    "trivia": "correcta",
    "verdadero_falso": "correcta",
    "intruso": "correcta",
}


def ocultar_respuestas(tipo: str, contenido: dict) -> dict:
    """Copia del contenido sin las respuestas correctas, para enviarlo al navegador."""
    return {k: v for k, v in contenido.items() if k != _OCULTAS.get(tipo)}


def validar(tipo: str, contenido: dict, respuesta: list[str]) -> bool:
    if tipo == "palabras":
        return validar_palabras(contenido, respuesta)
    if tipo == "orden":
        return validar_orden(contenido, respuesta)
    if tipo in ("trivia", "intruso"):
        return validar_opcion(contenido, respuesta)
    if tipo == "verdadero_falso":
        return validar_verdadero_falso(contenido, respuesta)
    return False
