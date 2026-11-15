import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function AdminAddCityScreen({ notify }) {
  const [tab, setTab] = useState('city');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({ country: false, city: false, list: true });
  const [error, setError] = useState('');

  const [countryForm, setCountryForm] = useState({ name: '', code: '', flag: '', length: '10' });
  const [cityForm, setCityForm] = useState({ name: '', country: '', countryId: '', lat: '', lng: '', baseFare: '', perKm: '' });

  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.data || [];
      setCountries(list);
      if (list.length > 0 &&!cityForm.countryId) {
        setCityForm(f => ({...f, country: list[0].name, countryId: String(list[0]._id) }));
      }
    } catch (e) { console.log(e); setError('Country load failed') }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(l => ({...l, list: true}));
      const res = await fetch(`${API_URL}/zones`);
      const data = await res.json();
      setCities(Array.isArray(data)? data : data.zones || data.data || []);
    } catch (e) { console.log(e) }
    finally { setLoading(l => ({...l, list: false})) }
  }, []);

  useEffect(() => { fetchCountries(); fetchCities(); }, [fetchCountries, fetchCities]);

  const handleAddCountry = async () => {
    if (!countryForm.name.trim() ||!countryForm.code.trim() ||!countryForm.flag.trim()) {
      return notify?.('⚠️ Saare fields bharo') || alert('Saare fields bharo');
    }
    setLoading(l => ({...l, country: true}));
    try {
      const res = await fetch(`${API_URL}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...countryForm, name: countryForm.name.trim(), length: parseInt(countryForm.length) || 10 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      notify?.(`${countryForm.name} ${countryForm.flag} added ✅`);
      setCountryForm({ name: '', code: '', flag: '', length: '10' });
      await fetchCountries();
      setTab('city');
    } catch (e) { notify?.(`Error: ${e.message}`); alert(e.message) }
    finally { setLoading(l => ({...l, country: false})) }
  };

  const handleAddCity = async () => {
    if (!cityForm.name.trim() ||!cityForm.countryId ||!cityForm.lat ||!cityForm.lng ||!cityForm.baseFare ||!cityForm.perKm) {
      return notify?.('⚠️ Saare fields bharo');
    }
    setLoading(l => ({...l, city: true}));
    try {
      const payload = {
        name: cityForm.name.trim(),
        city: cityForm.name.trim(),
        country: cityForm.country.trim(),
        countryId: cityForm.countryId,
        lat: parseFloat(cityForm.lat),
        lng: parseFloat(cityForm.lng),
        baseFare: parseFloat(cityForm.baseFare),
        perKm: parseFloat(cityForm.perKm),
        isActive: true
      };
      const res = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add city');
      notify?.(`${payload.country} me ${payload.name} added ✅`);
      setCityForm(f => ({...f, name: '', lat: '', lng: '', baseFare: '', perKm: '' }));
      await fetchCities();
    } catch (e) { notify?.(`Error: ${e.message}`); alert('Error: ' + e.message) }
    finally { setLoading(l => ({...l, city: false})) }
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm('Delete this city?')) return;
    try {
      await fetch(`${API_URL}/zones/${id}`, { method: 'DELETE' });
      notify?.('City deleted 🗑️');
      await fetchCities();
    } catch (e) { alert(e.message) }
  };

  const handleExport = () => {
    if (tab === 'country') {
      exportExcel(countries.map(c => ({ Name: c.name, Code: c.code, Flag: c.flag, Length: c.length })), 'Countries');
    } else {
      exportExcel(cities.map(z => ({ City: z.name, Country: z.country, Lat: z.lat, Lng: z.lng, BaseFare: z.baseFare, PerKm: z.perKm })), 'Cities');
    }
  };

  return (
    <div className="p-6 max-w-3xl text-white space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Location Manager</h1>
        <ExcelExportButton onClick={handleExport} />
      </div>

      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 w-fit">
        <button onClick={() => setTab('country')} className={`px-5 py-2 rounded-lg text-sm font-bold ${tab==='country'? 'bg-[#A7E92F] text-black' : 'text-white/70'}`}>+ Country</button>
        <button onClick={() => setTab('city')} className={`px-5 py-2 rounded-lg text-sm font-bold ${tab==='city'? 'bg-[#A7E92F] text-black' : 'text-white/70'}`}>+ City ({cities.length})</button>
      </div>

      {tab === 'country'? (
        <div className="space-y-4 bg-[#1a1a1a] p-5 rounded-xl border border-white/10">
          <input className="w-full p-3 rounded-lg bg-black border border-white/10 outline-none" placeholder="Country Name (Italy)" value={countryForm.name} onChange={e=>setCountryForm({...countryForm, name:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Code (+39)" value={countryForm.code} onChange={e=>setCountryForm({...countryForm, code:e.target.value})}/>
            <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Flag (🇮🇹)" value={countryForm.flag} onChange={e=>setCountryForm({...countryForm, flag:e.target.value})}/>
          </div>
          <button onClick={handleAddCountry} disabled={loading.country} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg disabled:opacity-50">{loading.country? 'Saving...' : 'Add Country'}</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/10 space-y-4">
            <select className="w-full p-3 rounded-lg bg-black border border-white/10" value={cityForm.countryId} onChange={e=>{
              const c = countries.find(x => String(x._id) === e.target.value);
              setCityForm({...cityForm, country: c?.name || '', countryId: e.target.value});
            }}>
              {countries.length===0? <option value="">Pehele Country Add Karo</option> : countries.map(c=><option key={c._id} value={String(c._id)}>{c.flag} {c.name}</option>)}
            </select>
            <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="City Name (Rome)" value={cityForm.name} onChange={e=>setCityForm({...cityForm, name:e.target.value})}/>
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Latitude" value={cityForm.lat} onChange={e=>setCityForm({...cityForm, lat:e.target.value})}/>
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Longitude" value={cityForm.lng} onChange={e=>setCityForm({...cityForm, lng:e.target.value})}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Base Fare" value={cityForm.baseFare} onChange={e=>setCityForm({...cityForm, baseFare:e.target.value})}/>
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Per KM" value={cityForm.perKm} onChange={e=>setCityForm({...cityForm, perKm:e.target.value})}/>
            </div>
            <button onClick={handleAddCity} disabled={loading.city} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg disabled:opacity-50">{loading.city? 'Saving...' : `Add City in ${cityForm.country || '...'}`}</button>
          </div>

          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
            <h3 className="font-bold mb-3 text-sm">Added Cities ({cities.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {loading.list? <p className="text-white/40 text-sm">Loading...</p> : cities.map(city => (
                <div key={city._id} className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-white/5">
                  <div><p className="font-bold text-sm">{city.name} - {city.country}</p><p className="text-[11px] text-white/50">{city.lat}, {city.lng} | Base: {city.baseFare}</p></div>
                  <button onClick={()=>handleDeleteCity(city._id)} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}