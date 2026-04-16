import { state } from "../state.js";
import { getRoute } from "../services/routing.js";
import { formatDistance } from "../utils/format.js";
import { setResult, setDistanceResult, clearTripCalculationTexts } from "../ui/results.js";

export function clearRouteOnly() {
    if (state.routeLine) {
        state.map.removeLayer(state.routeLine);
        state.routeLine = null;
    }

    state.currentRouteDistanceMeters = null;
    setDistanceResult("");
    clearTripCalculationTexts();
}

export async function drawRouteIfPossible(fitToRoute = true) {
    clearRouteOnly();

    if (!state.selectedStart || !state.selectedEnd) {
        if (state.selectedStart || state.selectedEnd) {
            setResult("Pasirink dar viena taska.");
        } else {
            setResult("Ivesk dvi vietas arba pasirink taskus zemelapyje.");
        }
        return;
    }

    setResult("Ieskoma marsruto...");

    try {
        const route = await getRoute(state.selectedStart, state.selectedEnd);

        state.routeLine = L.geoJSON(route.geometry).addTo(state.map);
        state.currentRouteDistanceMeters = route.distance;

        if (fitToRoute) {
            state.map.fitBounds(state.routeLine.getBounds(), { padding: [40, 40] });
        }

        setResult("Marsrutas parodytas.");
        setDistanceResult(`Atstumas keliu: ${formatDistance(route.distance)}`);
        clearTripCalculationTexts();
    } catch (error) {
        setResult(error.message);
        console.error(error);
    }
}