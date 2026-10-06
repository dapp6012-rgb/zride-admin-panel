import { useState, useEffect } from 'react';
import { API_URL } from '../lib/api';
import { exportToExcel } from '../utils/exportExcel';

export default function AdminAddCityScreen({ notify }) {
  const [tab, setTab] = useState('city');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [countryForm, setCountryForm] = useState({ name: '', code: '', flag: '', length: '10' });
  const [cityForm, setCityForm] = useState({ name: '', country: '', countryId: '', lat: '', lng: '', baseFare: '', perKm: '' });

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${API_URL}/countries`);
      const data = await res.json();
      setCountries(data);
      if(data.length > 0 && !cityForm.countryId) {
        setCityForm(f => ({...f, country: data[0].name, countryId: String(data[0]._id)}));
      }
    } catch(e) { console.log(e) }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch(`${API_URL}/zones`);
      const data = await res.json();
      setCities(data);
    } catch(e) { console.log(e) }
  };

  useEffect(() => { fetchCountries(); fetchCities(); }, []);

  const handleAddCountry = async () => {
    if(!countryForm.name || !countryForm.code || !countryForm.flag) return alert('Saare fields bharo');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...countryForm, length: parseInt(countryForm.length)})
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      if(notify) notify(`${countryForm.name} country add ho gaya ${countryForm.flag}`);
      alert(`${countryForm.name} add ho gaya`);
      setCountryForm({ name: '', code: '', flag: '', length: '10' });
      await fetchCountries();
      setTab('city');
    } catch(e){ alert(e.message) }
    setLoading(false);
  };

  const handleAddCity = async () => {
    if (!cityForm.name || !cityForm.countryId || !cityForm.lat || !cityForm.lng || !cityForm.baseFare || !cityForm.perKm) {
      alert('Saare fields bharo'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cityForm.name.trim(),
          city: cityForm.name.trim(),
          country: cityForm.country.trim(),
          countryId: cityForm.countryId,
          lat: parseFloat(cityForm.lat),
          lng: parseFloat(cityForm.lng),
          latitude: parseFloat(cityForm.lat),
          longitude: parseFloat(cityForm.lng),
          center: { lat: parseFloat(cityForm.lat), lng: parseFloat(cityForm.lng) },
          baseFare: parseFloat(cityForm.baseFare),
          perKm: parseFloat(cityForm.perKm),
          isActive: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if(notify) notify(`${cityForm.country} me ${cityForm.name} add ho gaya`);
      alert(`Success!`);
      setCityForm({ ...cityForm, name: '', lat: '', lng: '', baseFare: '', perKm: '' });
      await fetchCities();
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const handleExportCountries = () => {
    const formatted = countries.map(c => ({
      CountryID: c._id,
      Name: c.name,
      Code: c.code,
      Flag: c.flag,
      PhoneLength: c.length,
      CreatedAt: new Date(c.createdAt || Date.now()).toLocaleDateString()
    }));
    exportToExcel(formatted, "ZRide_Countries");
  };

  const handleExportCities = () => {
    const formatted = cities.map(z => ({
      CityID: z._id,
      CityName: z.name || z.city,
      Country: z.country,
      CountryID: z.countryId,
      Latitude: z.lat || z.latitude,
      Longitude: z.lng || z.longitude,
      BaseFare: z.baseFare,
      PerKm: z.perKm,
      IsActive: z.isActive ? "Active" : "Inactive"
    }));
    exportToExcel(formatted, "ZRide_Cities");
  };

  return (
    <div className="p-6 max-w-xl text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Admin Location Manager</h1>
        {tab === 'country' ? (
          <button onClick={handleExportCountries} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
            📥 Export Excel
          </button>
        ) : (
          <button onClick={handleExportCities} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
            📥 Export Excel
          </button>
        )}
      </div>
      
      <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-lg border border-white/10">
        <button onClick={()=>setTab('country')} className={`flex-1 p-2 rounded font-bold ${tab==='country' ? 'bg-[#A7E92F] text-black' : 'text-white'}`}>+ Add Country</button>
        <button onClick={()=>setTab('city')} className={`flex-1 p-2 rounded font-bold ${tab==='city' ? 'bg-[#A7E92F] text-black' : 'text-white'}`}>+ Add City</button>
      </div>

      {tab === 'country' ? (
        <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
          <p className="text-sm text-white">Pehle country add karo taake PhoneLogin pe show ho</p>
          <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Country Name (Italy)" value={countryForm.name} onChange={e=>setCountryForm({...countryForm, name:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Code (+39)" value={countryForm.code} onChange={e=>setCountryForm({...countryForm, code:e.target.value})}/>
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Flag (🇮🇹)" value={countryForm.flag} onChange={e=>setCountryForm({...countryForm, flag:e.target.value})}/>
          </div>
          <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Phone Length (10)" value={countryForm.length} onChange={e=>setCountryForm({...countryForm, length:e.target.value})}/>
          <button onClick={handleAddCountry} disabled={loading} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg">{loading ? 'Saving...' : 'Add Country'}</button>
        </div>
      ) : (
        <div className="space-y-4 bg-white/5 p-5 rounded-xl border border-white/10">
          <label className="text-sm text-white">Country Select Karo (Jo Admin ne add ki)</label>
          <select className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white" value={cityForm.countryId} onChange={e=>{
            const selectedCountry = countries.find(country => String(country._id) === e.target.value);
            setCityForm({...cityForm, country: selectedCountry?.name || '', countryId: e.target.value});
          }}>
            {countries.length===0 ? <option className="text-white bg-black" value="">Pehele Country Add Karo</option> : countries.map(c=><option className="text-white bg-black" key={c._id || c.name} value={String(c._id)}>{c.flag} {c.name} ({c.code})</option>)}
          </select>
          <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="City Name (Rome)" value={cityForm.name} onChange={e=>setCityForm({...cityForm, name:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Latitude" value={cityForm.lat} onChange={e=>setCityForm({...cityForm, lat:e.target.value})}/>
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Longitude" value={cityForm.lng} onChange={e=>setCityForm({...cityForm, lng:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Base Fare" value={cityForm.baseFare} onChange={e=>setCityForm({...cityForm, baseFare:e.target.value})}/>
            <input className="w-full p-3 rounded-lg bg-black border border-white/20 outline-none text-white placeholder:text-white/50" placeholder="Per KM Fare" value={cityForm.perKm} onChange={e=>setCityForm({...cityForm, perKm:e.target.value})}/>
          </div>
          <button onClick={handleAddCity} disabled={loading} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg">{loading ? 'Saving...' : `Add City in ${cityForm.country}`}</button>
        </div>
      )}
    </div>
  );
}