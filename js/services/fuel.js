import { FUEL_PRICES } from "../config.js";

export function calculateTrip(distanceMeters, consumptionPer100Km, fuelType) {
    const tripDistanceKm = distanceMeters / 1000;
    const litersUsed = (tripDistanceKm * consumptionPer100Km) / 100;
    const tripCost = litersUsed * FUEL_PRICES[fuelType];

    return {
        litersUsed,
        tripCost
    };
}