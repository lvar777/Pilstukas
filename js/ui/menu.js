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
    menuToggleBtn.classList.add("hidden");
}

export function closePanel() {
    panelWrap.classList.remove("open");
    menuToggleBtn.classList.remove("hidden");
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