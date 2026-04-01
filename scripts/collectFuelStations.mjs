import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const RAW_OUTPUT_FILE = "./data/fuelStationsRaw.json";
console.log("SCRIPT STARTED");

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
        "Kuršėnai",
        "Kelmė"
    ];

    const found = knownCities.find((city) =>
        address.toLowerCase().includes(city.toLowerCase())
    );

    return found || "";
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
            id: slugify(`circle-k-${text}`),
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
                    const address = line;
                    const city = extractCity(address);

                    stations.push({
                        id: slugify(`viada-${address}`),
                        brand: "Viada",
                        name: city ? `VIADA ${city}` : `VIADA ${address.slice(0, 30)}`,
                        address,
                        city,
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
                    const address = line;
                    const city = extractCity(address);

                    stations.push({
                        id: slugify(`baltic-petroleum-${address}`),
                        brand: "Baltic Petroleum",
                        name: city ? `Baltic Petroleum ${city}` : `Baltic Petroleum ${address.slice(0, 30)}`,
                        address,
                        city,
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

async function main() {
    console.log("MAIN START");

    console.log("Scraping Circle K...");
    const circleK = await scrapeCircleK();
    console.log("Circle K done:", circleK.length);

    console.log("Scraping Viada...");
    const viada = await scrapeViada();
    console.log("Viada done:", viada.length);

    console.log("Scraping Baltic Petroleum...");
    const baltic = await scrapeBalticPetroleum();
    console.log("Baltic done:", baltic.length);

    const merged = dedupeStations([
        ...circleK,
        ...viada,
        ...baltic
    ]);

    console.log("Merged total:", merged.length);

    await fs.mkdir("./data", { recursive: true });
    console.log("Data folder ensured");

    await fs.writeFile(RAW_OUTPUT_FILE, JSON.stringify(merged, null, 4), "utf8");
    console.log(`Saved raw stations: ${merged.length}`);
    console.log(`File: ${RAW_OUTPUT_FILE}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});