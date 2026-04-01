from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import FUEL_PRICES

router = APIRouter(tags=["fuel"])


class FuelCalcRequest(BaseModel):
    distance_meters: float = Field(..., gt=0)
    fuel_type: str
    consumption_per_100km: float = Field(..., gt=0)


class FuelCalcResponse(BaseModel):
    distance_km: float
    liters_used: float
    price_per_liter: float
    trip_cost: float


@router.post("/calculate", response_model=FuelCalcResponse)
def calculate_fuel(req: FuelCalcRequest):
    price = FUEL_PRICES.get(req.fuel_type)
    if price is None:
        raise HTTPException(400, f"Unknown fuel type: {req.fuel_type}. Valid: {list(FUEL_PRICES.keys())}")

    distance_km = req.distance_meters / 1000
    liters_used = (distance_km * req.consumption_per_100km) / 100
    trip_cost = liters_used * price

    return FuelCalcResponse(
        distance_km=round(distance_km, 2),
        liters_used=round(liters_used, 2),
        price_per_liter=price,
        trip_cost=round(trip_cost, 2),
    )


@router.get("/fuel-prices")
def get_fuel_prices():
    return FUEL_PRICES
