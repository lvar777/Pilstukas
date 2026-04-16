export async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;

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

    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name
    };
}

export async function reverseGeocode(lat, lon) {
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