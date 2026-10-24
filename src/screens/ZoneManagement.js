import { useEffect, useState } from "react";
import { API_BASE_URL as API_URL } from "../lib/api";
import { exportExcel } from "../utils/exportExcel";
import ExcelExportButton from '../components/ExcelExportButton';
import { MapContainer, Polygon, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function LegacyZoneManagement({ notify }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", city: "", baseFare: "", perKm: "", perMinute: "", surge: 1, isActive: true,
    lat: "", lng: "", radius: 2000
  });
  const [editingId, setEditingId] = useState(null);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/zones`);
      const data = await res.json();
      setZones(Array.isArray(data.zones) ? data.zones : Array.isArray(data) ? data : []);
    } catch (e) {
      notify?.("Zones load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const radius = Number(form.radius);
    const baseFare = Number(form.baseFare);
    const surge = Number(form.surge);
    if (!form.name.trim() || form.baseFare === "") return notify?.("Name & Base Fare required");
    if (form.lat === "" || form.lng === "") return notify?.("Lat & Lng required for Heatmap");
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return notify?.("Latitude must be between -90 and 90");
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return notify?.("Longitude must be between -180 and 180");
    if (!Number.isFinite(radius) || radius <= 0) return notify?.("Radius must be greater than 0 meters");
    if (!Number.isFinite(baseFare) || baseFare < 0) return notify?.("Base Fare must be a valid non-negative number");
    if (!Number.isFinite(surge) || surge < 0.01) return notify?.("Surge must be greater than 0");

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/api/zones/${editingId}` : `${API_URL}/api/zones`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          baseFare,
          perKm: Number(form.perKm || 0),
          perMinute: Number(form.perMinute || 0),
          surge,
          lat,
          lng,
          radius,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      notify?.(editingId ? "Zone Updated" : "Zone Created");
      setForm({ name: "", city: "Karachi", baseFare: "", perKm: "", perMinute: "", surge: 1, isActive: true, lat: "", lng: "", radius: 2000 });
      setEditingId(null);
      fetchZones();
    } catch (err) {
      notify?.(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this zone?")) return;
    try {
      const res = await fetch(`${API_URL}/api/zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      notify?.("Zone Deleted");
      fetchZones();
    } catch (err) {
      notify?.(err.message);
    }
  };

  const handleEdit = (z) => {
    setEditingId(z._id);
    setForm({
      name: z.name, city: z.city || "Karachi",
      baseFare: z.baseFare, perKm: z.perKm, perMinute: z.perMinute,
      surge: z.surge || 1, isActive: z.isActive !== false,
      lat: z.lat ?? "", lng: z.lng ?? "", radius: z.radius ?? 2000
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportExcel = () => {
    const formatted = zones.map(z => ({
      ZoneID: z._id,
      Name: z.name,
      City: z.city,
      BaseFare: z.baseFare,
      PerKM: z.perKm,
      PerMinute: z.perMinute,
      Surge: z.surge,
      IsActive: z.isActive !== false ? 'Active' : 'Disabled',
      Lat: z.lat,
      Lng: z.lng,
      RadiusMeters: z.radius,
      Actions: 'Edit / Delete',
    }));
    exportExcel(formatted, 'ZoneManagement');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <h2 className="text-white font-bold text-lg mb-4">{editingId ? "Edit Zone" : "Create New Zone"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Zone Name e.g DHA" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} />
          <input type="number" className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Base Fare" value={form.baseFare} onChange={e=>setForm({...form, baseFare:e.target.value})} />
          <input type="number" className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Per KM" value={form.perKm} onChange={e=>setForm({...form, perKm:e.target.value})} />
          <input type="number" className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Per Minute" value={form.perMinute} onChange={e=>setForm({...form, perMinute:e.target.value})} />
          <input type="number" step="0.1" className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Surge 1.0" value={form.surge} onChange={e=>setForm({...form, surge:e.target.value})} />
          
          <input type="number" step="0.0001" className="bg-black border border-yellow-500/30 rounded-xl p-3 text-white" placeholder="Lat e.g 24.8138" value={form.lat} onChange={e=>setForm({...form, lat:e.target.value})} />
          <input type="number" step="0.0001" className="bg-black border border-yellow-500/30 rounded-xl p-3 text-white" placeholder="Lng e.g 67.0483" value={form.lng} onChange={e=>setForm({...form, lng:e.target.value})} />
          <input type="number" className="bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="Radius 2000" value={form.radius} onChange={e=>setForm({...form, radius:e.target.value})} />

          <div className="col-span-2 md:col-span-3 flex gap-3">
            <button type="submit" className="bg-[#A7E92F] text-black font-bold px-6 py-3 rounded-xl">{editingId ? "Update Zone" : "Create Zone"}</button>
            {editingId && <button type="button" onClick={()=>{setEditingId(null); setForm({ name: "", city: "Karachi", baseFare: "", perKm: "", perMinute: "", surge: 1, isActive: true, lat: "", lng: "", radius: 2000 })}} className="bg-white/10 text-white px-6 py-3 rounded-xl">Cancel</button>}
          </div>
        </form>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className="text-white font-bold">All Zones ({zones.length})</h2>
          <div className="flex gap-2">
            <ExcelExportButton onClick={handleExportExcel} />
            <button onClick={fetchZones} className="text-sm bg-white/10 px-3 py-1.5 rounded-lg text-white">Refresh</button>
          </div>
        </div>
        {loading ? <p className="text-white/50">Loading...</p> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map(z => (
              <div key={z._id} className="bg-black border border-white/10 rounded-xl p-4">
                <div className="flex justify-between">
                  <h3 className="font-bold text-white">{z.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${z.isActive !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{z.isActive !== false ? 'Active' : 'Disabled'}</span>
                </div>
                <p className="text-white/50 text-sm mt-1">{z.city} • Base: Rs {z.baseFare} • KM: {z.perKm} • Surge: {z.surge}x</p>
                {z.lat != null && z.lng != null && <p className="text-yellow-400/60 text-xs mt-1">{z.lat}, {z.lng} • {z.radius}m</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>handleEdit(z)} className="flex-1 bg-white text-black text-sm font-bold py-2 rounded-lg">Edit</button>
                  <button onClick={()=>handleDelete(z._id)} className="flex-1 bg-red-500/20 text-red-400 text-sm font-bold py-2 rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {zones.length === 0 && !loading && <p className="text-white/50 text-center py-10">No zones yet</p>}
      </div>
    </div>
  );
}

const DEMAND_COLORS = { low: "#4caf50", medium: "#ffc107", high: "#ff0000" };
const DEFAULT_FORM = {
  name: "",
  city: "Karachi",
  demandLevel: "low",
  fareMultiplier: "1.0",
  color: DEMAND_COLORS.low,
  surgeEnabled: false,
  isActive: true,
};

function PolygonDrawEvents({ drawing, onPoint }) {
  useMapEvents({
    click(event) {
      if (drawing) onPoint([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

function getZonePoints(coordinates) {
  if (!Array.isArray(coordinates)) return [];
  const points = Array.isArray(coordinates[0]) ? coordinates[0] : coordinates;
  return points.flatMap((point) => {
    const latitude = Number(point?.latitude ?? point?.lat ?? point?.[0]);
    const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon ?? point?.[1]);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return [];
    return [[latitude, longitude]];
  });
}

export default function ZoneManagement({ notify }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(true);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState("");

  const fetchZones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/zones?includeInactive=true`, {
        headers: { "bypass-tunnel-reminder": "true" },
      });
      if (!response.ok) throw new Error(`Zones load failed (${response.status})`);
      const data = await response.json();
      setZones(Array.isArray(data.zones) ? data.zones : Array.isArray(data) ? data : []);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load zones");
      notify?.(loadError.message || "Zones load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchZones(); }, []);

  const cityOptions = [...new Set([
    "Shahdadkot",
    "Larkana",
    "Karachi",
    ...zones.map((zone) => zone.city).filter(Boolean),
  ])];

  const center = polygonPoints.length
    ? polygonPoints[0]
    : [24.8607, 67.0011];

  const clearPolygon = () => {
    setPolygonPoints([]);
    setMapKey((key) => key + 1);
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setPolygonPoints([]);
    setDrawing(true);
    setMapKey((key) => key + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return notify?.("Zone name is required");
    if (!form.city.trim()) return notify?.("City is required");
    if (polygonPoints.length < 3) return notify?.("Draw a polygon with at least three points");

    const fareMultiplier = Number(form.fareMultiplier);
    if (!Number.isFinite(fareMultiplier) || fareMultiplier < 1 || fareMultiplier > 2) {
      return notify?.("Fare multiplier must be between 1.0 and 2.0");
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `${API_URL}/api/zones/${editingId}` : `${API_URL}/api/zones`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "bypass-tunnel-reminder": "true",
          },
          body: JSON.stringify({
            ...form,
            name: form.name.trim(),
            city: form.city.trim(),
            fareMultiplier,
            coordinates: [polygonPoints.map(([latitude, longitude]) => ({ latitude, longitude }))],
          }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Zone save failed");
      notify?.(editingId ? "Zone updated" : "Zone created");
      resetForm();
      await fetchZones();
    } catch (saveError) {
      notify?.(saveError.message || "Zone save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (zone) => {
    setEditingId(zone._id);
    setForm({
      name: zone.name || "",
      city: zone.city || "Karachi",
      demandLevel: zone.demandLevel || "low",
      fareMultiplier: String(zone.fareMultiplier ?? 1),
      color: zone.color || DEMAND_COLORS[zone.demandLevel] || DEMAND_COLORS.low,
      surgeEnabled: zone.surgeEnabled === true,
      isActive: zone.isActive !== false,
    });
    setPolygonPoints(getZonePoints(zone.coordinates));
    setDrawing(false);
    setMapKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete "${zone.name}"?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/zones/${zone._id}`, {
        method: "DELETE",
        headers: { "bypass-tunnel-reminder": "true" },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Zone delete failed");
      notify?.("Zone deleted");
      await fetchZones();
      if (editingId === zone._id) resetForm();
    } catch (deleteError) {
      notify?.(deleteError.message || "Zone delete failed");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <section className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-white font-bold text-lg">{editingId ? "Edit Zone" : "Create Demand Zone"}</h2>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-white/70 bg-white/10 px-3 py-2 rounded-lg">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            <label className="text-white/70 text-sm">
              Zone Name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-1 w-full bg-black border border-white/10 rounded-xl p-3 text-white" placeholder="e.g. DHA Phase 6" />
            </label>
            <label className="text-white/70 text-sm">
              City
              <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}
                className="mt-1 w-full bg-black border border-white/10 rounded-xl p-3 text-white">
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <label className="text-white/70 text-sm">
              Demand Level
              <select value={form.demandLevel} onChange={(event) => setForm({
                ...form,
                demandLevel: event.target.value,
                color: form.color === DEMAND_COLORS[form.demandLevel] ? DEMAND_COLORS[event.target.value] : form.color,
              })} className="mt-1 w-full bg-black border border-white/10 rounded-xl p-3 text-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-white/70 text-sm">
              Fare Multiplier: {Number(form.fareMultiplier || 1).toFixed(1)}x
              <input type="range" min="1" max="2" step="0.1" value={form.fareMultiplier}
                onChange={(event) => setForm({ ...form, fareMultiplier: event.target.value })}
                className="mt-3 w-full accent-lime-400" />
              <input type="number" min="1" max="2" step="0.1" value={form.fareMultiplier}
                onChange={(event) => setForm({ ...form, fareMultiplier: event.target.value })}
                className="mt-2 w-full bg-black border border-white/10 rounded-xl p-3 text-white" />
            </label>
            <label className="text-white/70 text-sm flex items-center gap-3">
              Zone Color
              <input type="color" value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="h-10 w-16 bg-transparent border-0 cursor-pointer" />
            </label>
            <label className="text-white/70 text-sm flex items-center gap-3">
              Surge Enabled
              <input type="checkbox" checked={form.surgeEnabled}
                onChange={(event) => setForm({ ...form, surgeEnabled: event.target.checked })}
                className="h-5 w-5 accent-lime-400" />
            </label>
            <label className="text-white/70 text-sm flex items-center gap-3">
              Active Zone
              <input type="checkbox" checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="h-5 w-5 accent-lime-400" />
            </label>
            <div className="sm:col-span-2 flex gap-3 flex-wrap">
              <button type="button" onClick={() => setDrawing((value) => !value)}
                className="bg-white/10 text-white px-4 py-3 rounded-xl">
                {drawing ? "Stop Drawing" : "Draw / Add Points"}
              </button>
              <button type="button" onClick={clearPolygon}
                className="bg-white/10 text-white px-4 py-3 rounded-xl">Clear Polygon</button>
              <button type="submit" disabled={saving}
                className="bg-[#A7E92F] disabled:opacity-50 text-black font-bold px-6 py-3 rounded-xl">
                {saving ? "Saving..." : editingId ? "Update Zone" : "Save Zone"}
              </button>
            </div>
            <div className="sm:col-span-2 text-white/60 text-sm">
              {polygonPoints.length} polygon point{polygonPoints.length === 1 ? "" : "s"} — click the map to draw.
              {polygonPoints.length > 0 && (
                <ol className="mt-2 max-h-24 overflow-auto list-decimal list-inside">
                  {polygonPoints.map(([latitude, longitude], index) => (
                    <li key={`${latitude}-${longitude}-${index}`}>{latitude.toFixed(6)}, {longitude.toFixed(6)}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="min-h-[360px] h-[420px] overflow-hidden rounded-xl border border-white/10">
            <MapContainer key={mapKey} center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <PolygonDrawEvents drawing={drawing} onPoint={(point) => setPolygonPoints((points) => [...points, point])} />
              {polygonPoints.length > 0 && (
                <Polygon positions={polygonPoints} pathOptions={{
                  color: form.color,
                  fillColor: form.color,
                  fillOpacity: 0.3,
                  weight: 2,
                }} />
              )}
            </MapContainer>
          </div>
        </form>
      </section>

      <section className="bg-[#111] border border-white/10 rounded-2xl p-5">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="text-white font-bold">Zones ({zones.length})</h2>
          <button type="button" onClick={fetchZones} className="text-sm bg-white/10 px-3 py-2 rounded-lg text-white">
            Refresh
          </button>
        </div>
        {error && <p role="alert" className="text-red-400 mb-3">{error}</p>}
        {loading ? <p className="text-white/50">Loading zones...</p> : zones.length === 0 ? (
          <p className="text-white/50 text-center py-8">No zones yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-white/50 border-b border-white/10">
                <tr>
                  <th className="p-3">Zone</th><th className="p-3">City</th><th className="p-3">Demand</th>
                  <th className="p-3">Multiplier</th><th className="p-3">Surge</th><th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone._id} className="border-b border-white/5 text-white">
                    <td className="p-3"><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: zone.color || "#4caf50" }} />{zone.name}</td>
                    <td className="p-3">{zone.city}</td>
                    <td className="p-3 capitalize">{zone.demandLevel || "low"}</td>
                    <td className="p-3">{Number(zone.fareMultiplier || 1).toFixed(1)}x</td>
                    <td className="p-3">{zone.surgeEnabled ? "On" : "Off"}</td>
                    <td className="p-3">{zone.isActive === false ? "Inactive" : "Active"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleEdit(zone)} className="bg-white/10 px-3 py-1.5 rounded-lg">Edit</button>
                        <button type="button" onClick={() => handleDelete(zone)} className="bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}