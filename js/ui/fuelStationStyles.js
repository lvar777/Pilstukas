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
            border-radius: 18px;
            padding: 0;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid rgba(208, 215, 227, 0.9);
            box-shadow: 0 18px 44px rgba(20, 33, 61, 0.22);
        }

        .station-leaflet-popup .leaflet-popup-content {
            margin: 0;
            min-width: 300px;
        }

        .station-popup {
            position: relative;
            box-sizing: border-box;
            padding: 14px 16px 16px;
            color: #182033;
            font-family: inherit;
        }

        .station-popup-blue-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(180deg, #1874d1 0%, #2387e0 100%);
        }

        .station-popup-close {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 9px;
            background: rgba(238, 243, 255, 0.95);
            color: #31405f;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }

        .station-popup-close:hover {
            background: #e3ebff;
            color: #1f293d;
        }

        .station-popup-header {
            display: flex;
            align-items: flex-start;
            gap: 11px;
            padding-top: 5px;
            padding-right: 34px;
        }

        .station-popup-logo {
            width: 34px;
            height: 34px;
            flex: 0 0 34px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #dfe6f2;
            box-shadow: 0 6px 16px rgba(20, 33, 61, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .station-popup-logo-img {
            width: 76%;
            height: 76%;
            object-fit: contain;
        }

        .station-popup-logo-fallback {
            font-size: 18px;
        }

        .station-popup-title-wrap {
            min-width: 0;
        }

        .station-popup-title {
            font-size: 15px;
            font-weight: 800;
            color: #182033;
            line-height: 1.25;
            margin-bottom: 4px;
        }

        .station-popup-address {
            font-size: 13px;
            color: #5e677e;
            line-height: 1.35;
        }

        .station-popup-divider {
            height: 1px;
            background: #111827;
            opacity: 0.8;
            margin: 12px 0 10px;
        }

        .station-popup-prices {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .station-popup-price-head,
        .station-popup-price-row {
            display: grid;
            grid-template-columns: minmax(120px, 1fr) minmax(80px, auto);
            column-gap: 34px;
            align-items: center;
        }

        .station-popup-price-head {
            font-size: 13px;
            font-weight: 800;
            color: #243150;
        }

        .station-popup-price-row {
            font-size: 14px;
            color: #34415f;
        }

        .station-popup-fuel-price {
            text-align: right;
            font-weight: 700;
            color: #182033;
            white-space: nowrap;
        }

        .station-popup-empty {
            padding: 8px 0 2px;
            color: #6b768b;
            font-size: 13px;
        }

        body.dark .station-leaflet-popup .leaflet-popup-content-wrapper {
            background: rgba(16, 22, 34, 0.96);
            border-color: rgba(70, 88, 122, 0.72);
            box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
        }

        body.dark .station-popup {
            color: #eef2ff;
        }

        body.dark .station-popup-blue-line {
            background: linear-gradient(180deg, #102f63 0%, #14427f 100%);
        }

        body.dark .station-popup-close {
            background: #1d2840;
            color: #cbd8ff;
        }

        body.dark .station-popup-logo {
            background: #ffffff;
            border-color: #2c3b5d;
        }

        body.dark .station-popup-title,
        body.dark .station-popup-price-head,
        body.dark .station-popup-fuel-price {
            color: #eef2ff;
        }

        body.dark .station-popup-address,
        body.dark .station-popup-price-row {
            color: #c4cee8;
        }

        body.dark .station-popup-divider {
            background: #eef2ff;
            opacity: 0.35;
        }
    `;

    document.head.appendChild(style);
    stylesInjected = true;
}
