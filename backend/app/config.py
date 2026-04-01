import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

NOMINATIM_BASE_URL = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")

FUEL_PRICES = {
    "diesel": float(os.getenv("FUEL_PRICE_DIESEL", 1.919)),
    "petrol98": float(os.getenv("FUEL_PRICE_PETROL_98", 1.746)),
    "petrol95": float(os.getenv("FUEL_PRICE_PETROL_95", 1.579)),
    "lpg": float(os.getenv("FUEL_PRICE_LPG", 0.779)),
}
