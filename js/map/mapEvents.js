import { state } from "../state.js";
import { reverseGeocode } from "../services/geocoding.js";
import { setStartPoint, setEndPoint } from "./markers.js";
import { drawRouteIfPossible } from "./routes.js";
import { updateHint } from "../ui/hints.js";
import { setResult } from "../ui/results.js";
import { isPointInLithuania } from "../utils/lithuaniaBounds.js";

export function setupMapEvents() {
    state.map.on("click", async function(event) {
        if (!state.pickMode) {
            return;
        }

        const lat = event.latlng.lat;
        const lon = event.latlng.lng;

        if (!isPointInLithuania(lat, lon)) {
            setResult("Galima pasirinkti tik taskus Lietuvoje.");
            state.pickMode = null;
            updateHint();
            return;
        }

        const fromInput = document.getElementById("from");
        const toInput = document.getElementById("to");

        try {
            if (state.pickMode === "from") {
                setStartPoint(lat, lon, "Taskas A");
                fromInput.value = "Ieskoma adreso...";

                const address = await reverseGeocode(lat, lon);
                state.selectedStart.name = address;
                fromInput.value = address;

                state.pickMode = null;
                updateHint();

                if (state.selectedEnd) {
                    await drawRouteIfPossible(true);
                } else {
                    setResult("Isvykimo taskas pasirinktas.");
                }

                return;
            }

            if (state.pickMode === "to") {
                setEndPoint(lat, lon, "Taskas B");
                toInput.value = "Ieskoma adreso...";

                const address = await reverseGeocode(lat, lon);
                state.selectedEnd.name = address;
                toInput.value = address;

                state.pickMode = null;
                updateHint();

                if (state.selectedStart) {
                    await drawRouteIfPossible(true);
                } else {
                    setResult("Atvykimo taskas pasirinktas.");
                }
            }
        } catch (error) {
            setResult(error.message);
            console.error(error);
            state.pickMode = null;
            updateHint();
        }
    });
}