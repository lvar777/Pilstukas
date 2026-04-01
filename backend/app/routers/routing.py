from fastapi import APIRouter, Query, HTTPException
import httpx

from app.config import OSRM_BASE_URL

router = APIRouter(tags=["routing"])


@router.get("/route")
async def get_route(
    from_lat: float = Query(...),
    from_lon: float = Query(...),
    to_lat: float = Query(...),
    to_lon: float = Query(...),
):
    coords = f"{from_lon},{from_lat};{to_lon},{to_lat}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{OSRM_BASE_URL}/route/v1/driving/{coords}",
            params={"overview": "full", "geometries": "geojson"},
        )
        if resp.status_code != 200:
            raise HTTPException(502, "Routing service error")
        data = resp.json()
        if not data.get("routes"):
            raise HTTPException(404, "No route found")
        route = data["routes"][0]
        return {
            "distance": route["distance"],
            "geometry": route["geometry"],
        }
