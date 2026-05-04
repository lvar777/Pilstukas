import { state } from "../state.js";
import { geocodeAddress } from "../services/geocoding.js";
import { calculateTrip } from "../services/fuel.js";
import { parseConsumptionValue } from "../utils/validate.js";
import { formatNumber } from "../utils/format.js";
import {
    setStartPoint,
    setEndPoint,
    clearStartMarker,
    clearEndMarker,
    renderWaypointMarkers,
    clearWaypointMarkers
} from "../map/markers.js";
import { drawRouteIfPossible, clearRouteOnly } from "../map/routes.js";
import { updateHint } from "./hints.js";
import { setResult, setFuelResult, setCostResult, clearTripCalculationTexts } from "./results.js";
import { MAX_WAYPOINTS } from "../config.js";

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
    const addStopBtn = document.getElementById("addStopBtn");
    const waypointContainer = document.getElementById("waypointContainer");
    const moveFromUpBtn = document.getElementById("moveFromUpBtn");
    const moveFromDownBtn = document.getElementById("moveFromDownBtn");
    const moveToUpBtn = document.getElementById("moveToUpBtn");
    const moveToDownBtn = document.getElementById("moveToDownBtn");


    let previewTimer = null;
    let previewRequestId = 0;

    function schedulePointPreview(message = "Taškai atnaujinti. Gali rodyti maršrutą.") {
        window.clearTimeout(previewTimer);

        previewTimer = window.setTimeout(async () => {
            const requestId = ++previewRequestId;

            const fromValue = fromInput.value.trim();
            const toValue = toInput.value.trim();
            const waypointValues = getWaypointInputs().map((input) => input.value.trim());

            try {
                let hasPreviewPoint = false;

                if (fromValue && fromValue !== "Ieškoma adreso...") {
                    const start = await geocodeAddress(fromValue);

                    if (requestId !== previewRequestId) {
                        return;
                    }

                    setStartPoint(start.lat, start.lon, "Išvykimo taškas");
                    state.selectedStart.name = start.name;
                    hasPreviewPoint = true;
                }

                const waypoints = [];

                for (const waypointValue of waypointValues) {
                    if (!waypointValue || waypointValue === "Ieškoma adreso...") {
                        waypoints.push(null);
                        continue;
                    }

                    const waypoint = await geocodeAddress(waypointValue);

                    if (requestId !== previewRequestId) {
                        return;
                    }

                    waypoints.push(waypoint);
                    hasPreviewPoint = true;
                }

                state.selectedWaypoints = waypoints;
                renderWaypointMarkers(waypoints);

                if (toValue && toValue !== "Ieškoma adreso...") {
                    const end = await geocodeAddress(toValue);

                    if (requestId !== previewRequestId) {
                        return;
                    }

                    setEndPoint(end.lat, end.lon, "Atvykimo taškas");
                    state.selectedEnd.name = end.name;
                    hasPreviewPoint = true;
                }

                if (hasPreviewPoint) {
                    setResult(message);
                }
            } catch (error) {
                console.error(error);
            }
        }, 900);
    }

    function updateConsumptionState() {
        const fuelSelected = fuelTypeSelect.value !== "";

        consumptionInput.disabled = !fuelSelected;

        if (!fuelSelected) {
            consumptionInput.value = "";
            clearTripCalculationTexts();
        }
    }

    function resetRouteStateOnManualChange(message = "Maršruto tvarka pakeista. Iš naujo parodyk maršrutą.") {
        previewRequestId++;
        clearStartMarker();
        clearEndMarker();
        clearWaypointMarkers();
        clearRouteOnly();

        state.selectedStart = null;
        state.selectedEnd = null;
        state.selectedWaypoints = [];

        setResult(message);
    }

    function getWaypointInputs() {
        return Array.from(document.querySelectorAll(".waypoint-input"));
    }

    function getAllPointInputs() {
        return [fromInput, ...getWaypointInputs(), toInput];
    }

    function getWaypointValues() {
        return getWaypointInputs()
            .map((input) => input.value.trim())
            .filter((value) => value !== "");
    }

    function canMoveInput(input, direction) {
        const allInputs = getAllPointInputs();
        const index = allInputs.indexOf(input);
        const targetIndex = index + direction;

        return targetIndex >= 0 && targetIndex < allInputs.length;
    }

    function swapInputValues(firstInput, secondInput) {
        const tempValue = firstInput.value;
        firstInput.value = secondInput.value;
        secondInput.value = tempValue;
    }

    function moveInputValue(input, direction) {
        const allInputs = getAllPointInputs();
        const index = allInputs.indexOf(input);
        const targetIndex = index + direction;

        if (index === -1 || targetIndex < 0 || targetIndex >= allInputs.length) {
            return;
        }

        swapInputValues(allInputs[index], allInputs[targetIndex]);
        resetRouteStateOnManualChange();
        schedulePointPreview();
        updateMoveButtonsState();
    }

    function updateAddStopButtonState() {
        if (!addStopBtn) {
            return;
        }

        const waypointCount = getWaypointInputs().length;
        addStopBtn.disabled = waypointCount >= MAX_WAYPOINTS;
    }

    function updateMoveButtonsState() {
        if (moveFromUpBtn) {
            moveFromUpBtn.disabled = !canMoveInput(fromInput, -1);
        }

        if (moveFromDownBtn) {
            moveFromDownBtn.disabled = !canMoveInput(fromInput, 1);
        }

        if (moveToUpBtn) {
            moveToUpBtn.disabled = !canMoveInput(toInput, -1);
        }

        if (moveToDownBtn) {
            moveToDownBtn.disabled = !canMoveInput(toInput, 1);
        }

        getWaypointInputs().forEach((input) => {
            const block = input.closest(".waypoint-block");
            const upBtn = block.querySelector(".waypoint-up-btn");
            const downBtn = block.querySelector(".waypoint-down-btn");

            upBtn.disabled = !canMoveInput(input, -1);
            downBtn.disabled = !canMoveInput(input, 1);
        });
    }

    function attachInputKeyHandler(input) {
        input.addEventListener("keydown", async function(event) {
            if (event.key === "Enter") {
                await buildRouteFromInputs();
            }
        });

        input.addEventListener("input", () => {
            resetRouteStateOnManualChange("Maršruto duomenys pakeisti. Taškai bus atnaujinti žemėlapyje.");
            schedulePointPreview();
        });

        input.addEventListener("change", () => {
            resetRouteStateOnManualChange("Maršruto duomenys pakeisti. Taškai bus atnaujinti žemėlapyje.");
            schedulePointPreview();
        });
    }

    function refreshWaypointLabels() {
        const blocks = Array.from(document.querySelectorAll(".waypoint-block"));

        blocks.forEach((block, index) => {
            const label = block.querySelector(".section-label");
            const input = block.querySelector(".waypoint-input");
            const inputId = `waypoint-${index + 1}`;

            label.textContent = `Stotelė ${index + 1}`;
            label.setAttribute("for", inputId);
            input.id = inputId;
        });

        updateMoveButtonsState();
    }

    function createWaypointRow(value = "") {
        const waypointIndex = getWaypointInputs().length + 1;
        const block = document.createElement("div");
        block.className = "location-block waypoint-block";

        block.innerHTML = `
            <label class="section-label" for="waypoint-${waypointIndex}">Stotelė ${waypointIndex}</label>
            <div class="location-row stop-row">
                <button class="pick-btn waypoint-pick-btn" type="button" title="Pasirinkti stotelę žemėlapyje" aria-label="Pasirinkti stotelę žemėlapyje">📍</button>

                <input
                    type="text"
                    id="waypoint-${waypointIndex}"
                    class="waypoint-input"
                    placeholder="Įvesk tarpinę stotelę"
                    value="${value.replace(/"/g, "&quot;")}"
                >

                <button class="move-btn waypoint-up-btn" type="button" title="Perkelti aukštyn" aria-label="Perkelti aukštyn">↑</button>
                <button class="move-btn waypoint-down-btn" type="button" title="Perkelti žemyn" aria-label="Perkelti žemyn">↓</button>
                <button class="stop-remove-btn" type="button" title="Pašalinti stotelę" aria-label="Pašalinti stotelę">−</button>
            </div>
        `;

        const input = block.querySelector(".waypoint-input");
        const pickBtn = block.querySelector(".waypoint-pick-btn");
        const upBtn = block.querySelector(".waypoint-up-btn");
        const downBtn = block.querySelector(".waypoint-down-btn");
        const removeBtn = block.querySelector(".stop-remove-btn");

        attachInputKeyHandler(input);

        pickBtn.addEventListener("click", () => {
            state.pickMode = `waypoint:${input.id}`;
            updateHint();
            setResult("Paspausk žemėlapyje tarpinę stotelę.");
        });

        upBtn.addEventListener("click", () => {
            moveInputValue(input, -1);
        });

        downBtn.addEventListener("click", () => {
            moveInputValue(input, 1);
        });

        removeBtn.addEventListener("click", () => {
            block.remove();
            resetRouteStateOnManualChange("Stotelė pašalinta. Taškai atnaujinti žemėlapyje.");
            refreshWaypointLabels();
            updateAddStopButtonState();
            schedulePointPreview();
        });

        waypointContainer.appendChild(block);
        updateAddStopButtonState();
        refreshWaypointLabels();
    }

    async function buildRouteFromInputs() {
        const fromValue = fromInput.value.trim();
        const toValue = toInput.value.trim();
        const waypointValues = getWaypointValues();

        if (!fromValue || !toValue) {
            setResult("Užpildyk viršutinį ir apatinį taškus.");
            return;
        }

        setResult("Ieškoma vietų ir maršruto...");

        try {
            const start = await geocodeAddress(fromValue);
            const waypoints = [];

            for (const waypointValue of waypointValues) {
                const waypoint = await geocodeAddress(waypointValue);
                waypoints.push(waypoint);
            }

            const end = await geocodeAddress(toValue);

            setStartPoint(start.lat, start.lon);
            setEndPoint(end.lat, end.lon);

            state.selectedStart.name = start.name;
            state.selectedEnd.name = end.name;
            state.selectedWaypoints = waypoints;

            state.startMarker.bindPopup("Išvykimo taškas");
            state.endMarker.bindPopup("Atvykimo taškas");
            renderWaypointMarkers(waypoints);

            await drawRouteIfPossible(true);
        } catch (error) {
            setResult(error.message);
            console.error(error);
        }
    }

    pickFromBtn.addEventListener("click", () => {
        state.pickMode = "from";
        updateHint();
        setResult("Paspausk žemėlapyje viršutinį tašką.");
    });

    pickToBtn.addEventListener("click", () => {
        state.pickMode = "to";
        updateHint();
        setResult("Paspausk žemėlapyje apatinį tašką.");
    });

    clearFromBtn.addEventListener("click", () => {
        fromInput.value = "";
        resetRouteStateOnManualChange("Viršutinis taškas pašalintas.");

        if (state.pickMode === "from") {
            state.pickMode = null;
            updateHint();
        }
    });

    clearToBtn.addEventListener("click", () => {
        toInput.value = "";
        resetRouteStateOnManualChange("Apatinis taškas pašalintas.");

        if (state.pickMode === "to") {
            state.pickMode = null;
            updateHint();
        }
    });

    if (moveFromUpBtn) {
        moveFromUpBtn.addEventListener("click", () => {
            moveInputValue(fromInput, -1);
        });
    }

    if (moveFromDownBtn) {
        moveFromDownBtn.addEventListener("click", () => {
            moveInputValue(fromInput, 1);
        });
    }

    if (moveToUpBtn) {
        moveToUpBtn.addEventListener("click", () => {
            moveInputValue(toInput, -1);
        });
    }

    if (moveToDownBtn) {
        moveToDownBtn.addEventListener("click", () => {
            moveInputValue(toInput, 1);
        });
    }

    if (addStopBtn && waypointContainer) {
        addStopBtn.addEventListener("click", () => {
            if (getWaypointInputs().length >= MAX_WAYPOINTS) {
                return;
            }

            createWaypointRow();
            setResult("Pridėta tarpinė stotelė.");
        });
    }

    routeBtn.addEventListener("click", async () => {
        await buildRouteFromInputs();
    });

    calcBtn.addEventListener("click", () => {
        if (!state.currentRouteDistanceMeters) {
            setResult("Pirma parodyk maršrutą.");
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
                setResult("Įveskite sąnaudų kiekį.");
            } else {
                setResult("Būtina įvesti teisingą sąnaudų kiekį.");
            }

            clearTripCalculationTexts();
            return;
        }

        const result = calculateTrip(
            state.currentRouteDistanceMeters,
            parsedConsumption.value,
            selectedFuel
        );

        setResult("Kelionės skaičiavimas atliktas.");
        setFuelResult(`Sąnaudos: ${formatNumber(result.litersUsed)} l`);
        setCostResult(`Kelionės kaina: ${formatNumber(result.tripCost)} €`);
    });

    fuelTypeSelect.addEventListener("change", () => {
        updateConsumptionState();

        if (fuelTypeSelect.value === "") {
            setResult("Kuro tipas nepasirinktas. Rodomas tik atstumas.");
        } else {
            setResult("Įvesk sąnaudas ir spausk Skaičiuoti.");
        }
    });

    consumptionInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            calcBtn.click();
        }
    });

    attachInputKeyHandler(fromInput);
    attachInputKeyHandler(toInput);

    updateConsumptionState();
    updateAddStopButtonState();
    updateMoveButtonsState();
}