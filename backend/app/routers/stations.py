import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(tags=["stations"])

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "fuel_stations.json"


def _load_stations():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


@router.get("/stations")
def get_stations():
    return _load_stations()
