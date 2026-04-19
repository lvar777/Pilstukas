import { state } from "../state.js";
import { setMapHint } from "./results.js";

export function updateHint() {
    if (state.pickMode === "from") {
        setMapHint("Pasirinktas viršutinis taškas. Spausk žemėlapyje.");
        return;
    }

    if (state.pickMode === "to") {
        setMapHint("Pasirinktas apatinis taškas. Spausk žemėlapyje.");
        return;
    }

    if (typeof state.pickMode === "string" && state.pickMode.startsWith("waypoint:")) {
        setMapHint("Pasirinkta tarpinė stotelė. Spausk žemėlapyje.");
        return;
    }

    setMapHint("Maršrutas skaičiuojamas iš viršaus į apačią.");
}