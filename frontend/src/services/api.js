import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function forwardGeocode(query) {
  const { data } = await api.get("/geocode/forward", { params: { q: query } });
  return data;
}

export async function reverseGeocode(lat, lon) {
  const { data } = await api.get("/geocode/reverse", { params: { lat, lon } });
  return data;
}

export async function getRoute(from, to) {
  const { data } = await api.get("/route", {
    params: {
      from_lat: from.lat,
      from_lon: from.lon,
      to_lat: to.lat,
      to_lon: to.lon,
    },
  });
  return data;
}

export async function calculateFuel(distanceMeters, fuelType, consumptionPer100km) {
  const { data } = await api.post("/calculate", {
    distance_meters: distanceMeters,
    fuel_type: fuelType,
    consumption_per_100km: consumptionPer100km,
  });
  return data;
}

export async function getFuelPrices() {
  const { data } = await api.get("/fuel-prices");
  return data;
}

export async function getStations() {
  const { data } = await api.get("/stations");
  return data;
}
