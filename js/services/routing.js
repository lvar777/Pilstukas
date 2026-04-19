export async function getRoute(points) {
    if (!Array.isArray(points) || points.length < 2) {
        throw new Error("Maršrutui reikia bent dviejų taškų");
    }

    const coordinates = points
        .map((point) => `${point.lon},${point.lat}`)
        .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Nepavyko gauti maršruto");
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
        throw new Error("Maršrutas nerastas");
    }

    return data.routes[0];
}