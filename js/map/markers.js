import { state } from "../state.js";
import { clearRouteOnly } from "./routes.js";

export function clearStartMarker() {
    if (state.startMarker) {
        state.map.removeLayer(state.startMarker);
        state.startMarker = null;
    }
}

export function clearEndMarker() {
    if (state.endMarker) {
        state.map.removeLayer(state.endMarker);
        state.endMarker = null;
    }
}

export function setStartPoint(lat, lon, labelText = "Taskas A") {
    clearStartMarker();
    clearRouteOnly();

    state.selectedStart = {
        lat: lat,
        lon: lon,
        name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };

    state.startMarker = L.marker([lat, lon]).addTo(state.map).bindPopup(labelText);
}

export function setEndPoint(lat, lon, labelText = "Taskas B") {
    clearEndMarker();
    clearRouteOnly();

    state.selectedEnd = {
        lat: lat,
        lon: lon,
        name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };

    state.endMarker = L.marker([lat, lon]).addTo(state.map).bindPopup(labelText);
}