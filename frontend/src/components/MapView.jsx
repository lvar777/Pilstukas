import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import { getStations, reverseGeocode } from "../services/api";

const LT_CENTER = [55.33, 23.9];
const LT_ZOOM = 8;

// Lithuania bounding box
const LT_BOUNDS = L.latLngBounds(
  [53.89, 20.93], // SW corner
  [56.45, 26.87], // NE corner
);

const markerA = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const markerB = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const stationIcon = new L.DivIcon({
  html: '<span style="font-size:18px">⛽</span>',
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapSetup() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(LT_BOUNDS.pad(0.1));
    map.setMinZoom(7);
    map.setMaxZoom(18);
  }, [map]);
  return null;
}

function ClickHandler({ pickMode, onMapClick }) {
  useMapEvents({
    async click(e) {
      if (!pickMode) return;
      const { lat, lng } = e.latlng;
      const result = await reverseGeocode(lat, lng);
      onMapClick(pickMode, { lat, lon: lng, name: result.display_name });
    },
  });
  return null;
}

export default function MapView({ start, end, routeGeo, pickMode, onMapClick }) {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    getStations().then((data) => {
      setStations(data.filter((s) => s.lat && s.lon));
    });
  }, []);

  return (
    <MapContainer
      center={LT_CENTER}
      zoom={LT_ZOOM}
      maxBounds={LT_BOUNDS.pad(0.1)}
      maxBoundsViscosity={1.0}
      minZoom={7}
      maxZoom={18}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <MapSetup />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      <ClickHandler pickMode={pickMode} onMapClick={onMapClick} />

      {start && (
        <Marker position={[start.lat, start.lon]} icon={markerA}>
          <Popup>{start.name}</Popup>
        </Marker>
      )}
      {end && (
        <Marker position={[end.lat, end.lon]} icon={markerB}>
          <Popup>{end.name}</Popup>
        </Marker>
      )}

      {routeGeo && (
        <GeoJSON
          key={JSON.stringify(routeGeo)}
          data={routeGeo}
          style={{ color: "#4f46e5", weight: 4, opacity: 0.8 }}
        />
      )}

      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lon]} icon={stationIcon}>
          <Popup>
            <strong>{s.name}</strong>
            <br />
            <span style={{ opacity: 0.7 }}>{s.address}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
