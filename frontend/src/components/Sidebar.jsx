import { useState } from "react";
import { forwardGeocode, getRoute, calculateFuel } from "../services/api";

const FUEL_OPTIONS = [
  { value: "", label: "Pasirinkite kuro tipą" },
  { value: "diesel", label: "Dyzelinas" },
  { value: "petrol98", label: "Benzinas 98" },
  { value: "petrol95", label: "Benzinas 95" },
  { value: "lpg", label: "LPG" },
];

export default function Sidebar({
  start,
  end,
  pickMode,
  onPickMode,
  onSetStart,
  onSetEnd,
  onClearStart,
  onClearEnd,
  onRouteFound,
  result,
  onResult,
}) {
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [consumption, setConsumption] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRoute() {
    setLoading(true);
    onResult(null);
    try {
      let s = start;
      let e = end;

      if (!s && fromText) {
        const res = await forwardGeocode(fromText);
        if (!res.length) { onResult({ message: "Išvykimo vieta nerasta." }); return; }
        s = { lat: res[0].lat, lon: res[0].lon, name: res[0].display_name };
        onSetStart(s);
      }
      if (!e && toText) {
        const res = await forwardGeocode(toText);
        if (!res.length) { onResult({ message: "Atvykimo vieta nerasta." }); return; }
        e = { lat: res[0].lat, lon: res[0].lon, name: res[0].display_name };
        onSetEnd(e);
      }
      if (!s || !e) { onResult({ message: "Įveskite dvi vietas." }); return; }

      const route = await getRoute(s, e);
      onRouteFound(route);
      onResult({ distance: route.distance });
    } catch {
      onResult({ message: "Klaida ieškant maršruto." });
    } finally {
      setLoading(false);
    }
  }

  async function handleCalc() {
    if (!result?.distance) { onResult({ ...result, message: "Pirma nustatykite maršrutą." }); return; }
    const cons = parseFloat(consumption.replace(",", "."));
    if (!cons || cons <= 0) { onResult({ ...result, message: "Įveskite teisingas sąnaudas." }); return; }
    if (!fuelType) { onResult({ ...result, message: "Pasirinkite kuro tipą." }); return; }

    try {
      const calc = await calculateFuel(result.distance, fuelType, cons);
      onResult({
        distance: result.distance,
        distanceKm: calc.distance_km,
        liters: calc.liters_used,
        cost: calc.trip_cost,
        pricePerLiter: calc.price_per_liter,
      });
    } catch {
      onResult({ ...result, message: "Klaida skaičiuojant." });
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className="fixed bottom-5 left-5 z-[1000] h-11 w-11 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open
            ? <path d="M18 6 6 18M6 6l12 12" />
            : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>
          }
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-[999] h-full w-80 bg-white/95 backdrop-blur-sm shadow-lg border-r border-gray-100 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-5 pt-6 overflow-y-auto">

          {/* Header */}
          <h1 className="text-base font-semibold text-gray-800 mb-5 tracking-tight">
            Kainos skaičiuoklė
          </h1>

          {/* Location inputs */}
          <div className="space-y-2 mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maršrutas</label>

            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">A</span>
              </div>
              <input
                type="text"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all placeholder:text-gray-400"
                placeholder="Išvykimo vieta"
                value={start ? start.name : fromText}
                onChange={(e) => setFromText(e.target.value)}
                readOnly={!!start}
              />
              <button
                className={`h-9 w-9 shrink-0 rounded-lg border text-xs font-medium transition-all ${
                  pickMode === "from"
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onPickMode(pickMode === "from" ? null : "from")}
                title="Pasirinkti žemėlapyje"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
              </button>
              {start && (
                <button
                  className="h-9 w-9 shrink-0 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => { onClearStart(); setFromText(""); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">B</span>
              </div>
              <input
                type="text"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all placeholder:text-gray-400"
                placeholder="Atvykimo vieta"
                value={end ? end.name : toText}
                onChange={(e) => setToText(e.target.value)}
                readOnly={!!end}
              />
              <button
                className={`h-9 w-9 shrink-0 rounded-lg border text-xs font-medium transition-all ${
                  pickMode === "to"
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => onPickMode(pickMode === "to" ? null : "to")}
                title="Pasirinkti žemėlapyje"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
              </button>
              {end && (
                <button
                  className="h-9 w-9 shrink-0 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                  onClick={() => { onClearEnd(); setToText(""); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            <button
              className="w-full h-9 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:bg-indigo-700 transition-colors disabled:opacity-50"
              onClick={handleRoute}
              disabled={loading}
            >
              {loading ? "Ieškoma..." : "Rodyti maršrutą"}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Fuel section */}
          <div className="space-y-2 mt-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kuro skaičiavimas</label>

            <select
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-400 transition-all text-gray-700"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              {FUEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              type="text"
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="Sąnaudos, L/100km"
              value={consumption}
              onChange={(e) => setConsumption(e.target.value)}
              disabled={!fuelType}
            />

            <button
              className="w-full h-9 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 active:bg-black transition-colors"
              onClick={handleCalc}
            >
              Skaičiuoti
            </button>
          </div>

          {/* Results */}
          <div className="mt-5">
            {result?.message && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{result.message}</p>
            )}

            {result?.distanceKm != null && (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Atstumas</span>
                  <span className="font-semibold text-gray-800">{result.distanceKm} km</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Sunaudota</span>
                  <span className="font-semibold text-gray-800">{result.liters} L</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">Kaina</span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-800">{result.cost} &euro;</span>
                    <span className="block text-xs text-gray-400">{result.pricePerLiter} &euro;/L</span>
                  </div>
                </div>
              </div>
            )}

            {!result && (
              <p className="text-sm text-gray-400 leading-relaxed">
                Įveskite dvi vietas arba pasirinkite taškus žemėlapyje.
              </p>
            )}
          </div>

          {/* Pick mode hint */}
          {pickMode && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs">
              Spauskite žemėlapyje, kad pasirinktumėte tašką {pickMode === "from" ? "A" : "B"}.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
