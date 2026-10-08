import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL, API_BASE_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

const LINKS = [
  { value: 'rent-cars', label: 'Rent A Cars Page' },
  { value: 'ride', label: 'Ride Booking' },
];

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function getWithRetry(url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`Backend returned ${res.status}`);
      if (![502, 503, 504].includes(res.status)) throw lastError;
    } catch (e) { lastError = e; if (i === attempts - 1) break; }
    await wait(1500 * (i + 1));
  }
  throw lastError;
}

export default function AdminAddBanner() {
  const [form, setForm] = useState({ title: '', city: '', link: 'rent-cars', image: null, type: 'image' });
  const [cities, setCities] = useState([]);
  const [filterCity, setFilterCity] = useState('All');
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState('image');
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState([]);
  const [message, setMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [retryUpload, setRetryUpload] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/zones`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.zones || data.data || [];
      const cityNames = [...new Set(list.map(c => c.name || c.city).filter(Boolean))];
      if (cityNames.length > 0) {
        setCities(cityNames);
        setForm(f => f.city? f : {...f, city: cityNames[0]});
      } else {
        setCities(['Karachi']);
        setForm(f => f.city? f : {...f, city: 'Karachi'});
      }
    } catch (e) {
      setCities(['Karachi']);
      setForm(f => f.city? f : {...f, city: 'Karachi'});
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    setBackendStatus('connecting');
    setListLoading(true);
    try {
      const res = await getWithRetry(`${API_URL}/banners`);
      const data = await res.json();
      const list = Array.isArray(data)? data : data.banners || [];
      setBanners(list);
      setBackendStatus('connected');
    } catch (e) {
      setBackendStatus('error');
      setMessage('Backend connection failed. Render may be waking up...');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => { fetchCities(); fetchBanners(); }, [fetchCities, fetchBanners]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo? 50 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(isVideo? 'Video must be less than 50MB' : 'Image must be less than 5MB');
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setForm(c => ({...c, image: file, type: isVideo? 'video' : 'image' }));
    setPreview(URL.createObjectURL(file));
    setPreviewType(isVideo? 'video' : 'image');
  };

  const handleTypeChange = (newType) => {
    setForm(c => ({...c, type: newType}));
    // Reset file if type changed
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm(c => ({...c, image: null, type: newType}));
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  const submitBanner = async () => {
    if (!form.image) return setMessage('Please select image or video');
    if (!form.city) return setMessage('Please select city');
    setLoading(true); setMessage(''); setRetryUpload(false);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('city', form.city);
      fd.append('link', form.link);
      fd.append('type', form.type); // NAYA FIELD
      fd.append('image', form.image); // backend same field pe file lega, image ya video

      setBackendStatus('connecting');
      const res = await fetch(`${API_URL}/banners`, { method: 'POST', body: fd });
      const data = await res.json().catch(()=>({}));
      if (res.ok) {
        setMessage(`✅ ${form.type === 'video'? 'Video Ad' : 'Banner'} Added in ${form.city}!`);
        setBackendStatus('connected');
        setForm(f => ({ title: '', city: f.city, link: 'rent-cars', image: null, type: 'image' }));
        setPreview(null);
        setPreviewType('image');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchBanners();
      } else {
        setBackendStatus('error');
        setMessage(data.message || 'Failed to add banner');
        setRetryUpload([502, 503, 504].includes(res.status));
      }
    } catch (err) {
      setBackendStatus('error');
      setMessage('Upload failed. Backend waking up, retry...');
      setRetryUpload(true);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchBanners();
      else setMessage('Failed to delete banner');
    } catch (e) { setMessage('Delete failed, retry...'); }
    finally { setDeletingId(null); }
  };

  const filteredBanners = filterCity === 'All'? banners : banners.filter(b => b.city === filterCity);
  const getBannerUrl = (img) => {
    if (!img) return '';
    if (/^https?:\/\//i.test(img)) return img;
    if (img.startsWith('/uploads') || img.startsWith('/')) return `${API_BASE_URL}${img}`;
    return img;
  };

  const isVideoFile = (banner) => {
    if (banner.type === 'video') return true;
    const url = banner.image || banner.video || '';
    return url.match(/\.(mp4|mov|webm|avi)$/i);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-black mb-6">ZRide - Banner Manager</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1a1a1a] rounded-xl border border-white/10 p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${backendStatus==='connected'? 'bg-lime-500' : backendStatus==='error'? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-bold text-sm">{backendStatus==='connected'? 'Backend connected' : backendStatus==='error'? 'Backend unavailable' : 'Connecting...'}</span>
        </div>
        {backendStatus!=='connected' && <button onClick={fetchBanners} disabled={listLoading} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-50">{listLoading? 'Retrying...' : 'Retry'}</button>}
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 border border-white/10">
        <h2 className="font-bold text-lg mb-4">Add New Banner</h2>
        <form onSubmit={e=>{e.preventDefault(); submitBanner();}} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-white/60">Banner Title</label><input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Rent A Car Offer 20% OFF" className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white outline-none focus:ring-2 focus:ring-[#A7E92F]" /></div>
            <div><label className="text-xs font-bold text-white/60">City (Real from DB)</label><select value={form.city} onChange={e=>setForm({...form, city: e.target.value})} className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white outline-none"><option value="" disabled>Select city</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white/60">Ad Type</label>
              <select value={form.type} onChange={e=>handleTypeChange(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white outline-none">
                <option value="image">Image Banner</option>
                <option value="video">Video Ad</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-white/60">Show On</label>
              <select value={form.link} onChange={e=>setForm(c=>({...c, link: e.target.value}))} className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white outline-none">{LINKS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-white/60">{form.type === 'video'? 'Video File (mp4, max 50MB)' : 'Image (1080x400, max 5MB)'}</label>
            <input ref={fileInputRef} type="file" accept={form.type === 'video'? 'video/*' : 'image/*'} onChange={handleFileChange} className="w-full mt-1 p-3 rounded-xl border border-white/10 bg-black text-white file:bg-white/10 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-white" />
            {preview && (
              previewType === 'video'?
              <video src={preview} className="mt-3 w-full h-48 object-cover rounded-xl border border-white/10" controls muted loop /> :
              <img src={preview} alt="preview" className="mt-3 w-full h-40 object-cover rounded-xl border border-white/10" />
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-[#A7E92F] text-black font-black py-3.5 rounded-xl hover:bg-[#96d42a] disabled:opacity-50">{loading? 'Uploading...' : `Add ${form.type === 'video'? 'Video Ad' : 'Banner'} in ${form.city || '...'}`}</button>
            {retryUpload && <button type="button" onClick={submitBanner} className="rounded-xl border border-white/20 px-5 font-bold hover:bg-white/10">Retry</button>}
          </div>
          {message && <p className="text-center text-sm p-3 bg-white/5 rounded-lg border border-white/10">{message}</p>}
        </form>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="font-bold text-lg">Banners - {filterCity} ({filteredBanners.length})</h2>
          <div className="flex gap-2"><select value={filterCity} onChange={e=>setFilterCity(e.target.value)} className="p-2 rounded-lg border border-white/10 bg-black text-sm"><option value="All">All Cities</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select><ExcelExportButton onClick={()=>exportExcel(filteredBanners.map(b=>({Title:b.title, City:b.city, Page:b.link, Type: b.type || 'image', Image:getBannerUrl(b.image)})), 'Banners')} /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBanners.map(b=>(
            <div key={b._id} className="relative rounded-xl overflow-hidden border border-white/10 bg-black group">
              {isVideoFile(b)? (
                <video src={getBannerUrl(b.image)} className="w-full h-36 object-cover" muted autoPlay loop playsInline />
              ) : (
                <img src={getBannerUrl(b.image)} alt={b.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-3"><p className="font-bold text-sm truncate">{b.title} {isVideoFile(b)? '🎬' : ''}</p><p className="text-xs text-white/60">{b.city} • {b.link} • {b.type || 'image'}</p></div>
              <button onClick={()=>handleDelete(b._id)} disabled={deletingId===b._id} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition">{deletingId===b._id? '...' : 'Delete'}</button>
            </div>
          ))}
        </div>
        {listLoading && <p className="text-center py-8 text-white/40">Loading banners...</p>}
        {!listLoading && filteredBanners.length===0 && <p className="text-center py-8 text-white/40">No banners in {filterCity}</p>}
      </div>
    </div>
  );
}