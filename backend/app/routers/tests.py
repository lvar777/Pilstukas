from __future__ import annotations

import traceback
from typing import Any

from fastapi import APIRouter
from fastapi.testclient import TestClient
from pydantic import BaseModel

router = APIRouter(tags=["tests"])

# ---------------------------------------------------------------------------
# Test definitions
# ---------------------------------------------------------------------------

class TestDef(BaseModel):
    id: str
    name: str
    description: str
    input: dict[str, Any]
    expected: dict[str, Any]


TESTS: list[TestDef] = [
    TestDef(
        id="health",
        name="Sveikatos patikra",
        description="Tikrinama, ar API serveris veikia ir grąžina teisingą būseną.",
        input={"method": "GET", "url": "/api/health"},
        expected={"status_code": 200, "body": {"status": "ok"}},
    ),
    TestDef(
        id="fuel_prices_all_types",
        name="Kuro kainų sąrašas",
        description="Tikrinama, ar grąžinami visi keturi kuro tipai su teigiamomis kainomis.",
        input={"method": "GET", "url": "/api/fuel-prices"},
        expected={"status_code": 200, "keys": ["diesel", "petrol98", "petrol95", "lpg"]},
    ),
    TestDef(
        id="calc_distance_conversion",
        name="Atstumo konvertavimas",
        description="Tikrinama, ar 150 000 metrų teisingai konvertuojami į 150,0 km.",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 150000, "fuel_type": "diesel", "consumption_per_100km": 6.0},
        },
        expected={"status_code": 200, "body_contains": {"distance_km": 150.0}},
    ),
    TestDef(
        id="calc_liters_used",
        name="Sunaudotų litrų skaičiavimas",
        description="Tikrinama, ar 200 km atstumui su 8 L/100km sąnaudomis grąžinama 16,0 L.",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 200000, "fuel_type": "petrol95", "consumption_per_100km": 8.0},
        },
        expected={"status_code": 200, "body_contains": {"liters_used": 16.0}},
    ),
    TestDef(
        id="calc_trip_cost",
        name="Kelionės kainos skaičiavimas",
        description="Tikrinama, ar 100 km su 10 L/100km LPG kuru grąžinama teisinga kaina (7,79 €).",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 100000, "fuel_type": "lpg", "consumption_per_100km": 10.0},
        },
        expected={"status_code": 200, "body_contains": {"liters_used": 10.0, "trip_cost": 7.79}},
    ),
    TestDef(
        id="calc_unknown_fuel",
        name="Nežinomas kuro tipas",
        description="Tikrinama, ar pateikus neegzistuojantį kuro tipą grąžinamas 400 klaidos kodas.",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 50000, "fuel_type": "hydrogen", "consumption_per_100km": 5.0},
        },
        expected={"status_code": 400},
    ),
    TestDef(
        id="calc_zero_distance",
        name="Nulinis atstumas",
        description="Tikrinama, ar pateikus 0 metrų atstumą užklausa atmetama (422).",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 0, "fuel_type": "diesel", "consumption_per_100km": 6.0},
        },
        expected={"status_code": 422},
    ),
    TestDef(
        id="calc_negative_consumption",
        name="Neigiamos sąnaudos",
        description="Tikrinama, ar pateikus neigiamas sąnaudas užklausa atmetama (422).",
        input={
            "method": "POST",
            "url": "/api/calculate",
            "body": {"distance_meters": 10000, "fuel_type": "diesel", "consumption_per_100km": -5.0},
        },
        expected={"status_code": 422},
    ),
    TestDef(
        id="stations_list",
        name="Degalinių sąrašas",
        description="Tikrinama, ar grąžinamas ne tuščias degalinių sąrašas su tinkama struktūra.",
        input={"method": "GET", "url": "/api/stations"},
        expected={"status_code": 200, "is_list": True, "min_length": 1, "required_keys": ["id", "brand", "name", "address"]},
    ),
    TestDef(
        id="geocode_empty_query",
        name="Tuščia geokodavimo užklausa",
        description="Tikrinama, ar pateikus tuščią adresą grąžinamas validacijos klaidos kodas (422).",
        input={"method": "GET", "url": "/api/geocode/forward", "params": {"q": ""}},
        expected={"status_code": 422},
    ),
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/tests")
def list_tests():
    return [t.model_dump() for t in TESTS]


class TestResult(BaseModel):
    id: str
    passed: bool
    actual_status: int
    actual_body: Any
    error: str | None = None


def _find(test_id: str) -> TestDef | None:
    return next((t for t in TESTS if t.id == test_id), None)


def _run_one(t: TestDef) -> TestResult:
    from app.main import app as _app

    client = TestClient(_app, raise_server_exceptions=False)
    try:
        method = t.input["method"]
        url = t.input["url"]
        params = t.input.get("params")
        body = t.input.get("body")

        if method == "GET":
            resp = client.get(url, params=params)
        else:
            resp = client.post(url, json=body)

        actual_body = resp.json()
        passed = resp.status_code == t.expected["status_code"]

        if passed and "body" in t.expected:
            passed = actual_body == t.expected["body"]

        if passed and "body_contains" in t.expected:
            for k, v in t.expected["body_contains"].items():
                if actual_body.get(k) != v:
                    passed = False
                    break

        if passed and "keys" in t.expected:
            passed = set(t.expected["keys"]).issubset(set(actual_body.keys()))

        if passed and t.expected.get("is_list"):
            passed = isinstance(actual_body, list)
            if passed and "min_length" in t.expected:
                passed = len(actual_body) >= t.expected["min_length"]
            if passed and "required_keys" in t.expected and len(actual_body) > 0:
                passed = all(k in actual_body[0] for k in t.expected["required_keys"])

        return TestResult(id=t.id, passed=passed, actual_status=resp.status_code, actual_body=actual_body)

    except Exception as exc:
        return TestResult(id=t.id, passed=False, actual_status=0, actual_body=None, error=traceback.format_exc())


@router.post("/tests/run/{test_id}")
def run_single_test(test_id: str):
    t = _find(test_id)
    if not t:
        return {"error": "Test not found"}
    return _run_one(t).model_dump()


@router.post("/tests/run")
def run_all_tests():
    return [_run_one(t).model_dump() for t in TESTS]
