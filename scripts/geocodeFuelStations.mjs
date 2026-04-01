import fs from "node:fs/promises";
import axios from "axios";

const RAW_INPUT_FILE = "./data/fuelStationsRaw.json";
const GEOCODED_OUTPUT_FILE = "./data/fuelStationsGeocoded.json";
const FRONTEND_OUTPUT_FILE = "./js/services/fuelStationsData.js";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadJson(path) {
    try {
        const content = await fs.readFile(path, "utf8");
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

async function saveJson(path, data) {
    await fs.writeFile(path, JSON.stringify(data, null, 4), "utf8");
}

function buildFrontendModule(stations) {
    return `export function getFuelStations() {
    return ${JSON.stringify(stations, null, 4)};
}
`;
}

async function saveFrontendModule(stations) {
    const validStations = stations.filter((station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
    );

    const moduleCode = buildFrontendModule(validStations);
    await fs.writeFile(FRONTEND_OUTPUT_FILE, moduleCode, "utf8");
}

async function geocodeAddress(address) {
    if (!address) {
        return { lat: null, lon: null };
    }

    const url = "https://nominatim.openstreetmap.org/search";

    try {
        const response = await axios.get(url, {
            params: {
                format: "jsonv2",
                limit: 1,
                countrycodes: "lt",
                q: address
            },
            headers: {
                "User-Agent": "fuel-station-project/1.0"
            },
            timeout: 20000
        });

        const first = response.data?.[0];

        if (!first) {
            return { lat: null, lon: null };
        }

        return {
            lat: Number(first.lat),
            lon: Number(first.lon)
        };
    } catch (error) {
        const status = error.response?.status;

        if (status === 429) {
            console.warn(`429 rate limit: ${address}`);
            return { lat: null, lon: null, rateLimited: true };
        }

        console.warn(`Geocode failed: ${address}`);
        return { lat: null, lon: null };
    }
}

async function main() {
    const rawStations = await loadJson(RAW_INPUT_FILE);

    if (!rawStations || !Array.isArray(rawStations)) {
        throw new Error(`Raw station file not found: ${RAW_INPUT_FILE}`);
    }

    let stations = await loadJson(GEOCODED_OUTPUT_FILE);

    if (!stations || !Array.isArray(stations)) {
        stations = rawStations.map((station) => ({
            ...station,
            geocoded: false
        }));
    }

    let processedCount = 0;
    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < stations.length; i += 1) {
        const station = stations[i];

        if (station.geocoded && Number.isFinite(station.lat) && Number.isFinite(station.lon)) {
            skippedCount += 1;
            continue;
        }

        if (!station.address || !station.address.trim()) {
            station.geocoded = true;
            station.lat = null;
            station.lon = null;

            await saveJson(GEOCODED_OUTPUT_FILE, stations);
            await saveFrontendModule(stations);

            console.log(`Skipped without address: ${station.brand} | ${station.name}`);
            continue;
        }

        const query = `${station.address}, Lietuva`;
        console.log(`Geocoding ${i + 1}/${stations.length}: ${station.brand} | ${station.name}`);

        const geocoded = await geocodeAddress(query);

        if (geocoded.rateLimited) {
            await saveJson(GEOCODED_OUTPUT_FILE, stations);
            await saveFrontendModule(stations);

            console.log("Stopped because of rate limit. Run script again later.");
            break;
        }

        station.lat = geocoded.lat;
        station.lon = geocoded.lon;
        station.geocoded = true;

        processedCount += 1;

        if (Number.isFinite(station.lat) && Number.isFinite(station.lon)) {
            successCount += 1;
            console.log(`Saved coords: ${station.lat}, ${station.lon}`);
        } else {
            console.log("No coords found");
        }

        await saveJson(GEOCODED_OUTPUT_FILE, stations);
        await saveFrontendModule(stations);

        await sleep(2000);
    }

    console.log(`Processed this run: ${processedCount}`);
    console.log(`Success this run: ${successCount}`);
    console.log(`Already done before run: ${skippedCount}`);

    const totalReady = stations.filter((station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
    ).length;

    console.log(`Ready for frontend total: ${totalReady}`);
    console.log(`Geocoded cache file: ${GEOCODED_OUTPUT_FILE}`);
    console.log(`Frontend file: ${FRONTEND_OUTPUT_FILE}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});