import { formatNumber } from "../utils/format.js";

function getFuelLabel(fuelKey) {
    if (fuelKey === "diesel") {
        return "Dyzelinas";
    }

    if (fuelKey === "petrol95") {
        return "Benzinas 95";
    }

    if (fuelKey === "petrol98") {
        return "Benzinas 98";
    }

    if (fuelKey === "lpg") {
        return "LPG";
    }

    return fuelKey;
}

function buildPriceRows(prices) {
    const entries = Object.entries(prices || {});

    if (!entries.length) {
        return `
            <tr>
                <td colspan="2" class="station-popup-empty">Kainu nera</td>
            </tr>
        `;
    }

    return entries.map(([fuelKey, price]) => {
        return `
            <tr>
                <td>${getFuelLabel(fuelKey)}</td>
                <td>${formatNumber(price)} €</td>
            </tr>
        `;
    }).join("");
}

export function buildStationPopup(station) {
    return `
        <div class="station-popup" data-station-id="${station.id}">
            <div class="station-popup-header">
                <div class="station-popup-title-wrap">
                    <div class="station-popup-title">${station.name}</div>
                    <div class="station-popup-address">${station.address}</div>
                </div>
                <button
                    type="button"
                    class="station-popup-close"
                    data-popup-close="true"
                    aria-label="Uzdaryti degalines langa"
                    title="Uzdaryti"
                >×</button>
            </div>

            <table class="station-popup-table">
                <thead>
                    <tr>
                        <th>Kuras</th>
                        <th>Kaina</th>
                    </tr>
                </thead>
                <tbody>
                    ${buildPriceRows(station.prices)}
                </tbody>
            </table>
        </div>
    `;
}