import { useEffect, useState } from "react";
import { API_BASE_URL as API_URL } from "../lib/api";
import { exportExcel } from "../utils/exportExcel";
import ExcelExportButton from '../components/ExcelExportButton';

export default function ZoneManagement({ notify }) {
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