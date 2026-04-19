let stylesInjected = false;

export function ensureFuelStationStyles() {
    if (stylesInjected) {
        return;
    }

    const style = document.createElement("style");
    style.textContent = `
        .fuel-station-icon-wrapper {
            background: transparent;
            border: none;
        }

        .fuel-station-icon {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #1f2937;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }

        .fuel-station-icon-symbol {
            font-size: 16px;
            line-height: 1;
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

        .station-popup {
            padding: 12px;
            box-sizing: border-box;
        }

        .station-popup-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 10px;
        }

        .station-popup-title-wrap {
            flex: 1;
            min-width: 0;
        }

        .station-popup-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #111827;
        }

        .station-popup-address {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.35;
        }

        .station-popup-close {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 8px;
            background: #f3f4f6;
            color: #111827;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
            flex-shrink: 0;
        }

        .station-popup-close:hover {
            background: #e5e7eb;
        }

        .station-popup-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }

        .station-popup-table th,
        .station-popup-table td {
            padding: 8px 6px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }

        .station-popup-table th:last-child,
        .station-popup-table td:last-child {
            text-align: right;
        }

        .station-popup-table thead th {
            font-weight: 700;
            color: #111827;
        }

        .station-popup-empty {
            text-align: center;
            color: #6b7280;
        }
    `;

    document.head.appendChild(style);
    stylesInjected = true;
}