import { state } from "../state.js";
import { buildStationPopup } from "./stationPopup.js";
import { filterStationsInLithuania } from "../utils/lithuaniaBounds.js";

function getLogoUrl(station) {
    const brand = (station.brand || station.name || station.operator || "").toLowerCase();

    if (brand.includes("circle")) return "assets/logos/cirklek.png";
    if (brand.includes("viada")) return "assets/logos/viada.png";
    if (brand.includes("baltic") || brand.includes("bp")) return "assets/logos/bp.png";
    if (brand.includes("neste")) return "assets/logos/neste.png";
    if (brand.includes("orlen")) return "assets/logos/orlen.png";

    return null;
}

function createFuelStationIcon(station) {
    const logoUrl = getLogoUrl(station);

    const content = logoUrl
        ? `<img src="${logoUrl}" alt="">`
        : `<span class="fuel-station-icon-symbol">⛽</span>`;

    return L.divIcon({
        className: "fuel-station-icon-wrapper",
        html: `
            <div class="fuel-logo-marker">
                ${content}
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -36]
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

    const lithuanianStations = filterStationsInLithuania(stations);

    const markers = lithuanianStations.map((station) => {
        const icon = createFuelStationIcon(station);

        const marker = L.marker([station.lat, station.lon], {
            icon: icon
        });

        marker.bindPopup(buildStationPopup(station), {
            closeButton: false,
            className: "station-leaflet-popup",
            minWidth: 260
        });

        bindPopupClose(marker);

        return marker;
    });

    state.fuelStationMarkers = markers;
    state.fuelStationLayer = L.layerGroup(markers);

    if (state.fuelStationsVisible) {
        state.fuelStationLayer.addTo(state.map);
    }
}

export function setFuelStationsVisible(isVisible) {
    state.fuelStationsVisible = Boolean(isVisible);

    try {
        localStorage.setItem("fuelStationsVisible", state.fuelStationsVisible ? "true" : "false");
    } catch (error) {
        // localStorage gali būti nepasiekiamas privačiame režime
    }

    if (!state.map || !state.fuelStationLayer) {
        return;
    }

    if (state.fuelStationsVisible) {
        if (!state.map.hasLayer(state.fuelStationLayer)) {
            state.fuelStationLayer.addTo(state.map);
        }
    } else if (state.map.hasLayer(state.fuelStationLayer)) {
        state.map.removeLayer(state.fuelStationLayer);
    }
}

export function showStations() {
    setFuelStationsVisible(true);
}

export function hideStations() {
    setFuelStationsVisible(false);
}