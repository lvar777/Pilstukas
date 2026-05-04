import { state } from "../state.js";

let lithuaniaMaskLayer = null;
let lithuaniaBorderLayer = null;

export async function addLithuaniaMask() {
    if (!state.map) {
        return;
    }

    const response = await fetch("./data/lithuania.geojson");
    const lithuaniaGeoJson = await response.json();

    if (lithuaniaMaskLayer) {
        state.map.removeLayer(lithuaniaMaskLayer);
        lithuaniaMaskLayer = null;
    }

    if (lithuaniaBorderLayer) {
        state.map.removeLayer(lithuaniaBorderLayer);
        lithuaniaBorderLayer = null;
    }

    const worldOuterRing = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
        [-90, -180]
    ];

    const feature = lithuaniaGeoJson.features[0];
    const geometry = feature.geometry;

    let innerRings = [];

    if (geometry.type === "Polygon") {
        innerRings = geometry.coordinates;
    } else if (geometry.type === "MultiPolygon") {
        innerRings = geometry.coordinates[0];
    } else {
        console.error("Nepalaikomas Lithuania GeoJSON tipas:", geometry.type);
        return;
    }

    const maskFeature = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [worldOuterRing, ...innerRings]
        }
    };

    lithuaniaMaskLayer = L.geoJSON(maskFeature, {
        style: {
            fillColor: "#dfe5ef",
            fillOpacity: 0.72,
            stroke: false
        },
        interactive: false
    }).addTo(state.map);

    lithuaniaBorderLayer = L.geoJSON(lithuaniaGeoJson, {
        style: {
            color: "#4a67ff",
            weight: 2,
            fill: false,
            opacity: 0.9
        },
        interactive: false
    }).addTo(state.map);
}