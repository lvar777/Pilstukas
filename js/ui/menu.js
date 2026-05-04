const panelWrap = document.getElementById("panelWrap");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const closePanelBtn = document.getElementById("closePanelBtn");
const themeBtn = document.getElementById("themeBtn");
const fuelToggleBtn = document.getElementById("fuelToggleBtn");
const fuelExpand = document.getElementById("fuelExpand");
const loadingScreen = document.getElementById("loadingScreen");

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        if (themeBtn) themeBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        if (themeBtn) themeBtn.textContent = "🌙";
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (themeBtn) {
        themeBtn.textContent = isDark ? "☀️" : "🌙";
    }
}

function setupLoadingScreen() {
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add("hidden");
        }
    }, 3000);
}

export function openPanel() {
    panelWrap.classList.add("open");
    if (menuToggleBtn) {
        menuToggleBtn.classList.add("hidden");
    }
}

export function closePanel() {
    panelWrap.classList.remove("open");
    if (menuToggleBtn) {
        menuToggleBtn.classList.remove("hidden");
    }
}

export function setupMenu() {
    applySavedTheme();
    setupLoadingScreen();

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener("click", openPanel);
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener("click", closePanel);
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", toggleTheme);
    }

    if (fuelToggleBtn && fuelExpand) {
        fuelToggleBtn.addEventListener("click", () => {
            fuelExpand.classList.toggle("open");
        });
    }
}

const hudPanel = document.getElementById("hudPanel");
const hudContent = document.getElementById("hudPanelContent");

const buttons = document.querySelectorAll(".hud-btn");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        const text = btn.textContent.trim();

        if (text === "Kuras") {
            openFuelMenu();
        }

        if (text === "Degalinės") {
            openStationMenu();
        }

        if (text === "Maršrutas") {
            toggleMainPanel();
        }

        if (text === "Lietuva") {
            centerToLithuania();
        }
    });
});

function openFuelMenu() {
    hudContent.innerHTML = `
        <div class="hud-title">Pasirink kurą</div>
        <div class="hud-grid">
            <button class="hud-chip">Benzinas 95</button>
            <button class="hud-chip">Benzinas 98</button>
            <button class="hud-chip">Dyzelinas</button>
            <button class="hud-chip">LPG</button>
        </div>
    `;
    hudPanel.classList.add("open");
}

function openStationMenu() {
    hudContent.innerHTML = `
        <div class="hud-title">Degalinės</div>
        <div class="hud-grid">
            <button class="hud-chip">Circle K</button>
            <button class="hud-chip">Viada</button>
            <button class="hud-chip">Baltic Petroleum</button>
            <button class="hud-chip">Neste</button>
            <button class="hud-chip">Orlen</button>
        </div>
    `;
    hudPanel.classList.add("open");
}

function toggleMainPanel() {
    const panel = document.getElementById("panelWrap");
    panel.classList.toggle("open");
    hudPanel.classList.remove("open");
}

function centerToLithuania() {
    if (state.map) {
        state.map.setView([55.1694, 23.8813], 7);
    }
}