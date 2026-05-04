import { formatNumber } from "../utils/format.js";

function getLogoUrl(station) {
    const brand = (station.brand || station.name || station.operator || "").toLowerCase();

    if (brand.includes("circle")) return "assets/logos/cirklek.png";
    if (brand.includes("viada")) return "assets/logos/viada.png";
    if (brand.includes("baltic") || brand.includes("bp")) return "assets/logos/bp.png";
    if (brand.includes("neste")) return "assets/logos/neste.png";
    if (brand.includes("orlen")) return "assets/logos/orlen.png";

    return null;
}

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
            <div class="station-popup-empty">Kainų nėra</div>
        `;
    }

    return entries.map(([fuelKey, price]) => {
        return `
            <div class="station-popup-price-row">
                <span class="station-popup-fuel-type">${getFuelLabel(fuelKey)}</span>
                <span class="station-popup-fuel-price">${formatNumber(price)} €</span>
            </div>
        `;
    }).join("");
}

export function buildStationPopup(station) {
    const logoUrl = getLogoUrl(station);
    const logoMarkup = logoUrl
        ? `<img src="${logoUrl}" alt="" class="station-popup-logo-img">`
        : `<span class="station-popup-logo-fallback">⛽</span>`;

    return `
        <div class="station-popup" data-station-id="${station.id}">
            <div class="station-popup-blue-line"></div>

            <button
                type="button"
                class="station-popup-close"
                data-popup-close="true"
                aria-label="Uždaryti degalinės langą"
                title="Uždaryti"
            >×</button>

            <div class="station-popup-header">
                <div class="station-popup-logo">
                    ${logoMarkup}
                </div>

                <div class="station-popup-title-wrap">
                    <div class="station-popup-title">${station.name}</div>
                    <div class="station-popup-address">${station.address}</div>
                </div>
            </div>

            <div class="station-popup-divider"></div>

            <div class="station-popup-prices">
                <div class="station-popup-price-head">
                    <span>Kuras</span>
                    <span>Kaina</span>
                </div>

                ${buildPriceRows(station.prices)}
            </div>
        </div>
    `;
}
