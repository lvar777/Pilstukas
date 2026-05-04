export function openModal(id) {
    const overlay = document.getElementById("modal-overlay");
    const modal = document.getElementById(id);

    if (!overlay || !modal) {
        return;
    }

    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");
}

export function closeModals() {
    const overlay = document.getElementById("modal-overlay");

    if (overlay) {
        overlay.classList.add("hidden");
    }

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.classList.add("hidden");
    });
}

export function initModals() {
    const overlay = document.getElementById("modal-overlay");

    if (overlay) {
        overlay.addEventListener("click", closeModals);
    }

    document.querySelectorAll("[data-close='true']").forEach((button) => {
        button.addEventListener("click", closeModals);
    });
}