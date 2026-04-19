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

export function clearWaypointMarkers() {
    if (!state.waypointMarkers) {
        state.waypointMarkers = [];
        return;
    }

    state.waypointMarkers.forEach((marker) => {
        state.map.removeLayer(marker);
    });

    state.waypointMarkers = [];
}

export function renderWaypointMarkers(waypoints = []) {
    clearWaypointMarkers();

    state.waypointMarkers = waypoints.map((waypoint, index) => {
        return L.marker([waypoint.lat, waypoint.lon])
            .addTo(state.map)
            .bindPopup(`Stotelė ${index + 1}`);
    });
}

export function setStartPoint(lat, lon, labelText = "Išvykimo taškas") {
    clearStartMarker();
    clearRouteOnly();

    state.selectedStart = {
        lat,
        lon,
        name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };

    state.startMarker = L.marker([lat, lon]).addTo(state.map).bindPopup(labelText);
}

export function setEndPoint(lat, lon, labelText = "Atvykimo taškas") {
    clearEndMarker();
    clearRouteOnly();

    state.selectedEnd = {
        lat,
        lon,
        name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };

    state.endMarker = L.marker([lat, lon]).addTo(state.map).bindPopup(labelText);
}