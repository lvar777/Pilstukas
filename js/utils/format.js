export function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
}

export function formatNumber(value) {
    return value.toFixed(2);
}