import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const OUTPUT_FILE = "./js/services/fuelStationsData.js";

function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function extractCity(address = "") {
    const knownCities = [
        "Vilnius",
        "Kaunas",
        "Klaipėda",
        "Panevėžys",
        "Šiauliai",
        "Alytus",
        "Marijampolė",
        "Mažeikiai",
        "Jonava",
        "Utena",
        "Telšiai",
        "Tauragė",
        "Plungė",
        "Kretinga",
        "Palanga",
        "Biržai",
        "Rokiškis",
        "Jurbarkas",
        "Kėdainiai",
        "Ukmergė",
        "Elektrėnai",
        "Vilkaviškis",
        "Druskininkai",
        "Varėna",
        "Radviliškis",
        "Lazdijai",
        "Šilutė",
        "Šakiai",
        "Kupiškis",
        "Kuršėnai"
    ];

    const found = knownCities.find((city) =>
        address.toLowerCase().includes(city.toLowerCase())
    );

    return found || "";
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
        if (error.response?.status === 429) {
            console.warn(`429 rate limit: ${address}`);
            await sleep(2000);
            return { lat: null, lon: null };
        }

        console.warn(`Geocode failed: ${address}`);
        return { lat: null, lon: null };
    }
}

async function scrapeCircleK() {
    const url = "https://www.circlek.lt/stations";
    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        },
        timeout: 20000
    });

    const $ = cheerio.load(response.data);
    const stations = [];

    $("a").each((_, el) => {
        const text = $(el).text().trim();

        if (!text.startsWith("CIRCLE K ")) {
            return;
        }

        stations.push({
            brand: "Circle K",
            name: text,
            address: "",
            city: "",
            lat: null,
            lon: null,
            prices: {}
        });
    });

    return dedupeStations(stations);
}

async function scrapeViada() {
    const urls = [
        "https://www.viada.lt/degalines/informacija-apie-degalines/",
        "https://www.viada.lt/degalines/degaliniu-zemelapis/"
    ];

    const stations = [];

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 20000
            });

            const $ = cheerio.load(response.data);
            const text = $("body").text();

            const lines = text
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);

            for (const line of lines) {
                if (
                    line.length > 10 &&
                    /g\.|pr\.|al\.|kel\.|pl\.|gatv|gatve|g\./i.test(line)
                ) {
                    stations.push({
                        brand: "Viada",
                        name: `VIADA ${line.slice(0, 30)}`.trim(),
                        address: line,
                        city: extractCity(line),
                        lat: null,
                        lon: null,
                        prices: {}
                    });
                }
            }
        } catch (error) {
            console.warn(`Viada scrape failed for ${url}: ${error.message}`);
        }
    }

    return dedupeStations(stations);
}

async function scrapeBalticPetroleum() {
    const urls = [
        "https://balticpetroleum.lt/degalines",
        "https://balticpetroleum.lt/degalines/bp-degalines"
    ];

    const stations = [];

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 20000
            });

            const $ = cheerio.load(response.data);
            const text = $("body").text();

            const lines = text
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean);

            for (const line of lines) {
                if (
                    line.length > 10 &&
                    /g\.|pr\.|al\.|kel\.|pl\.|gatv|gatve|g\./i.test(line)
                ) {
                    stations.push({
                        brand: "Baltic Petroleum",
                        name: `Baltic Petroleum ${line.slice(0, 30)}`.trim(),
                        address: line,
                        city: extractCity(line),
                        lat: null,
                        lon: null,
                        prices: {}
                    });
                }
            }
        } catch (error) {
            console.warn(`Baltic scrape failed for ${url}: ${error.message}`);
        }
    }

    return dedupeStations(stations);
}

function dedupeStations(stations) {
    const map = new Map();

    for (const station of stations) {
        const key = `${station.brand}|${station.name}|${station.address}`.toLowerCase();

        if (!map.has(key)) {
            map.set(key, station);
        }
    }

    return [...map.values()];
}

async function enrichStations(stations) {
    const result = [];

    for (const station of stations) {
        let finalStation = { ...station };

        if (station.address) {
            const geocoded = await geocodeAddress(
                `${station.address}, Lietuva`
            );

            finalStation.lat = geocoded.lat;
            finalStation.lon = geocoded.lon;

            await sleep(1200);
        }

        finalStation.id = slugify(
            `${finalStation.brand}-${finalStation.name}-${finalStation.address}`
        );

        result.push(finalStation);
        console.log(`Prepared: ${finalStation.brand} | ${finalStation.name}`);
    }

    return result.filter((station) =>
        Number.isFinite(station.lat) && Number.isFinite(station.lon)
    );
}

function buildOutputModule(stations) {
    return `export function getFuelStations() {
    return ${JSON.stringify(stations, null, 4)};
}
`;
}

async function main() {
    let merged = [];
    let enriched = [];

    try {
        const [circleK, viada, baltic] = await Promise.all([
            scrapeCircleK(),
            scrapeViada(),
            scrapeBalticPetroleum()
        ]);

        merged = dedupeStations([
            ...circleK,
            ...viada,
            ...baltic
        ]);

        console.log(`Collected raw stations: ${merged.length}`);

        enriched = await enrichStations(merged);
    } catch (error) {
        console.error("Main process error:", error);
    }

    const output = buildOutputModule(enriched);

    await fs.writeFile(OUTPUT_FILE, output, "utf8");

    console.log(`Saved ${enriched.length} stations to ${OUTPUT_FILE}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});