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
        if (marker) {
            state.map.removeLayer(marker);
        }
    });

    state.waypointMarkers = [];
}

export function renderWaypointMarkers(waypoints = []) {
    clearWaypointMarkers();

    state.waypointMarkers = waypoints.map((waypoint, index) => {
        if (!waypoint || !Number.isFinite(waypoint.lat) || !Number.isFinite(waypoint.lon)) {
            return null;
        }

        return L.marker([waypoint.lat, waypoint.lon])
            .addTo(state.map)
            .bindPopup(`Stotelė ${index + 1}`);
    });
}

export function setWaypointPoint(index, lat, lon, labelText = `Stotelė ${index + 1}`) {
    clearRouteOnly();

    if (!state.selectedWaypoints) {
        state.selectedWaypoints = [];
    }

    state.selectedWaypoints[index] = {
        lat,
        lon,
        name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };

    renderWaypointMarkers(state.selectedWaypoints);

    const marker = state.waypointMarkers[index];
    if (marker) {
        marker.bindPopup(labelText);
    }
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