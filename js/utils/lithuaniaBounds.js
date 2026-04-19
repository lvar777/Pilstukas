export const LITHUANIA_BOUNDS = {
    minLat: 53.89,
    maxLat: 56.45,
    minLon: 20.93,
    maxLon: 26.84
};

export const LITHUANIA_LEAFLET_BOUNDS = [
    [LITHUANIA_BOUNDS.minLat, LITHUANIA_BOUNDS.minLon],
    [LITHUANIA_BOUNDS.maxLat, LITHUANIA_BOUNDS.maxLon]
];

export function isPointInLithuania(lat, lon) {
    return (
        lat >= LITHUANIA_BOUNDS.minLat &&
        lat <= LITHUANIA_BOUNDS.maxLat &&
        lon >= LITHUANIA_BOUNDS.minLon &&
        lon <= LITHUANIA_BOUNDS.maxLon
    );
}

export function isLocationObjectInLithuania(location) {
    if (!location) {
        return false;
    }

    return isPointInLithuania(location.lat, location.lon);
}

export function filterStationsInLithuania(stations) {
    if (!Array.isArray(stations)) {
        return [];
    }

    return stations.filter((station) => isPointInLithuania(station.lat, station.lon));
}