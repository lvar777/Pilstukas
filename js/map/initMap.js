import { state } from "../state.js";

export function initMap() {
    state.map = L.map("map", {
        maxBounds: [
            [50.5, 16.0],
            [59.5, 31.5]
        ],
        maxBoundsViscosity: 0.05,
        minZoom: 6,
        worldCopyJump: false
    }).setView([55.17, 23.88], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);
}