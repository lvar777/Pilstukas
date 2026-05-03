import io
import re
import sys
import requests
import pandas as pd
from bs4 import BeautifulSoup

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "lt,en-US;q=0.9,en;q=0.8",
}

ENA_URL = "https://www.ena.lt/degalu-kainos-degalinese/"


def find_latest_sharepoint_link() -> str:
    r = requests.get(ENA_URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    match = re.search(r'(https://[^\s"\'<>]*sharepoint\.com[^\s"\'<>]*:x:[^\s"\'<>]+)', r.text)
    if match:
        return match.group(1)
    raise RuntimeError("Could not find SharePoint Excel link on ena.lt")


def download_excel(share_url: str) -> bytes:
    session = requests.Session()
    session.headers.update(HEADERS)

    r = session.get(share_url, timeout=30, allow_redirects=True)
    r.raise_for_status()

    guid_match = re.search(r"sourcedoc=%7B([^%]+)%7D", r.url, re.IGNORECASE)
    if not guid_match:
        raise RuntimeError(f"Could not find document GUID in redirect URL: {r.url}")
    guid = guid_match.group(1)

    site_match = re.match(r"(https://[^/]+/[^?]+)/_layouts", r.url)
    site_base  = site_match.group(1) if site_match else "https://ltenergagen.sharepoint.com/sites/intra/doc"

    dl_url = f"{site_base}/_layouts/15/download.aspx?UniqueId={guid}"
    r2 = session.get(dl_url, timeout=60, allow_redirects=True)
    r2.raise_for_status()
    return r2.content


def parse_excel(excel_bytes: bytes) -> dict:
    xls = pd.ExcelFile(io.BytesIO(excel_bytes), engine="openpyxl")
    print(f"Sheets: {xls.sheet_names}\n")
    results = {}
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet, header=None)
        results[sheet] = df
        print(f"=== {sheet} ===")
        print(df.to_string(index=False))
        print()
        safe = re.sub(r"[^\w]", "_", sheet)
        out  = f"fuel_{safe}.csv"
        df.to_csv(out, index=False, encoding="utf-8-sig")
        print(f"Saved: {out}\n")
    return results


if __name__ == "__main__":
    print("1. Finding latest SharePoint link on ena.lt...")
    share_url = find_latest_sharepoint_link()
    print(f"   {share_url}\n")

    print("2. Downloading Excel (anonymous session)...")
    data = download_excel(share_url)
    print(f"   {len(data):,} bytes, magic: {data[:4]}\n")

    if data[:2] != b"PK":
        with open("fuel_debug.bin", "wb") as f:
            f.write(data)
        print("ERROR: not a valid xlsx. Raw bytes saved to fuel_debug.bin")
        sys.exit(1)

    print("3. Parsing Excel...\n")
    parse_excel(data)
