import { state } from "../state.js";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../config.js";
import { LITHUANIA_LEAFLET_BOUNDS } from "../utils/lithuaniaBounds.js";

export function initMap() {
    state.map = L.map("map", {
        maxBounds: LITHUANIA_LEAFLET_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 7
    }).setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);

    state.map.fitBounds(LITHUANIA_LEAFLET_BOUNDS);
}