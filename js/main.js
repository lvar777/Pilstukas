import { initMap } from "./map/initMap.js";
import { setupMenu } from "./ui/menu.js";
import { setupInputs } from "./ui/inputs.js";
import { setupMapEvents } from "./map/mapEvents.js";
import { updateHint } from "./ui/hints.js";
import { initFuelStations } from "./fuelStations.js";
import { renderFuelStationMarkers } from "./map/stationMarkers.js";
import { state } from "./state.js";

function startApp() {
    initMap();
    initFuelStations();
    setupMenu();
    setupInputs();
    setupMapEvents();
    updateHint();

    const badge = document.getElementById("stationsCountBadge");
    if (badge) {
        badge.textContent = state.fuelStations.length;
    }
}

startApp();

const panelWrap = document.getElementById("panelWrap");
const closePanelBtn = document.getElementById("closePanelBtn");
const openRoutePanelBtn = document.getElementById("openRoutePanelBtn");
const navRouteBtn = document.getElementById("navRouteBtn");
const navStationsBtn = document.getElementById("navStationsBtn")
const stationsFiltersBar = document.getElementById("stationsFiltersBar");

if (openRoutePanelBtn) {
    openRoutePanelBtn.addEventListener("click", function() {
        panelWrap.classList.add("open");
    });
}

if (navRouteBtn) {
    navRouteBtn.addEventListener("click", function() {
        panelWrap.classList.add("open");
    });
}

if (closePanelBtn) {
    closePanelBtn.addEventListener("click", function() {
        panelWrap.classList.remove("open");
    });
}

if (navStationsBtn && stationsFiltersBar) {
    navStationsBtn.addEventListener("click", function () {
        stationsFiltersBar.classList.toggle("hidden-filters");
        stationsFiltersBar.classList.toggle("active");
        navStationsBtn.classList.toggle("active");
    });
}

const stationNameSearch = document.getElementById("stationNameSearch");
const brandQuickFilter = document.getElementById("brandQuickFilter");
const fuelQuickFilter = document.getElementById("fuelQuickFilter");
const stationsCountBadge = document.getElementById("stationsCountBadge");

function applyStationFilters() {
    const nameQuery = stationNameSearch ? stationNameSearch.value.trim().toLowerCase() : "";
    const brand = brandQuickFilter ? brandQuickFilter.value : "";
    const fuel = fuelQuickFilter ? fuelQuickFilter.value : "";

    const filtered = state.fuelStations.filter((station) => {
        const matchesName = !nameQuery ||
            (station.name && station.name.toLowerCase().includes(nameQuery)) ||
            (station.brand && station.brand.toLowerCase().includes(nameQuery)) ||
            (station.address && station.address.toLowerCase().includes(nameQuery)) ||
            (station.city && station.city.toLowerCase().includes(nameQuery));

        const matchesBrand = !brand ||
            (station.brand && station.brand.toLowerCase().replace(/\s+/g, "") === brand.toLowerCase());

        const matchesFuel = !fuel || (station.prices && station.prices[fuel] !== undefined);

        return matchesName && matchesBrand && matchesFuel;
    });

    renderFuelStationMarkers(filtered);

    if (stationsCountBadge) {
        stationsCountBadge.textContent = filtered.length;
    }
}

if (stationNameSearch) {
    stationNameSearch.addEventListener("input", applyStationFilters);
}

if (brandQuickFilter) {
    brandQuickFilter.addEventListener("change", applyStationFilters);
}

if (fuelQuickFilter) {
    fuelQuickFilter.addEventListener("change", applyStationFilters);
}