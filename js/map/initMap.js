import { state } from "../state.js";
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from "../config.js";

export function initMap() {
    state.map = L.map("map").setView(MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);
}