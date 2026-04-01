export async function getRoute(start, end) {
    const coordinates = `${start.lon},${start.lat};${end.lon},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Nepavyko gauti marsruto");
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
        throw new Error("Marsrutas nerastas");
    }

    return data.routes[0];
}