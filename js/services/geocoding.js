import { isPointInLithuania } from "../utils/lithuaniaBounds.js";

export async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=lt&q=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Nepavyko rasti adreso");
    }

    const data = await response.json();

    if (!data.length) {
        throw new Error(`Adresas nerastas: ${address}`);
    }

    const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name
    };

    if (!isPointInLithuania(result.lat, result.lon)) {
        throw new Error("Galima ieskoti tik adresu Lietuvoje.");
    }

    return result;
}

export async function reverseGeocode(lat, lon) {
    if (!isPointInLithuania(lat, lon)) {
        throw new Error("Adresas gali buti gaunamas tik Lietuvoje.");
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Nepavyko gauti adreso");
    }

    const data = await response.json();

    return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}