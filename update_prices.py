import io, re, sys, json, time, math, pathlib
import requests, pandas as pd

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT        = pathlib.Path(__file__).parent
STATIONS_JS = ROOT / "js" / "services" / "fuelStationsData.js"
CONFIG_JS   = ROOT / "js" / "config.js"

HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
}

BRAND_MAP = {
    "Baltic Petroleum":                    "Baltic Petroleum",
    "Circle K":                            "Circle K",
    "GM Circle K":                         "Circle K",
    "Plungės lagūna (Circle K)":           "Circle K",
    "S.Savicko įmonė (Circle K)":          "Circle K",
    "VVARFF (Circle K)":                   "Circle K",
    "Neste Lietuva":                       "Neste",
    "Orlen":                               "ORLEN",
    "Viada":                               "Viada",
    "Alauša":                              "Alauša",
    "Emsi":                                "Emsi",
    "Saurida":                             "Saurida",
    "Jozita":                              "Jozita",
    "Eniris":                              "Eniris",
    "Trevena":                             "Trevena",
    "Stateta":                             "Stateta",
    "Gelvybė":                             "Gelvybė",
    "Apsaga":                              "Apsaga",
    "Boost Petrol":                        "Boost Petrol",
    "Skulas":                              "Skulas",
    "Narjanta":                            "Narjanta",
    "Regusa":                              "Regusa",
    "Madalva":                             "Madalva",
    "Topgas":                              "Topgas",
    "S.Savicko įmonė":                     "S.Savicko įmonė",
    "Naftrus":                             "Naftrus",
    "Eu Verslas":                          "Eu Verslas",
    "Junasa":                              "Junasa",
    "Deliuvis":                            "Deliuvis",
    "Gazimpeksas":                         "Gazimpeksas",
    "Melkasta":                            "Melkasta",
    "RV":                                  "RV",
    "Tomega":                              "Tomega",
    "Degta":                               "Degta",
    "Borusta":                             "Borusta",
    "Bonsa":                               "Bonsa",
    "Propano ir butano dujų centras":      "Propano ir butano dujų centras",
    "Pakelės namai":                       "Pakelės namai",
    "Adukesta":                            "Adukesta",
    "A. Praškevičiaus IĮ":                 "A. Praškevičiaus IĮ",
    "Antivis":                             "Antivis",
    "Andopas":                             "Andopas",
    "Nostrada (RV Transport) ":            "RV",
    "Medelsta":                            "Medelsta",
    "Bemija":                              "Bemija",
    "DVS Topolis":                         "DVS Topolis",
    "Deguva":                              "Deguva",
    "Dujotena":                            "Dujotena",
    "Atsiauta":                            "Atsiauta",
    "Autograndas":                         "Autograndas",
    "Lašų ŽŪB":                            "Lašų ŽŪB",
    "Littaura":                            "Littaura",
    "Plovimo sistemos":                    "Plovimo sistemos",
    "Raimondo Balsio IĮ":                  "Raimondo Balsio IĮ",
    "Prie Luksto":                         "Prie Luksto",
    "Skaistčio ŽŪB":                       "Skaistčio ŽŪB",
    "Pynauja":                             "Pynauja",
    "Tumasa":                              "Tumasa",
    "Utentra":                             "Utentra",
    "Valdegra":                            "Valdegra",
    "Velseka":                             "Velseka",
    "Vildega":                             "Vildega",
    "Vimijula":                            "Vimijula",
    "Virši":                               "Virši",
    "Visvilas":                            "Visvilas",
    "Vlantana":                            "Vlantana",
    "Įmonė (Degalinių tinklas)":           "Kita",
    "Šventosios investicijos":             "Šventosios investicijos",
    "Žibalas":                             "Žibalas",
}

_WORD_TO_ABBR = [
    (r"\baplinkkelis\b", "aplinkl."),
    (r"\bprospektas\b",  "pr."),
    (r"\balėja\b",       "al."),
    (r"\bplentas\b",     "pl."),
    (r"\btakas\b",       "tak."),
    (r"\bkelias\b",      "kel."),
    (r"\bkl\b",          "kel."),
    (r"\bgatvė\b",       "g."),
    (r"\bskersgatvis\b", "skg."),
]
_STREET_ABBRS = r"g\.|pr\.|al\.|pl\.|skg\.|sk\.|kel\.|tak\.|aplinkl\."
_STREET_PAT   = re.compile(rf"{_STREET_ABBRS}\s*\d", re.IGNORECASE)


def _clean(s: str) -> str:
    s = s.lower().strip().replace("\xa0", " ")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\b\d{5}\b", "", s)
    for pat, abbr in _WORD_TO_ABBR:
        s = re.sub(pat, abbr, s)
    return s.strip()


def _street_key(s: str) -> str | None:
    m = re.search(rf"([\w\s\-\.]+?)\s+({_STREET_ABBRS})\s*(\d+\s*[\w/]*)", s)
    if m:
        return re.sub(r"[\s\.]+", "", m.group(1).strip()) + re.sub(r"\s+", "", m.group(3).strip())
    return None


def norm_addr(addr: str) -> str:
    if not isinstance(addr, str):
        return ""
    s = _clean(addr)
    v = re.sub(r"^[\w\s\-]+?\bk[.,]\s+", "", s)
    if v != s:
        key = _street_key(v)
        if key:
            return key
    return _street_key(s) or re.sub(r"[\s,\.]+", "", s)


def norm_no_suffix(addr: str) -> str:
    return re.sub(r"(\d+)[a-z]+$", r"\1", norm_addr(addr))


def find_sharepoint_url() -> str:
    r = requests.get("https://www.ena.lt/degalu-kainos-degalinese/",
                     headers=HTTP_HEADERS, timeout=30)
    r.raise_for_status()
    m = re.search(r"(https://[^\s\"'<>]*sharepoint\.com[^\s\"'<>]*:x:[^\s\"'<>]+)", r.text)
    if m:
        return m.group(1)
    raise RuntimeError("SharePoint link not found on ena.lt")


def download_excel(share_url: str) -> bytes:
    session = requests.Session()
    session.headers.update(HTTP_HEADERS)
    r = session.get(share_url, timeout=30, allow_redirects=True)
    r.raise_for_status()
    guid_m = re.search(r"sourcedoc=%7B([^%]+)%7D", r.url, re.IGNORECASE)
    if not guid_m:
        raise RuntimeError(f"No GUID in redirect URL: {r.url}")
    guid = guid_m.group(1)
    site_m = re.match(r"(https://[^/]+/[^?]+)/_layouts", r.url)
    site_base = site_m.group(1) if site_m else "https://ltenergagen.sharepoint.com/sites/intra/doc"
    r2 = session.get(f"{site_base}/_layouts/15/download.aspx?UniqueId={guid}",
                     timeout=60, allow_redirects=True)
    r2.raise_for_status()
    return r2.content


def load_excel(excel_bytes: bytes) -> pd.DataFrame:
    xls = pd.ExcelFile(io.BytesIO(excel_bytes), engine="openpyxl")
    df = pd.read_excel(xls, sheet_name=xls.sheet_names[0], skiprows=7, header=0)
    df.columns = ["date", "company", "municipality", "address", "petrol95", "diesel", "lpg"]
    df = df[df["company"].notna()].copy()

    def parse_price(v):
        try:
            f = float(v)
            return round(f, 4) if not math.isnan(f) else None
        except (TypeError, ValueError):
            return None

    for col in ("petrol95", "diesel", "lpg"):
        df[col] = df[col].apply(parse_price)

    df["brand"]       = df["company"].map(BRAND_MAP)
    df                = df[df["brand"].notna()].copy()
    df["addr_key"]    = df["address"].apply(norm_addr)
    df["addr_nosufx"] = df["address"].apply(norm_no_suffix)
    return df.reset_index(drop=True)


def load_js_stations() -> list[dict]:
    src = STATIONS_JS.read_text(encoding="utf-8")
    raw = src.split("return ")[1].rsplit(";", 1)[0].strip().rstrip(")")
    return json.loads(raw)


def match_excel_to_js(df: pd.DataFrame, js_stations: list[dict]) -> list[tuple]:
    js_exact    = {}
    js_nosuffix = {}
    js_by_brand = {}

    for s in js_stations:
        brand  = s["brand"]
        key    = norm_addr(s["address"])
        key_ns = norm_no_suffix(s["address"])
        js_exact.setdefault((brand, key), s)
        js_nosuffix.setdefault((brand, key_ns), s)
        js_by_brand.setdefault(brand, []).append((key, s))

    results     = []
    used_js_ids = set()

    def pick(station):
        sid = station["id"]
        if sid in used_js_ids:
            return None
        used_js_ids.add(sid)
        return station

    for _, row in df.iterrows():
        brand = row["brand"]
        ek    = row["addr_key"]
        ekns  = row["addr_nosufx"]

        js = js_exact.get((brand, ek))
        if js:
            js = pick(js)

        if not js:
            js = js_nosuffix.get((brand, ekns))
            if js:
                js = pick(js)

        if not js and brand in js_by_brand and len(ek) >= 5:
            for js_key, candidate in js_by_brand[brand]:
                shorter = ek if len(ek) <= len(js_key) else js_key
                longer  = js_key if len(ek) <= len(js_key) else ek
                if len(shorter) >= 5 and longer.startswith(shorter) and candidate["id"] not in used_js_ids:
                    js = pick(candidate)
                    break

        results.append((row, js))

    return results


def _muni_name(municipality: str) -> str:
    return re.sub(r"\b(r\.|m\.|sav\.)\b", "", municipality).strip(" .,")


def _geo_candidates(address: str, municipality: str) -> list[str]:
    a    = re.sub(r"[\xa0​]+", " ", address).strip()
    a    = re.sub(r"\s+", " ", a)
    muni = _muni_name(municipality) if municipality else ""

    candidates = []
    parts = [p.strip() for p in a.split(",") if p.strip()]

    if len(parts) >= 2:
        first, rest = parts[0], ", ".join(parts[1:])
        if not _STREET_PAT.search(first):
            village = re.sub(r"\s+k\.?$", "", first).strip()
            candidates.append(f"{rest}, {village}, Lithuania")
            candidates.append(f"{rest}, Lithuania")
        else:
            candidates.append(f"{a}, Lithuania")
        candidates.append(f"{a}, Lithuania")
    else:
        all_matches = list(re.finditer(rf"([\w\.]+)\s+({_STREET_ABBRS})\s*\d", a))
        if all_matches:
            last_m      = all_matches[-1]
            city_part   = a[:last_m.start()].strip()
            street_part = a[last_m.start():].strip()
            if city_part and not re.search(r"\d", city_part):
                candidates.append(f"{street_part}, {city_part}, Lithuania")
        candidates.append(f"{a}, Lithuania")

    if len(parts) >= 2:
        last = parts[-1].strip()
        if re.search(r"\bk\.?$", last) and _STREET_PAT.search(parts[0]):
            village = re.sub(r"\s+k\.?$", "", last).strip()
            candidates.append(f"{', '.join(parts[:-1])}, {village}, Lithuania")

    abbr_stripped = re.sub(r"\b[A-ZĄČĘĖĮŠŲŪŽ]\.\s+", "", a)
    if abbr_stripped != a:
        candidates.append(f"{abbr_stripped}, Lithuania")

    if muni:
        for c in list(candidates):
            if re.search(_STREET_ABBRS, c):
                base = c.rsplit(", Lithuania", 1)[0]
                candidates.append(f"{base}, {muni}, Lithuania")
        candidates.append(f"{muni}, Lithuania")

    return list(dict.fromkeys(candidates))


def geocode(address: str, municipality: str) -> tuple[float, float] | None:
    for query in _geo_candidates(address, municipality):
        time.sleep(1.1)
        try:
            r = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "lt"},
                headers={"User-Agent": "FuelPriceUpdater/1.0"},
                timeout=10,
            )
            if r.status_code == 429:
                time.sleep(10)
                continue
            r.raise_for_status()
            results = r.json()
            if results:
                return float(results[0]["lat"]), float(results[0]["lon"])
        except Exception as e:
            print(f"     geocode error for {query!r}: {e}")
    return None


def extract_city(address: str) -> str:
    if not isinstance(address, str):
        return ""
    parts = [p.strip() for p in address.split(",")]
    candidates = [
        p for p in parts
        if p and not re.fullmatch(r"\d+", p) and not _STREET_PAT.search(p)
    ]
    if candidates and _STREET_PAT.search(candidates[0]):
        candidates = candidates[1:]
    return candidates[-1] if candidates else (parts[-1] if parts else "")


def make_prices(row) -> dict:
    prices = {}
    for key in ("petrol95", "diesel", "lpg"):
        v = row[key]
        if v is not None and not (isinstance(v, float) and math.isnan(v)):
            prices[key] = v
    return prices


def make_station(row, lat: float, lon: float, city: str) -> dict:
    brand   = row["brand"]
    lat_s   = f"{lat:.7f}".rstrip("0").rstrip(".")
    lon_s   = f"{lon:.7f}".rstrip("0").rstrip(".")
    slug    = re.sub(r"[^a-z0-9]+", "-", brand.lower()).strip("-")
    return {
        "id":      f"{slug}-{slug}-{lat_s}-{lon_s}",
        "brand":   brand,
        "name":    brand,
        "address": row["address"],
        "city":    city,
        "lat":     round(lat, 7),
        "lon":     round(lon, 7),
        "prices":  make_prices(row),
    }


def write_stations_js(stations: list[dict]):
    body    = json.dumps(stations, ensure_ascii=False, indent=4)
    src     = STATIONS_JS.read_text(encoding="utf-8")
    new_src = re.sub(
        r"(export function getFuelStations\(\)\s*\{\s*return\s*)\[[\s\S]*?\](\s*;\s*\})",
        rf"\g<1>{body}\g<2>",
        src,
    )
    STATIONS_JS.write_text(new_src, encoding="utf-8")


def update_config_js(df: pd.DataFrame):
    def avg(col):
        vals = [v for v in df[col] if v is not None and not (isinstance(v, float) and math.isnan(v))]
        return round(sum(vals) / len(vals), 3) if vals else None

    avgs    = {k: avg(k) for k in ("petrol95", "diesel", "lpg")}
    src     = CONFIG_JS.read_text(encoding="utf-8")
    lines   = [f"    {k}: {v}" for k, v in avgs.items() if v is not None]
    new_src = re.sub(
        r"export const FUEL_PRICES\s*=\s*\{[^}]+\};",
        "export const FUEL_PRICES = {\n" + ",\n".join(lines) + "\n};",
        src, flags=re.DOTALL,
    )
    CONFIG_JS.write_text(new_src, encoding="utf-8")
    return avgs


if __name__ == "__main__":
    print("1. Finding SharePoint link...")
    share_url = find_sharepoint_url()
    print(f"   {share_url}\n")

    print("2. Downloading Excel...")
    excel_bytes = download_excel(share_url)
    print(f"   {len(excel_bytes):,} bytes\n")

    print("3. Parsing Excel...")
    df = load_excel(excel_bytes)
    print(f"   {len(df)} rows ({df.groupby('brand').size().to_dict()})\n")

    print("4. Loading existing JS stations...")
    js_stations = load_js_stations()
    print(f"   {len(js_stations)} existing stations\n")

    print("5. Matching Excel rows to JS stations...")
    pairs     = match_excel_to_js(df, js_stations)
    n_matched = sum(1 for _, js in pairs if js is not None)
    n_geocode = sum(1 for _, js in pairs if js is None)
    print(f"   Matched: {n_matched}  |  Need geocoding: {n_geocode}\n")

    print("6. Building station list (geocoding missing)...")
    new_stations = []
    geo_ok = geo_fail = 0

    for i, (row, js) in enumerate(pairs):
        if js is not None:
            station = dict(js)
            station["prices"] = make_prices(row)
            new_stations.append(station)
        else:
            addr   = re.sub(r"[\xa0​]+", " ", row["address"]).strip()
            coords = geocode(addr, row["municipality"])
            if coords:
                lat, lon = coords
                city     = extract_city(addr)
                new_stations.append(make_station(row, lat, lon, city))
                geo_ok += 1
                print(f"   [{i+1}/{len(pairs)}] geocoded: {addr!r} → ({lat:.4f}, {lon:.4f})")
            else:
                geo_fail += 1
                print(f"   [{i+1}/{len(pairs)}] FAILED:   {addr!r}")

    print(f"\n   Geocoded OK: {geo_ok}  |  Failed: {geo_fail}\n")

    print(f"7. Writing {len(new_stations)} stations to fuelStationsData.js...")
    write_stations_js(new_stations)

    print("8. Updating config.js averages...")
    avgs = update_config_js(df)
    for k, v in avgs.items():
        print(f"   {k}: {v}")

    print(f"\nDone. Total stations: {len(new_stations)}")
