import { initMap } from "./map/initMap.js";
import { setupMenu } from "./ui/menu.js";
import { setupInputs } from "./ui/inputs.js";
import { setupMapEvents } from "./map/mapEvents.js";
import { updateHint } from "./ui/hints.js";
import { initFuelStations } from "./fuelStations.js";
import { renderFuelStationMarkers, setFuelStationsVisible } from "./map/stationMarkers.js";
import { state } from "./state.js";
import { openModal, initModals } from "./ui/modal.js";

let kainosChart = null;

function startApp() {
    initMap();
    initFuelStations();
    setupMenu();
    setupInputs();
    setupMapEvents();
    updateHint();
    initModals();
    syncFiltersPosition();
    window.addEventListener("resize", syncFiltersPosition);
    setupTopButtons();
    setupPanelButtons();
    setupStationFilters();
    setupStationsToggle();

    const badge = document.getElementById("stationsCountBadge");

    if (badge) {
        badge.textContent = state.fuelStations.length;
    }
}

function setupTopButtons() {
    const btnKainos = document.getElementById("navPricesBtn");
    const btnTinklai = document.getElementById("navBrandsBtn");

    if (btnKainos) {
        btnKainos.addEventListener("click", function() {
            openModal("kainos-modal");
            loadChart();

            const select = document.getElementById("kainosFuelSelect");

            if (select) {
                select.onchange = loadChart;
            }
        });
    }

    if (btnTinklai) {
        btnTinklai.addEventListener("click", function() {
            openModal("tinklai-modal");
            renderNetworks();

            const select = document.getElementById("tinklaiFuelSelect");

            if (select) {
                select.onchange = renderNetworks;
            }
        });
    }
}

function syncFiltersPosition() {
    const appHud = document.querySelector(".app-hud");
    const mainTopbar = document.querySelector(".topbar-main");

    if (!appHud || !mainTopbar) {
        return;
    }

    appHud.style.setProperty("--filters-top", `${mainTopbar.offsetHeight}px`);
}

function setupPanelButtons() {
    const panelWrap = document.getElementById("panelWrap");
    const closePanelBtn = document.getElementById("closePanelBtn");
    const navRouteBtn = document.getElementById("navRouteBtn");
    const navStationsBtn = document.getElementById("navStationsBtn");
    const stationsFiltersBar = document.getElementById("stationsFiltersBar");

    if (navRouteBtn && panelWrap) {
        navRouteBtn.addEventListener("click", function() {
            panelWrap.classList.toggle("open");
        });
    }

    if (closePanelBtn && panelWrap) {
        closePanelBtn.addEventListener("click", function() {
            panelWrap.classList.remove("open");
        });
    }

    if (navStationsBtn && stationsFiltersBar) {
        navStationsBtn.addEventListener("click", function() {
            stationsFiltersBar.classList.toggle("hidden-filters");
            stationsFiltersBar.classList.toggle("active");
            navStationsBtn.classList.toggle("active");
        });
    }
}

function setupStationsToggle() {
    const toggleStationsBtn = document.getElementById("toggleStationsBtn");

    if (!toggleStationsBtn) {
        return;
    }

    updateStationsToggleButton(toggleStationsBtn);

    toggleStationsBtn.addEventListener("click", function() {
        setFuelStationsVisible(!state.fuelStationsVisible);
        updateStationsToggleButton(toggleStationsBtn);
    });
}

function updateStationsToggleButton(button) {
    const isVisible = state.fuelStationsVisible;

    button.classList.toggle("is-off", !isVisible);
    button.setAttribute("aria-pressed", isVisible ? "true" : "false");
    button.setAttribute("title", isVisible ? "Slėpti degalines" : "Rodyti degalines");
    button.setAttribute("aria-label", isVisible ? "Slėpti degalines" : "Rodyti degalines");
}

function setupStationFilters() {
    const stationNameSearch = document.getElementById("stationNameSearch");
    const brandQuickFilter = document.getElementById("brandQuickFilter");
    const fuelQuickFilter = document.getElementById("fuelQuickFilter");

    if (stationNameSearch) {
        stationNameSearch.addEventListener("input", applyStationFilters);
    }

    if (brandQuickFilter) {
        brandQuickFilter.addEventListener("change", applyStationFilters);
    }

    if (fuelQuickFilter) {
        fuelQuickFilter.addEventListener("change", applyStationFilters);
    }
}

function applyStationFilters() {
    const stationNameSearch = document.getElementById("stationNameSearch");
    const brandQuickFilter = document.getElementById("brandQuickFilter");
    const fuelQuickFilter = document.getElementById("fuelQuickFilter");
    const stationsCountBadge = document.getElementById("stationsCountBadge");

    const nameQuery = stationNameSearch ? stationNameSearch.value.trim().toLowerCase() : "";
    const brand = brandQuickFilter ? brandQuickFilter.value : "";
    const fuel = fuelQuickFilter ? fuelQuickFilter.value : "";

    const filtered = state.fuelStations.filter((station) => {
        const matchesName = !nameQuery ||
            (station.name && station.name.toLowerCase().includes(nameQuery)) ||
            (station.brand && station.brand.toLowerCase().includes(nameQuery)) ||
            (station.address && station.address.toLowerCase().includes(nameQuery)) ||
            (station.city && station.city.toLowerCase().includes(nameQuery));

        const stationBrand = station.brand ? station.brand.toLowerCase().replace(/\s+/g, "") : "";
        const matchesBrand = !brand || stationBrand === brand.toLowerCase();

        const matchesFuel = !fuel || (
            station.prices &&
            station.prices[fuel] !== undefined &&
            station.prices[fuel] !== null
        );

        return matchesName && matchesBrand && matchesFuel;
    });

    renderFuelStationMarkers(filtered);

    if (stationsCountBadge) {
        stationsCountBadge.textContent = filtered.length;
    }
}

function getFuelLabel(fuel) {
    if (fuel === "diesel") return "Dyzelinas";
    if (fuel === "petrol95") return "Benzinas 95";
    if (fuel === "petrol98") return "Benzinas 98";
    if (fuel === "lpg") return "LPG";

    return "Kuras";
}

function getBrandLogo(brand) {
    const value = brand.toLowerCase();

    if (value.includes("circle")) return "assets/logos/cirklek.png";
    if (value.includes("viada")) return "assets/logos/viada.png";
    if (value.includes("neste")) return "assets/logos/neste.png";
    if (value.includes("orlen")) return "assets/logos/orlen.png";
    if (value.includes("baltic")) return "assets/logos/bp.png";

    return "";
}

function getAveragePricesByBrand(fuel) {
    const brands = [];

    state.fuelStations.forEach((station) => {
        if (!station.brand || !station.prices) {
            return;
        }

        const price = Number(station.prices[fuel]);

        if (!price || Number.isNaN(price)) {
            return;
        }

        let existingBrand = null;

        for (let i = 0; i < brands.length; i++) {
            if (brands[i].name.toLowerCase() === station.brand.toLowerCase()) {
                existingBrand = brands[i];
                break;
            }
        }

        if (!existingBrand) {
            existingBrand = {
                name: station.brand,
                total: 0,
                count: 0,
                average: 0
            };

            brands.push(existingBrand);
        }

        existingBrand.total += price;
        existingBrand.count++;
    });

    brands.forEach((brand) => {
        brand.average = brand.total / brand.count;
    });

    brands.sort((a, b) => a.average - b.average);

    return brands;
}

function loadChart() {
    const ctx = document.getElementById("kainos-chart");
    const select = document.getElementById("kainosFuelSelect");

    if (!ctx || typeof Chart === "undefined") {
        return;
    }

    const selectedFuel = select ? select.value : "diesel";
    const brands = getAveragePricesByBrand(selectedFuel);

    if (kainosChart) {
        kainosChart.destroy();
    }

    kainosChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: brands.map((brand) => brand.name),
            datasets: [{
                label: getFuelLabel(selectedFuel) + " vidutinė kaina €/l",
                data: brands.map((brand) => Number(brand.average.toFixed(3)))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function renderNetworks() {
    const container = document.getElementById("tinklai-list");
    const select = document.getElementById("tinklaiFuelSelect");

    if (!container) {
        return;
    }

    const selectedFuel = select ? select.value : "diesel";
    const brands = getAveragePricesByBrand(selectedFuel);

    if (brands.length === 0) {
        container.innerHTML = "<p>Šiam kuro tipui kainų nėra.</p>";
        return;
    }

    let html = "";

    brands.forEach((brand) => {
        const logo = getBrandLogo(brand.name);

        html += `
            <div class="network-card">
                ${logo ? `<img src="${logo}" alt="">` : `<div class="network-logo-placeholder">⛽</div>`}
                <div>
                    <h3>${brand.name}</h3>
                    <p>${getFuelLabel(selectedFuel)}: ${brand.average.toFixed(3)} €/l</p>
                    <p>Degalinių kiekis: ${brand.count}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

startApp();