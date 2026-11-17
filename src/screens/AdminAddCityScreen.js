import { useState, useEffect, useCallback } from 'react';
import { API_URL, apiFetch } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function AdminAddCityScreen({ notify }) {
  const [tab, setTab] = useState('city');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({ country: false, city: false, list: true });
  const [error, setError] = useState('');
  const [isWorldwide, setIsWorldwide] = useState(false);
  const [isWorldwideCountry, setIsWorldwideCountry] = useState(false);

  const [countryForm, setCountryForm] = useState({ name: '', code: '', flag: '', length: '10', minLength: '6', maxLength: '15' });
  const [cityForm, setCityForm] = useState({ name: '', country: '', countryId: '', lat: '', lng: '', baseFare: '', perKm: '', demandLevel: 'medium' });

  const fetchCountries = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/countries`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setCountries(list);
      setCityForm(f => {
        if (list.length > 0 && !f.countryId) {
          return { ...f, country: list[0].name, countryId: String(list[0]._id) };
        }
        return f;
      });
    } catch (e) { console.log(e); setError('Country load failed') }
  }, []);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, list: true }));
      const res = await apiFetch(`${API_URL}/zones`);
      const data = await res.json();
      setCities(Array.isArray(data) ? data : data.zones || data.data || []);
    } catch (e) { console.log(e) }
    finally { setLoading(l => ({ ...l, list: false })) }
  }, []);

  useEffect(() => { fetchCountries(); fetchCities(); }, [fetchCountries, fetchCities]);

  const handleAddCountry = async () => {
    if (!countryForm.name.trim() || !countryForm.code.trim() || !countryForm.flag.trim()) {
      return notify?.('⚠️ Saare fields bharo') || alert('Saare fields bharo');
    }
    setLoading(l => ({ ...l, country: true }));
    try {
      const minLength = isWorldwideCountry ? 6 : (parseInt(countryForm.minLength) || 6);
      const maxLength = isWorldwideCountry ? 15 : (parseInt(countryForm.maxLength) || parseInt(countryForm.length) || 15);
      const payload = {
        ...countryForm,
        name: countryForm.name.trim(),
        length: maxLength,
        minLength: minLength,
        maxLength: maxLength,
        phoneMinLength: minLength,
        phoneMaxLength: maxLength,
        phoneLengthMin: minLength,
        phoneLengthMax: maxLength,
        isWorldwide: isWorldwideCountry,
      };
      const res = await apiFetch(`${API_URL}/countries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      notify?.(`${countryForm.name} ${countryForm.flag} added ✅`);
      setCountryForm({ name: '', code: '', flag: '', length: '10', minLength: '6', maxLength: '15' });
      setIsWorldwideCountry(false);
      await fetchCountries();
      setTab('city');
    } catch (e) { notify?.(`Error: ${e.message}`); alert(e.message) }
    finally { setLoading(l => ({ ...l, country: false })) }
  };

  const handleAddCity = async () => {
    if (!cityForm.name.trim() || !cityForm.countryId || !cityForm.baseFare || !cityForm.perKm) {
      return notify?.('⚠️ Saare fields bharo');
    }
    if (!isWorldwide && (!cityForm.lat || !cityForm.lng)) {
      return notify?.('⚠️ Latitude / Longitude bharo ya Worldwide select karo');
    }
    setLoading(l => ({ ...l, city: true }));
    try {
      const lat = isWorldwide ? 0 : parseFloat(cityForm.lat);
      const lng = isWorldwide ? 0 : parseFloat(cityForm.lng);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Latitude -90 se 90 aur Longitude -180 se 180 ke darmiyan hona chahiye');
      }

      let polygon;
      let ring;
      if (isWorldwide) {
        polygon = [
          { lat: -85, lng: -180 },
          { lat: -85, lng: 180 },
          { lat: 85, lng: 180 },
          { lat: 85, lng: -180 },
          { lat: -85, lng: -180 }
        ];
        ring = [
          [-180, -85],
          [180, -85],
          [180, 85],
          [-180, 85],
          [-180, -85]
        ];
      } else {
        polygon = [
          { lat: lat - 0.15, lng: lng - 0.2 },
          { lat: lat - 0.15, lng: lng + 0.2 },
          { lat: lat + 0.15, lng: lng + 0.2 },
          { lat: lat + 0.15, lng: lng - 0.2 },
          { lat: lat - 0.15, lng: lng - 0.2 }
        ];
        ring = [
          [lng - 0.2, lat - 0.15],
          [lng + 0.2, lat - 0.15],
          [lng + 0.2, lat + 0.15],
          [lng - 0.2, lat + 0.15],
          [lng - 0.2, lat - 0.15]
        ];
      }

      const demandLevel = (cityForm.demandLevel || 'medium').toLowerCase();
      const payload = {
        name: cityForm.name.trim(),
        city: cityForm.name.trim(),
        country: cityForm.country.trim(),
        countryId: cityForm.countryId,
        lat: lat,
        lng: lng,
        baseFare: parseFloat(cityForm.baseFare),
        perKm: parseFloat(cityForm.perKm),
        isActive: true,
        isWorldwide: isWorldwide,
        // FIX: Demand Level wala error yahan fix hua hai
        demandLevel: demandLevel,
        demand: demandLevel,
        surgeMultiplier: demandLevel === 'high' ? 1.5 : demandLevel === 'low' ? 1 : 1.2,
        polygon: polygon,
        coordinates: polygon,
        boundary: polygon,
        polygonPoints: polygon,
        geometry: { type: 'Polygon', coordinates: [ring] },
        area: { type: 'Polygon', coordinates: [ring] }
      };
      const res = await apiFetch(`${API_URL}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to add city');
      notify?.(`${payload.country} me ${payload.name} added ✅`);
      setCityForm(f => ({ ...f, name: '', lat: '', lng: '', baseFare: '', perKm: '', demandLevel: 'medium' }));
      setIsWorldwide(false);
      await fetchCities();
    } catch (e) { notify?.(`Error: ${e.message}`); alert('Error: ' + e.message) }
    finally { setLoading(l => ({ ...l, city: false })) }
  };

  const handleDeleteCity = async (id) => {
    if (!window.confirm('Delete this city?')) return;
    try {
      await apiFetch(`${API_URL}/zones/${id}`, { method: 'DELETE' });
      notify?.('City deleted 🗑️');
      await fetchCities();
    } catch (e) { alert(e.message) }
  };

  const handleDeleteCountry = async (country) => {
    const countryId = String(country._id);
    const relatedCities = cities.filter(c => String(c.countryId) === countryId || c.country === country.name);

    if (!window.confirm(`Delete ${country.name} ${country.flag}?\nIs ki ${relatedCities.length} cities bhi delete ho jayengi!`)) return;

    try {
      for (const city of relatedCities) {
        await apiFetch(`${API_URL}/zones/${city._id}`, { method: 'DELETE' });
      }
      const res = await apiFetch(`${API_URL}/countries/${countryId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete country');

      notify?.(`${country.name} deleted 🗑️`);
      if (String(cityForm.countryId) === countryId) {
        setCityForm(f => ({ ...f, country: '', countryId: '' }));
      }
      await fetchCountries();
      await fetchCities();
    } catch (e) {
      notify?.(`Error: ${e.message}`);
      alert('Error: ' + e.message);
    }
  };

  const getCountryLengthText = (c) => {
    if (c.isWorldwide) return 'Worldwide 6-15';
    if (c.minLength && c.maxLength) return `${c.minLength}-${c.maxLength}`;
    if (c.phoneLengthMin && c.phoneLengthMax) return `${c.phoneLengthMin}-${c.phoneLengthMax}`;
    return `${c.length || 10}`;
  };

  const handleExport = () => {
    if (tab === 'country') {
      exportExcel(countries.map(c => ({ Name: c.name, Code: c.code, Flag: c.flag, Length: getCountryLengthText(c) })), 'Countries');
    } else {
      exportExcel(cities.map(z => ({ City: z.name, Country: z.country, Lat: z.lat, Lng: z.lng, BaseFare: z.baseFare, PerKm: z.perKm, Demand: z.demandLevel || z.demand || 'medium', Worldwide: z.isWorldwide ? 'Yes' : 'No' })), 'Cities');
    }
  };

  return (
    <div className="p-6 max-w-3xl text-white space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Location Manager</h1>
        <ExcelExportButton onClick={handleExport} />
      </div>

      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 w-fit">
        <button onClick={() => setTab('country')} className={`px-5 py-2 rounded-lg text-sm font-bold ${tab === 'country' ? 'bg-[#A7E92F] text-black' : 'text-white/70'}`}>+ Country ({countries.length})</button>
        <button onClick={() => setTab('city')} className={`px-5 py-2 rounded-lg text-sm font-bold ${tab === 'city' ? 'bg-[#A7E92F] text-black' : 'text-white/70'}`}>+ City ({cities.length})</button>
      </div>

      {tab === 'country' ? (
        <div className="space-y-4">
          <div className="space-y-4 bg-[#1a1a1a] p-5 rounded-xl border border-white/10">
            <input className="w-full p-3 rounded-lg bg-black border border-white/10 outline-none" placeholder="Country Name (Italy)" value={countryForm.name} onChange={e => setCountryForm({ ...countryForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Code (+39)" value={countryForm.code} onChange={e => setCountryForm({ ...countryForm, code: e.target.value })} />
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Flag (🇮🇹)" value={countryForm.flag} onChange={e => setCountryForm({ ...countryForm, flag: e.target.value })} />
            </div>
            <button type="button" onClick={() => setIsWorldwideCountry(!isWorldwideCountry)} className={`w-full p-3 rounded-lg font-bold text-sm border ${isWorldwideCountry ? 'bg-[#A7E92F] text-black border-[#A7E92F]' : 'bg-black text-white/70 border-white/10'}`}>
              {isWorldwideCountry ? '🌍 Worldwide ON - Phone 6 se 15 digit tak' : '🌍 Worldwide - Pure World ke liye Click Karo'}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-white/50 mb-1 ml-1">Min Phone Length</p>
                <input disabled={isWorldwideCountry} className="w-full p-3 rounded-lg bg-black border border-white/10 disabled:opacity-40" placeholder="Min (6)" value={isWorldwideCountry ? '6' : countryForm.minLength} onChange={e => setCountryForm({ ...countryForm, minLength: e.target.value })} />
              </div>
              <div>
                <p className="text-[11px] text-white/50 mb-1 ml-1">Max Phone Length</p>
                <input disabled={isWorldwideCountry} className="w-full p-3 rounded-lg bg-black border border-white/10 disabled:opacity-40" placeholder="Max (15)" value={isWorldwideCountry ? '15' : countryForm.maxLength} onChange={e => setCountryForm({ ...countryForm, maxLength: e.target.value })} />
              </div>
            </div>
            <p className="text-[11px] text-white/40">Worldwide me 6 se 15 digit tak ka koi bhi number chalega. Italy ka 10, Pakistan ka 10, UK ka 10, sab chalega.</p>
            <button onClick={handleAddCountry} disabled={loading.country} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg disabled:opacity-50">{loading.country ? 'Saving...' : 'Add Country'}</button>
          </div>

          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
            <h3 className="font-bold mb-3 text-sm">Added Countries ({countries.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {countries.length === 0 ? <p className="text-white/40 text-sm">Koi country nahi hai</p> : countries.map(country => {
                const count = cities.filter(c => String(c.countryId) === String(country._id) || c.country === country.name).length;
                return (
                  <div key={country._id} className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-white/5">
                    <div><p className="font-bold text-sm">{country.flag} {country.name} - {country.code} {country.isWorldwide ? '🌍' : ''}</p><p className="text-[11px] text-white/50">{count} Cities | Phone Length: {getCountryLengthText(country)}</p></div>
                    <button onClick={() => handleDeleteCountry(country)} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">Delete</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-white/10 space-y-4">
            <select className="w-full p-3 rounded-lg bg-black border border-white/10" value={cityForm.countryId} onChange={e => {
              const c = countries.find(x => String(x._id) === e.target.value);
              setCityForm({ ...cityForm, country: c?.name || '', countryId: e.target.value });
            }}>
              {countries.length === 0 ? <option value="">Pehele Country Add Karo</option> : countries.map(c => <option key={c._id} value={String(c._id)}>{c.flag} {c.name}</option>)}
            </select>

            <button type="button" onClick={() => { setIsWorldwide(!isWorldwide); if (!isWorldwide) setCityForm(f => ({ ...f, name: 'Worldwide', lat: '0', lng: '0' })); }} className={`w-full p-3 rounded-lg font-bold text-sm border ${isWorldwide ? 'bg-[#A7E92F] text-black border-[#A7E92F]' : 'bg-black text-white/70 border-white/10'}`}>
              {isWorldwide ? '🌍 Worldwide ON - Poori Duniya' : '🌍 Worldwide - Poori Duniya ke liye Click Karo'}
            </button>

            <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="City Name (Rome / Worldwide)" value={cityForm.name} onChange={e => setCityForm({ ...cityForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input disabled={isWorldwide} className="w-full p-3 rounded-lg bg-black border border-white/10 disabled:opacity-40" placeholder="Latitude" value={cityForm.lat} onChange={e => setCityForm({ ...cityForm, lat: e.target.value })} />
              <input disabled={isWorldwide} className="w-full p-3 rounded-lg bg-black border border-white/10 disabled:opacity-40" placeholder="Longitude" value={cityForm.lng} onChange={e => setCityForm({ ...cityForm, lng: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Base Fare" value={cityForm.baseFare} onChange={e => setCityForm({ ...cityForm, baseFare: e.target.value })} />
              <input className="w-full p-3 rounded-lg bg-black border border-white/10" placeholder="Per KM" value={cityForm.perKm} onChange={e => setCityForm({ ...cityForm, perKm: e.target.value })} />
            </div>

            <select className="w-full p-3 rounded-lg bg-black border border-white/10" value={cityForm.demandLevel} onChange={e => setCityForm({ ...cityForm, demandLevel: e.target.value })}>
              <option value="low">Demand: Low - Rush Kam Hai</option>
              <option value="medium">Demand: Medium - Normal Rush</option>
              <option value="high">Demand: High - Zyada Rush</option>
            </select>

            <button onClick={handleAddCity} disabled={loading.city} className="w-full bg-[#A7E92F] text-black font-bold p-3 rounded-lg disabled:opacity-50">{loading.city ? 'Saving...' : isWorldwide ? 'Add Worldwide Zone 🌍' : `Add City in ${cityForm.country || '...'}`}</button>
          </div>

          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
            <h3 className="font-bold mb-3 text-sm">Added Cities ({cities.length})</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {loading.list ? <p className="text-white/40 text-sm">Loading...</p> : cities.map(city => (
                <div key={city._id} className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-white/5">
                  <div><p className="font-bold text-sm">{city.name} - {city.country} {city.isWorldwide ? '🌍' : ''}</p><p className="text-[11px] text-white/50">{city.isWorldwide ? 'Worldwide | Poori Duniya' : `${city.lat}, ${city.lng}`} | Base: {city.baseFare} | Demand: {city.demandLevel || city.demand || 'medium'}</p></div>
                  <button onClick={() => handleDeleteCity(city._id)} className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}