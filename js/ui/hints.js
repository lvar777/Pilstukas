import { state } from "../state.js";
import { setMapHint } from "./results.js";

export function updateHint() {
    if (state.pickMode === "from") {
        setMapHint("Pasirinktas A rezimas. Spausk zemelapyje isvykimo taska.");
        return;
    }

    if (state.pickMode === "to") {
        setMapHint("Pasirinktas B rezimas. Spausk zemelapyje atvykimo taska.");
        return;
    }

    setMapHint("Spausk A arba B mygtuka, tada spausk zemelapyje.");
}