const panelWrap = document.getElementById("panelWrap");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const closePanelBtn = document.getElementById("closePanelBtn");

export function openPanel() {
    panelWrap.classList.add("open");
    menuToggleBtn.classList.add("hidden");
}

export function closePanel() {
    panelWrap.classList.remove("open");
    menuToggleBtn.classList.remove("hidden");
}

export function setupMenu() {
    menuToggleBtn.addEventListener("click", openPanel);
    closePanelBtn.addEventListener("click", closePanel);
}