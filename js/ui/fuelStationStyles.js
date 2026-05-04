let stylesInjected = false;

export function ensureFuelStationStyles() {
    if (stylesInjected) return;

    const style = document.createElement("style");
    style.textContent = `
        .fuel-station-icon-wrapper {
            background: transparent;
            border: none;
        }

        .fuel-logo-marker {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #ffffff;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .fuel-logo-marker img {
            width: 75%;
            height: 75%;
            object-fit: contain;
        }

        .station-leaflet-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            padding: 0;
            overflow: hidden;
        }

        .station-leaflet-popup .leaflet-popup-content {
            margin: 0;
            min-width: 260px;
        }
    `;

    document.head.appendChild(style);
    stylesInjected = true;
}