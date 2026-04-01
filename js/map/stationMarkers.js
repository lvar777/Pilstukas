import { state } from "../state.js";
import { buildStationPopup } from "./stationPopup.js";

function createFuelStationIcon() {
    return L.divIcon({
        className: "fuel-station-icon-wrapper",
        html: `
            <div class="fuel-station-icon" aria-hidden="true">
                <span class="fuel-station-icon-symbol">⛽</span>
            </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -28]
    });
}

function bindPopupClose(marker) {
    marker.on("popupopen", function(event) {
        const popupElement = event.popup.getElement();

        if (!popupElement) {
            return;
        }

        const closeBtn = popupElement.querySelector("[data-popup-close='true']");

        if (!closeBtn) {
            return;
        }

        closeBtn.addEventListener("click", function() {
            marker.closePopup();
        });
    });
}

export function clearFuelStationMarkers() {
    if (Array.isArray(state.fuelStationMarkers)) {
        state.fuelStationMarkers.forEach((marker) => {
            if (state.map && marker) {
                state.map.removeLayer(marker);
            }
        });
    }

    state.fuelStationMarkers = [];

    if (state.fuelStationLayer) {
        state.map.removeLayer(state.fuelStationLayer);
        state.fuelStationLayer = null;
    }
}

export function renderFuelStationMarkers(stations) {
    if (!state.map || !Array.isArray(stations)) {
        return;
    }

    clearFuelStationMarkers();

    const icon = createFuelStationIcon();

    const markers = stations.map((station) => {
        const marker = L.marker([station.lat, station.lon], { icon: icon });

        marker.bindPopup(buildStationPopup(station), {
            closeButton: false,
            className: "station-leaflet-popup",
            minWidth: 260
        });

        bindPopupClose(marker);

        return marker;
    });

    state.fuelStationMarkers = markers;
    state.fuelStationLayer = L.layerGroup(markers).addTo(state.map);
}