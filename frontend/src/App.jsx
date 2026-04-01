import { useState, useCallback } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [routeGeo, setRouteGeo] = useState(null);
  const [pickMode, setPickMode] = useState(null);
  const [result, setResult] = useState(null);

  const handleMapClick = useCallback(
    (mode, point) => {
      if (mode === "from") setStart(point);
      else setEnd(point);
      setPickMode(null);
    },
    []
  );

  function handleRouteFound(route) {
    setRouteGeo(route.geometry);
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden" data-theme="light">
      <MapView
        start={start}
        end={end}
        routeGeo={routeGeo}
        pickMode={pickMode}
        onMapClick={handleMapClick}
      />
      <Sidebar
        start={start}
        end={end}
        pickMode={pickMode}
        onPickMode={setPickMode}
        onSetStart={setStart}
        onSetEnd={setEnd}
        onClearStart={() => { setStart(null); setRouteGeo(null); setResult(null); }}
        onClearEnd={() => { setEnd(null); setRouteGeo(null); setResult(null); }}
        onRouteFound={handleRouteFound}
        result={result}
        onResult={setResult}
      />
    </div>
  );
}
