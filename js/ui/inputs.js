import { state } from "../state.js";
import { geocodeAddress } from "../services/geocoding.js";
import { calculateTrip } from "../services/fuel.js";
import { parseConsumptionValue } from "../utils/validate.js";
import { formatNumber } from "../utils/format.js";
import { setStartPoint, setEndPoint, clearStartMarker, clearEndMarker } from "../map/markers.js";
import { drawRouteIfPossible, clearRouteOnly } from "../map/routes.js";
import { updateHint } from "./hints.js";
import { setResult, setFuelResult, setCostResult, clearTripCalculationTexts } from "./results.js";

export function setupInputs() {
    const fromInput = document.getElementById("from");
    const toInput = document.getElementById("to");
    const fuelTypeSelect = document.getElementById("fuelType");
    const consumptionInput = document.getElementById("consumptionInput");
    const routeBtn = document.getElementById("routeBtn");
    const calcBtn = document.getElementById("calcBtn");
    const pickFromBtn = document.getElementById("pickFromBtn");
    const pickToBtn = document.getElementById("pickToBtn");
    const clearFromBtn = document.getElementById("clearFromBtn");
    const clearToBtn = document.getElementById("clearToBtn");

    function updateConsumptionState() {
        const fuelSelected = fuelTypeSelect.value !== "";

        consumptionInput.disabled = !fuelSelected;

        if (!fuelSelected) {
            consumptionInput.value = "";
            clearTripCalculationTexts();
        }
    }

    async function buildRouteFromInputs() {
        const fromValue = fromInput.value.trim();
        const toValue = toInput.value.trim();

        if (!fromValue || !toValue) {
            setResult("Uzpildyk abi vietas.");
            return;
        }

        setResult("Ieskoma vietu ir marsruto...");

        try {
            const start = await geocodeAddress(fromValue);
            const end = await geocodeAddress(toValue);

            setStartPoint(start.lat, start.lon);
            setEndPoint(end.lat, end.lon);

            state.selectedStart.name = start.name;
            state.selectedEnd.name = end.name;

            state.startMarker.bindPopup("Taskas A");
            state.endMarker.bindPopup("Taskas B");

            await drawRouteIfPossible(true);
        } catch (error) {
            setResult(error.message);
            console.error(error);
        }
    }

    pickFromBtn.addEventListener("click", () => {
        state.pickMode = "from";
        updateHint();
        setResult("Paspausk zemelapyje isvykimo taska.");
    });

    pickToBtn.addEventListener("click", () => {
        state.pickMode = "to";
        updateHint();
        setResult("Paspausk zemelapyje atvykimo taska.");
    });

    clearFromBtn.addEventListener("click", () => {
        clearStartMarker();
        clearRouteOnly();
        state.selectedStart = null;
        fromInput.value = "";

        if (!state.selectedEnd) {
            setResult("Ivesk dvi vietas arba pasirink taskus zemelapyje.");
        } else {
            setResult("Isvykimo taskas pasalintas.");
        }

        if (state.pickMode === "from") {
            state.pickMode = null;
            updateHint();
        }

        clearTripCalculationTexts();
    });

    clearToBtn.addEventListener("click", () => {
        clearEndMarker();
        clearRouteOnly();
        state.selectedEnd = null;
        toInput.value = "";

        if (!state.selectedStart) {
            setResult("Ivesk dvi vietas arba pasirink taskus zemelapyje.");
        } else {
            setResult("Atvykimo taskas pasalintas.");
        }

        if (state.pickMode === "to") {
            state.pickMode = null;
            updateHint();
        }

        clearTripCalculationTexts();
    });

    routeBtn.addEventListener("click", async () => {
        await buildRouteFromInputs();
    });

    calcBtn.addEventListener("click", () => {
        if (!state.currentRouteDistanceMeters) {
            setResult("Pirma pasirink taska A ir taska B.");
            clearTripCalculationTexts();
            return;
        }

        const selectedFuel = fuelTypeSelect.value;

        if (!selectedFuel) {
            setResult("Kuro tipas nepasirinktas. Rodomas tik atstumas.");
            clearTripCalculationTexts();
            return;
        }

        const parsedConsumption = parseConsumptionValue(consumptionInput.value);

        if (!parsedConsumption.valid) {
            if (parsedConsumption.reason === "empty") {
                setResult("Iveskite sanaudu kieki.");
            } else {
                setResult("Butina ivesti teisinga sanaudu kieki.");
            }

            clearTripCalculationTexts();
            return;
        }

        const result = calculateTrip(
            state.currentRouteDistanceMeters,
            parsedConsumption.value,
            selectedFuel
        );

        setResult("Keliones skaiciavimas atliktas.");
        setFuelResult(`Sunaudos: ${formatNumber(result.litersUsed)} l`);
        setCostResult(`Keliones kaina: ${formatNumber(result.tripCost)} €`);
    });

    fuelTypeSelect.addEventListener("change", () => {
        updateConsumptionState();

        if (fuelTypeSelect.value === "") {
            setResult("Kuro tipas nepasirinktas. Rodomas tik atstumas.");
        } else {
            setResult("Ivesk sanaudas ir spausk Skaiciuoti.");
        }
    });

    consumptionInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            calcBtn.click();
        }
    });

    toInput.addEventListener("keydown", async function(event) {
        if (event.key === "Enter") {
            await buildRouteFromInputs();
        }
    });

    fromInput.addEventListener("keydown", async function(event) {
        if (event.key === "Enter") {
            await buildRouteFromInputs();
        }
    });

    updateConsumptionState();
}