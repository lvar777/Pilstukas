from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.routers import geocoding, routing, fuel, stations, tests

app = FastAPI(title="Kainos Skaičiuoklė API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(geocoding.router, prefix="/api")
app.include_router(routing.router, prefix="/api")
app.include_router(fuel.router, prefix="/api")
app.include_router(stations.router, prefix="/api")
app.include_router(tests.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
