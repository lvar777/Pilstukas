from fastapi import APIRouter, Query, HTTPException
import httpx

from app.config import NOMINATIM_BASE_URL

router = APIRouter(tags=["geocoding"])

HEADERS = {"User-Agent": "KainosSkaiciuokle/1.0"}


@router.get("/geocode/forward")
async def forward_geocode(q: str = Query(..., min_length=1)):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOMINATIM_BASE_URL}/search",
            params={"format": "jsonv2", "q": q},
            headers=HEADERS,
        )
        if resp.status_code != 200:
            raise HTTPException(502, "Geocoding service error")
        results = resp.json()
        if not results:
            return []
        return [
            {"lat": float(r["lat"]), "lon": float(r["lon"]), "display_name": r["display_name"]}
            for r in results[:5]
        ]


@router.get("/geocode/reverse")
async def reverse_geocode(
    lat: float = Query(...),
    lon: float = Query(...),
):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{NOMINATIM_BASE_URL}/reverse",
            params={"format": "jsonv2", "lat": lat, "lon": lon},
            headers=HEADERS,
        )
        if resp.status_code != 200:
            raise HTTPException(502, "Geocoding service error")
        data = resp.json()
        return {"lat": float(data["lat"]), "lon": float(data["lon"]), "display_name": data.get("display_name", "")}
