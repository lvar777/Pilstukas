import { state } from "../state.js";
import { reverseGeocode } from "../services/geocoding.js";
import { setStartPoint, setEndPoint, setWaypointPoint } from "./markers.js";
import { drawRouteIfPossible } from "./routes.js";
import { updateHint } from "../ui/hints.js";
import { setResult } from "../ui/results.js";

export function setupMapEvents() {
    state.map.on("click", async function(event) {
        if (!state.pickMode) {
            return;
        }

        const lat = event.latlng.lat;
        const lon = event.latlng.lng;

        const fromInput = document.getElementById("from");
        const toInput = document.getElementById("to");

        try {
            if (state.pickMode === "from") {
                setStartPoint(lat, lon, "Išvykimo taškas");
                fromInput.value = "Ieškoma adreso...";

                const address = await reverseGeocode(lat, lon);
                state.selectedStart.name = address;
                fromInput.value = address;

                state.pickMode = null;
                updateHint();

                if (state.selectedEnd) {
                    await drawRouteIfPossible(true);
                } else {
                    setResult("Viršutinis taškas pasirinktas.");
                }

                return;
            }

            if (state.pickMode === "to") {
                setEndPoint(lat, lon, "Atvykimo taškas");
                toInput.value = "Ieškoma adreso...";

                const address = await reverseGeocode(lat, lon);
                state.selectedEnd.name = address;
                toInput.value = address;

                state.pickMode = null;
                updateHint();

                if (state.selectedStart) {
                    await drawRouteIfPossible(true);
                } else {
                    setResult("Apatinis taškas pasirinktas.");
                }

                return;
            }

            if (typeof state.pickMode === "string" && state.pickMode.startsWith("waypoint:")) {
                const inputId = state.pickMode.split(":")[1];
                const waypointInput = document.getElementById(inputId);

                if (!waypointInput) {
                    state.pickMode = null;
                    updateHint();
                    setResult("Stotelės laukas nerastas.");
                    return;
                }

                waypointInput.value = "Ieškoma adreso...";
                setWaypointPoint(
                    Array.from(document.querySelectorAll(".waypoint-input")).indexOf(waypointInput),
                    lat,
                    lon,
                    "Tarpinė stotelė"
                );

                const address = await reverseGeocode(lat, lon);
                waypointInput.value = address;

                const waypointIndex = Array.from(document.querySelectorAll(".waypoint-input")).indexOf(waypointInput);
                if (state.selectedWaypoints[waypointIndex]) {
                    state.selectedWaypoints[waypointIndex].name = address;
                }

                state.pickMode = null;
                updateHint();
                setResult("Tarpinė stotelė pasirinkta.");
                return;
            }
        } catch (error) {
            setResult(error.message);
            console.error(error);
            state.pickMode = null;
            updateHint();
        }
    });
}