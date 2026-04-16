import { state } from "./state.js";
import { getFuelStations } from "./services/fuelStationsData.js";
import { renderFuelStationMarkers } from "./map/stationMarkers.js";
import { ensureFuelStationStyles } from "./ui/fuelStationStyles.js";

export function initFuelStations() {
    if (!state.map) {
        return;
    }

    ensureFuelStationStyles();

    state.fuelStations = getFuelStations().filter((station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
    );

    renderFuelStationMarkers(state.fuelStations);
}