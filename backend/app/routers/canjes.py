from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import perfil_id_actual
from ..schemas import CanjeOut

router = APIRouter(prefix="/api", tags=["canjes"])

_ERRORES = {
    "promocion_no_disponible": (404, "Promoción no disponible"),
    "saldo_insuficiente": (402, "Saldo insuficiente"),
}


@router.post("/promociones/{slug}/canjear", response_model=CanjeOut, status_code=201)
async def canjear(slug: str, perfil_id: str = Depends(perfil_id_actual)):
    """Revisa el saldo, descuenta y genera el código del cupón en una sola transacción.

    La lógica vive en la función SQL `canjear` (migración 0002): bloquea por perfil,
    así que dos toques rápidos no pueden gastar el mismo saldo.
    """
    r = await db.rpc("canjear", p_perfil_id=perfil_id, p_promocion_slug=slug)
    if not r.get("ok"):
        status, mensaje = _ERRORES.get(r.get("error"), (502, "No se pudo canjear"))
        raise HTTPException(status, mensaje)
    return CanjeOut(codigo=r["codigo"], saldo=r["saldo"])
