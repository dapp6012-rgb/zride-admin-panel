import { useState, useEffect, useRef } from 'react';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

const API_URL = 'http://localhost:3000';
const LINKS = [
  { value: 'rent-cars', label: 'Rent A Cars Page' },
  { value: 'ride', label: 'Ride Booking' },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function getWithRetry(url, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(url);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await wait(1500 * (attempt + 1));
      continue;
    }
    if (response.ok) return response;
    lastError = new Error(`Backend returned ${response.status}`);
    if (![502, 503, 504].includes(response.status) || attempt === attempts - 1) throw lastError;
    await wait(1500 * (attempt + 1));
  }
  throw lastError || new Error('Unable to connect to the backend');
}

export default function AdminAddBanner() {
  const [form, setForm] = useState({
    title: '',
    city: '',
    link: 'rent-cars',
    image: null
  });
  const [cities, setCities] = useState([]); // dynamic cities
  const [filterCity, setFilterCity] = useState('All'); // filter for banner list
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [message, setMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [retryUpload, setRetryUpload] = useState(false);
  const fileInputRef = useRef(null);

  // REAL Cities fetch from backend (AdminAddCityScreen wali API)
  const fetchCities = async () => {
    try {
      // Tumhari city API /api/zones me hai
      const res = await fetch(`${API_URL}/api/zones`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.zones || data.cities || [];
      // name nikal lo
      const cityNames = list.map(c => c.name || c.city).filter(Boolean);
      const unique = [...new Set(cityNames)];
      if(unique.length > 0) {
        setCities(unique);
        // default select first city
        if(!form.city) {
          setForm(f => ({...f, city: unique[0]}));
        }
      }
    } catch(e) {
      console.log('City fetch failed', e);
      setCities(['Karachi']); // fallback
      if(!form.city) setForm(f => ({...f, city: 'Karachi'}));
    }
  };

  const fetchBanners = async () => {
    setBackendStatus('connecting');
    setListLoading(true);
    try {
      const res = await getWithRetry(`${API_URL}/api/banners`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.banners || [];
      setBanners(list);
      setBackendStatus('connected');
      return true;
    } catch (e) {
      setBackendStatus('error');
      setMessage('Backend connection failed. Render may be waking up; retry in a moment.');
      return false;
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
    fetchBanners();
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setForm((current) => ({...current, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const submitBanner = async () => {
    if (!form.image) {
      setMessage('Please select image');
      return false;
    }
    if (!form.city) {
      setMessage('Please select city');
      return false;
    }
    setLoading(true);
    setMessage('');
    setRetryUpload(false);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('city', form.city);
      fd.append('link', form.link);
      fd.append('image', form.image);

      setBackendStatus('connecting');
      const res = await fetch(`${API_URL}/api/banners`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Banner Added Successfully in ${form.city}!`);
        setBackendStatus('connected');
        setForm({ title: '', city: form.city, link: 'rent-cars', image: null });
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchBanners();
        return true;
      } else {
        setBackendStatus('error');
        setMessage(data.message || 'Failed to add banner');
        setRetryUpload([502, 503, 504].includes(res.status));
      }
    } catch (err) {
      setBackendStatus('error');
      setMessage('Upload failed. The backend may be waking up; retry the upload in a moment.');
      setRetryUpload(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitBanner();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    setDeletingId(id);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBackendStatus('connected');
        await fetchBanners();
      } else {
        setMessage('Failed to delete banner. Please retry.');
      }
    } catch (e) {
      setBackendStatus('error');
      setMessage('Delete failed. Backend may be waking up; please retry.');
    } finally {
      setDeletingId(null);
    }
  };

  // FILTER: Jo city select karo sirf usi ke banners show honge
  const filteredBanners = filterCity === 'All'? banners : banners.filter(b => b.city === filterCity);
  const handleExportExcel = () => exportExcel(filteredBanners.map(b => ({
    Title: b.title || '',
    City: b.city || '',
    DisplayedOn: LINKS.find(link => link.value === b.link)?.label || b.link || '',
    ImageURL: b.image || '',
  })), 'AdminAddBanner');

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-black mb-6 text-white">ZRide - Banner Manager</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6 text-white" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${backendStatus === 'connected'? 'bg-lime-500' : backendStatus === 'error'? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-bold text-white">
            {backendStatus === 'connected'? 'Backend connected' : backendStatus === 'error'? 'Backend unavailable' : 'Backend connecting...'}
          </span>
        </div>
        {backendStatus!== 'connected' && (
          <button type="button" onClick={fetchBanners} disabled={listLoading} className="rounded-lg border border-white/20 px-4 py-2 font-bold text-white hover:bg-white/10 disabled:opacity-50">
            {listLoading? 'Retrying...' : 'Retry connection'}
          </button>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl shadow p-6 mb-8 border border-white/10">
        <h2 className="font-bold text-lg mb-4 text-white">Add New Banner</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-white">Banner Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value })}
                placeholder="e.g. Rent A Car Offer 20% OFF"
                className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#A7E92F]"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-white">City (Real Cities from DB)</label>
              <select
                value={form.city}
                onChange={(e) => setForm({...form, city: e.target.value })}
                className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#A7E92F]"
              >
                {cities.length === 0 && <option className="bg-black text-white">Loading cities...</option>}
                {cities.map(c => <option key={c} value={c} className="text-white bg-black">{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-white">Show Banner On</label>
            <select
              value={form.link}
                onChange={(e) => setForm((current) => ({...current, link: e.target.value }))}
                className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#A7E92F]"
            >
                {LINKS.map(({ value, label }) => <option key={value} value={value} className="text-white bg-black">{label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-white">Banner Image (1080x400 recommended)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white file:text-white file:bg-white/10 file:border-0 file:rounded-lg file:px-3 file:py-1"
            />
            {preview && (
              <img src={preview} alt="preview" className="mt-3 w-full h-40 object-cover rounded-xl border border-white/10" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#A7E92F] text-black font-black py-3.5 rounded-xl hover:bg-[#A7E92F]/90 transition disabled:opacity-50"
            >
              {loading? 'Uploading...' : `Add Banner in ${form.city}`}
            </button>
            {retryUpload && (
              <button type="button" onClick={submitBanner} disabled={loading} className="rounded-xl border border-white/20 px-5 py-3.5 font-bold text-white hover:bg-white/10 disabled:opacity-50">
                Retry upload
              </button>
            )}
          </div>

          {message && <p className="text-center font-bold text-sm mt-2 p-3 bg-white/10 rounded-lg text-white border border-white/10" role="status">{message}</p>}
        </form>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl shadow p-6 border border-white/10">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="font-bold text-lg text-white">Banners - {filterCity} ({filteredBanners.length})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="p-2 rounded-lg border border-white/10 bg-black text-white text-sm">
              <option value="All" className="bg-black text-white">All Cities</option>
              {cities.map(c => <option key={c} value={c} className="bg-black text-white">{c}</option>)}
            </select>
            <ExcelExportButton onClick={handleExportExcel} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((b) => (
            <div key={b._id} className="relative rounded-xl overflow-hidden border border-white/10 group bg-black">
              <img
                src={b.image?.startsWith('/uploads')? `${API_URL}${b.image}` : b.image}
                alt={b.title}
                className="w-full h-36 object-cover"
              />
              <div className="p-3 bg-[#1a1a1a]">
                <p className="font-black text-sm truncate text-white">{b.title}</p>
                <p className="text-xs text-white font-semibold">{b.city} • {b.link}</p>
              </div>
              <button
                onClick={() => handleDelete(b._id)}
                disabled={deletingId === b._id}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 focus:opacity-100 transition disabled:opacity-50"
              >
                {deletingId === b._id? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
        {listLoading && <p className="text-center text-white font-bold py-8">Loading banners...</p>}
        {!listLoading && filteredBanners.length === 0 && <p className="text-center text-white font-bold py-8">No banners in {filterCity}</p>}
      </div>
    </div>
  );
}