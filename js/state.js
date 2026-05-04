const savedFuelStationsVisible = (() => {
    try {
        return localStorage.getItem("fuelStationsVisible") !== "false";
    } catch (error) {
        return true;
    }
})();

export const state = {
    map: null,
    startMarker: null,
    endMarker: null,
    waypointMarkers: [],
    routeLine: null,
    selectedStart: null,
    selectedEnd: null,
    selectedWaypoints: [],
    pickMode: null,
    currentRouteDistanceMeters: null,
    fuelStations: [],
    filteredFuelStations: [],
    fuelStationMarkers: [],
    fuelStationLayer: null,
    fuelStationsVisible: savedFuelStationsVisible
};