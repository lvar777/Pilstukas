const resultEl = document.getElementById("result");
const mapHintEl = document.getElementById("mapHint");
const distanceResultEl = document.getElementById("distanceResult");
const fuelResultEl = document.getElementById("fuelResult");
const costResultEl = document.getElementById("costResult");

export function setResult(text) {
    resultEl.textContent = text;
}

export function setMapHint(text) {
    mapHintEl.textContent = text;
}

export function setDistanceResult(text) {
    distanceResultEl.textContent = text;
}

export function setFuelResult(text) {
    fuelResultEl.textContent = text;
}

export function setCostResult(text) {
    costResultEl.textContent = text;
}

export function clearTripCalculationTexts() {
    setFuelResult("");
    setCostResult("");
}