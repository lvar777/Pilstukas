import { initMap } from "./map/initMap.js";
import { setupMenu } from "./ui/menu.js";
import { setupInputs } from "./ui/inputs.js";
import { setupMapEvents } from "./map/mapEvents.js";
import { updateHint } from "./ui/hints.js";
import { initFuelStations} from "./fuelStations.js";

function startApp() {
    initMap();
    initFuelStations();
    setupMenu();
    setupInputs();
    setupMapEvents();
    updateHint();
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