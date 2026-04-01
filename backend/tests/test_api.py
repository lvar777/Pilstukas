import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import FUEL_PRICES

client = TestClient(app)


# 1. Health endpoint returns ok
def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# 2. Fuel prices endpoint returns all four fuel types
def test_fuel_prices_returns_all_types():
    resp = client.get("/api/fuel-prices")
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"diesel", "petrol98", "petrol95", "lpg"}
    for price in data.values():
        assert isinstance(price, float)
        assert price > 0


# 3. Fuel calculation returns correct distance conversion
def test_calculate_distance_conversion():
    resp = client.post("/api/calculate", json={
        "distance_meters": 150000,
        "fuel_type": "diesel",
        "consumption_per_100km": 6.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["distance_km"] == 150.0


# 4. Fuel calculation returns correct liters used
def test_calculate_liters_used():
    resp = client.post("/api/calculate", json={
        "distance_meters": 200000,
        "fuel_type": "petrol95",
        "consumption_per_100km": 8.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    # 200 km * 8.0 / 100 = 16.0 L
    assert data["liters_used"] == 16.0


# 5. Fuel calculation returns correct trip cost
def test_calculate_trip_cost():
    resp = client.post("/api/calculate", json={
        "distance_meters": 100000,
        "fuel_type": "lpg",
        "consumption_per_100km": 10.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    # 100 km * 10 / 100 = 10 L; 10 * 0.779 = 7.79
    assert data["liters_used"] == 10.0
    assert data["trip_cost"] == round(10.0 * FUEL_PRICES["lpg"], 2)
    assert data["price_per_liter"] == FUEL_PRICES["lpg"]


# 6. Fuel calculation rejects unknown fuel type
def test_calculate_unknown_fuel_type():
    resp = client.post("/api/calculate", json={
        "distance_meters": 50000,
        "fuel_type": "hydrogen",
        "consumption_per_100km": 5.0,
    })
    assert resp.status_code == 400


# 7. Fuel calculation rejects zero distance
def test_calculate_rejects_zero_distance():
    resp = client.post("/api/calculate", json={
        "distance_meters": 0,
        "fuel_type": "diesel",
        "consumption_per_100km": 6.0,
    })
    assert resp.status_code == 422


# 8. Fuel calculation rejects negative consumption
def test_calculate_rejects_negative_consumption():
    resp = client.post("/api/calculate", json={
        "distance_meters": 10000,
        "fuel_type": "diesel",
        "consumption_per_100km": -5.0,
    })
    assert resp.status_code == 422


# 9. Stations endpoint returns a non-empty list with correct structure
def test_stations_returns_list():
    resp = client.get("/api/stations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    station = data[0]
    assert "id" in station
    assert "brand" in station
    assert "name" in station
    assert "address" in station


# 10. Forward geocode rejects empty query
def test_geocode_forward_empty_query():
    resp = client.get("/api/geocode/forward", params={"q": ""})
    assert resp.status_code == 422
