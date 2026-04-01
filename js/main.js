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