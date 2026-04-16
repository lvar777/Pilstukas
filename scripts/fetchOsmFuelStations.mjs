import fs from "node:fs/promises";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OUTPUT_JSON = "./data/fuelStationsFromOSM.json";
const OUTPUT_JS = "./js/services/fuelStationsData.js";

const QUERY = `
[out:json][timeout:180];
area["name"="Lietuva"]["boundary"="administrative"]->.lt;

(
  node["amenity"="fuel"]["brand"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);
  way["amenity"="fuel"]["brand"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);
  relation["amenity"="fuel"]["brand"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);

  node["amenity"="fuel"]["operator"~"^(Circle K|Viada|VIADA LT|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);
  way["amenity"="fuel"]["operator"~"^(Circle K|Viada|VIADA LT|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);
  relation["amenity"="fuel"]["operator"~"^(Circle K|Viada|VIADA LT|Baltic Petroleum|ORLEN|Orlen Lietuva)$", i](area.lt);

  node["amenity"="fuel"]["name"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)", i](area.lt);
  way["amenity"="fuel"]["name"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)", i](area.lt);
  relation["amenity"="fuel"]["name"~"^(Circle K|Viada|Baltic Petroleum|ORLEN|Orlen Lietuva)", i](area.lt);
);

out center tags;
`.trim();

function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeBrand(rawValue) {
    const raw = clean(rawValue);

    if (/circle\s*k/i.test(raw)) return "Circle K";
    if (/viada/i.test(raw)) return "Viada";
    if (/baltic\s*petroleum/i.test(raw)) return "Baltic Petroleum";
    if (/orlen/i.test(raw)) return "ORLEN";

    return "";
}

function pickBrand(tags) {
    return (
        normalizeBrand(tags.brand) ||
        normalizeBrand(tags.operator) ||
        normalizeBrand(tags.name)
    );
}

function pickCoords(element) {
    if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
        return { lat: element.lat, lon: element.lon };
    }

    if (
        element.center &&
        Number.isFinite(element.center.lat) &&
        Number.isFinite(element.center.lon)
    ) {
        return { lat: element.center.lat, lon: element.center.lon };
    }

    return { lat: null, lon: null };
}

function buildAddress(tags) {
    const street = clean(tags["addr:street"]);
    const house = clean(tags["addr:housenumber"]);
    const city = clean(
        tags["addr:city"] ||
        tags["addr:town"] ||
        tags["addr:village"] ||
        tags["addr:municipality"]
    );
    const postcode = clean(tags["addr:postcode"]);

    const line1 = [street, house].filter(Boolean).join(" ");
    return [line1, city, postcode].filter(Boolean).join(", ");
}

function pickCity(tags) {
    return clean(
        tags["addr:city"] ||
        tags["addr:town"] ||
        tags["addr:village"] ||
        tags["addr:municipality"]
    );
}

function pickName(tags, brand, address) {
    const explicitName = clean(tags.name);

    if (explicitName) {
        return explicitName;
    }

    if (address) {
        return `${brand} ${address}`;
    }

    return brand;
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function makeId(brand, name, lat, lon) {
    return slugify(`${brand}-${name}-${lat}-${lon}`);
}

function toFrontendModule(stations) {
    return `export function getFuelStations() {
    return ${JSON.stringify(stations, null, 4)};
}
`;
}

function dedupeStations(stations) {
    const seen = new Map();

    for (const station of stations) {
        const key = [
            station.brand,
            station.address,
            station.lat?.toFixed(6),
            station.lon?.toFixed(6)
        ].join("|");

        if (!seen.has(key)) {
            seen.set(key, station);
        }
    }

    return [...seen.values()];
}

async function fetchData() {
    const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            "User-Agent": "fuel-stations-project/1.0"
        },
        body: QUERY
    });

    if (!response.ok) {
        throw new Error(`Overpass klaida: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function main() {
    console.log("OSM uzklausa paleista...");

    const data = await fetchData();

    if (!Array.isArray(data.elements)) {
        throw new Error("Overpass negrazino elements masyvo");
    }

    let stations = data.elements
        .map((element) => {
            const tags = element.tags || {};
            const brand = pickBrand(tags);

            if (!brand) return null;

            const { lat, lon } = pickCoords(element);
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

            const address = buildAddress(tags);
            const city = pickCity(tags);
            const name = pickName(tags, brand, address);

            return {
                id: makeId(brand, name, lat, lon),
                brand,
                name,
                address,
                city,
                lat,
                lon,
                prices: {}
            };
        })
        .filter(Boolean);

    stations = dedupeStations(stations);

    stations = stations.filter((station) =>
        station.address &&
        station.address.length > 5
    );

    stations.sort((a, b) => {
        if (a.brand !== b.brand) {
            return a.brand.localeCompare(b.brand, "lt");
        }

        if (a.city !== b.city) {
            return a.city.localeCompare(b.city, "lt");
        }

        return a.name.localeCompare(b.name, "lt");
    });

    await fs.mkdir("./data", { recursive: true });
    await fs.mkdir("./js/services", { recursive: true });

    await fs.writeFile(OUTPUT_JSON, JSON.stringify(stations, null, 4), "utf8");
    await fs.writeFile(OUTPUT_JS, toFrontendModule(stations), "utf8");

    const summary = stations.reduce((acc, station) => {
        acc[station.brand] = (acc[station.brand] || 0) + 1;
        return acc;
    }, {});

    console.log("DONE");
    console.log("Sugeneruotas JSON:", OUTPUT_JSON);
    console.log("Sugeneruotas JS:", OUTPUT_JS);
    console.log("Suvestine:", summary);
    console.log("Is viso:", stations.length);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});