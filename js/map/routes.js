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
            setResult("Pasirink dar vieną tašką.");
        } else {
            setResult("Įvesk bent pradžią ir pabaigą.");
        }
        return;
    }

    const routePoints = [
        state.selectedStart,
        ...state.selectedWaypoints.filter(
            (waypoint) => waypoint && Number.isFinite(waypoint.lat) && Number.isFinite(waypoint.lon)
        ),
        state.selectedEnd
    ];

    setResult("Ieškomas maršrutas...");

    try {
        const route = await getRoute(routePoints);

        state.routeLine = L.geoJSON(route.geometry).addTo(state.map);
        state.currentRouteDistanceMeters = route.distance;

        if (fitToRoute) {
            state.map.fitBounds(state.routeLine.getBounds(), { padding: [40, 40] });
        }

        setResult("Maršrutas parodytas.");
        setDistanceResult(`Atstumas keliu: ${formatDistance(route.distance)}`);
        clearTripCalculationTexts();
    } catch (error) {
        setResult(error.message);
        console.error(error);
    }
}