import secrets

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import perfil_id_actual
from ..schemas import CanjeOut

router = APIRouter(prefix="/api", tags=["canjes"])


@router.post("/promociones/{slug}/canjear", response_model=CanjeOut, status_code=201)
async def canjear(slug: str, perfil_id: str = Depends(perfil_id_actual)):
    """Revisa el saldo, descuenta y genera el código del cupón."""
    promos = await db.seleccionar("promociones", slug=f"eq.{slug}", activa="eq.true")
    if not promos:
        raise HTTPException(404, "Promoción no disponible")
    promo = promos[0]
    costo = promo[db.COL_COSTO]

    if await db.saldo_de(perfil_id) < costo:
        raise HTTPException(402, "Saldo insuficiente")

    codigo = secrets.token_hex(3).upper()
    await db.insertar(
        db.TABLA_MOVIMIENTOS,
        {"perfil_id": perfil_id, "cantidad": -costo, "motivo": "canje", "ref_id": promo["id"]},
    )
    await db.insertar("canjes", {"perfil_id": perfil_id, "promocion_id": promo["id"], "codigo": codigo})
    return CanjeOut(codigo=codigo, saldo=await db.saldo_de(perfil_id))
