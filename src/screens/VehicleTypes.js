import { useState, useEffect } from 'react';
const API_URL = 'http://localhost:3000';

export default function VehicleTypes() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ 
    displayName: '', 
    name: '', 
    capacity: '', 
    baseFare: '', 
    perKm: '', 
    perMinute: '', 
    commission: '', 
    city: '', 
    icon: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vehicle-types`);
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : data.vehicleTypes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      name: form.name || form.displayName.toLowerCase().replace(/\s+/g, '-'),
      capacity: Number(form.capacity),
      baseFare: Number(form.baseFare),
      perKm: Number(form.perKm),
      perMinute: Number(form.perMinute),
      commission: Number(form.commission)
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/api/vehicle-types/${editingId}` : `${API_URL}/api/vehicle-types`;
    
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });

    if(res.ok){
      setForm({ displayName: '', name: '', capacity: '', baseFare: '', perKm: '', perMinute: '', commission: '', city: '', icon: '' });
      setEditingId(null);
      fetchTypes();
    }
  };

  const handleEdit = (t) => { 
    setForm({
      displayName: t.displayName || '',
      name: t.name || '',
      capacity: t.capacity || '',
      baseFare: t.baseFare || '',
      perKm: t.perKm || '',
      perMinute: t.perMinute || '',
      commission: t.commission || '',
      city: t.city || '',
      icon: t.icon || ''
    }); 
    setEditingId(t._id); 
    window.scrollTo(0,0); 
  };

  const handleDelete = async (id) => { 
    if(confirm('Delete this vehicle?')){ 
      await fetch(`${API_URL}/api/vehicle-types/${id}`, {method:'DELETE'}); 
      fetchTypes(); 
    } 
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">
      <h1 className="text-2xl font-black mb-6 text-white">Vehicle Types Manager</h1>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <input className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Display Name" value={form.displayName} onChange={e=>setForm({...form, displayName:e.target.value, name:e.target.value.toLowerCase().replace(/\s+/g,'-')})} required />
        <input className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Icon URL or Name" value={form.icon} onChange={e=>setForm({...form, icon:e.target.value})} />
        <input type="number" className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Capacity" value={form.capacity} onChange={e=>setForm({...form, capacity:e.target.value})} required />
        <input className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="City" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required />
        <input type="number" className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Base Fare" value={form.baseFare} onChange={e=>setForm({...form, baseFare:e.target.value})} required />
        <input type="number" className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Per KM" value={form.perKm} onChange={e=>setForm({...form, perKm:e.target.value})} required />
        <input type="number" className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Per Minute" value={form.perMinute} onChange={e=>setForm({...form, perMinute:e.target.value})} required />
        <input type="number" className="p-3 border border-white/10 rounded-xl bg-black text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#A7E92F]" placeholder="Commission %" value={form.commission} onChange={e=>setForm({...form, commission:e.target.value})} required />
        <button className="col-span-2 md:col-span-4 bg-[#A7E92F] text-black font-black py-3 rounded-xl">{editingId ? 'Update Vehicle' : 'Add Vehicle'}</button>
        {editingId && <button type="button" onClick={()=>{setEditingId(null); setForm({ displayName: '', name: '', capacity: '', baseFare: '', perKm: '', perMinute: '', commission: '', city: '', icon: ''});}} className="col-span-2 md:col-span-4 border border-white/20 py-3 rounded-xl font-bold text-white hover:bg-white/10">Cancel</button>}
      </form>

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow overflow-hidden">
        {loading ? <p className="p-8 text-center font-bold text-white">Loading...</p> : (
          <table className="w-full text-sm text-white">
            <thead className="bg-black font-bold text-white border-b border-white/10"><tr><th className="p-3 text-left text-white">Icon</th><th className="p-3 text-left text-white">Name</th><th className="p-3 text-white">Base</th><th className="p-3 text-white">Per KM</th><th className="p-3 text-white">City</th><th className="p-3 text-white">Action</th></tr></thead>
            <tbody>
              {types.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-white">No vehicle types yet. Add first one.</td></tr> : types.map(t=>(
                <tr key={t._id} className="border-t border-white/10"><td className="p-3 text-xl text-white">{t.icon}</td><td className="p-3 font-bold text-white">{t.displayName}<br/><span className="text-xs text-white">{t.capacity} persons</span></td><td className="p-3 text-white">Rs. {t.baseFare}</td><td className="p-3 text-white">Rs. {t.perKm}/km</td><td className="p-3 text-white">{t.city}</td>
                <td className="p-3 flex gap-2"><button onClick={()=>handleEdit(t)} className="px-3 py-1 bg-yellow-500/20 text-white rounded-full font-bold border border-yellow-500/30">Edit</button><button onClick={()=>handleDelete(t._id)} className="px-3 py-1 bg-red-500/20 text-white rounded-full font-bold border border-red-500/30">Delete</button></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}