import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

const SHOP_API_URL = `${API_URL}/shops`;

// Professional image handler - null safe
const getShopImageUrl = (image) => {
  if (!image || typeof image!== 'string') return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith('/')? '' : '/'}${image}`;
};

export default function AdminShopRequestsScreen({ notify }) {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch(SHOP_API_URL);
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Could not load shop requests');
      const list = Array.isArray(data)? data : data.shops || data.data || [];
      setShops(list);
      setError('');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Could not connect to the backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
    const refreshTimer = setInterval(fetchShops, 7000);
    return () => clearInterval(refreshTimer);
  }, [fetchShops]);

  const updateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this shop?`)) return;

    setActionId(id);
    try {
      const response = await fetch(`${SHOP_API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || 'Could not update shop status');

      notify?.(`Shop ${status} successfully ✅`);
      await fetchShops();
    } catch (e) {
      notify?.(`Error: ${e.message}`);
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rejected shop permanently? This cannot be undone.')) return;
    setActionId(id);
    try {
      const res = await fetch(`${SHOP_API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Delete failed');
      notify?.('Shop deleted permanently 🗑️');
      await fetchShops();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleExportExcel = () => {
    const formatted = filtered.map(shop => ({
      ShopID: shop._id,
      ShopName: shop.shopName,
      OwnerName: shop.ownerName,
      Phone: shop.phone,
      City: shop.city,
      CNIC: shop.cnic,
      Address: shop.address || 'Not provided',
      OwnerID: shop.ownerId || 'Not provided',
      Status: shop.status,
      SubmittedDate: shop.createdAt? new Date(shop.createdAt).toLocaleDateString() : 'N/A',
      SubmittedTime: shop.createdAt? new Date(shop.createdAt).toLocaleTimeString() : 'N/A',
      Images: (shop.shopImages || []).map(image => getShopImageUrl(image)).join(', '),
    }));
    exportExcel(formatted, 'AdminShopRequests');
  };

  const filtered = shops.filter(s => s.status === filter);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#A7E92F] rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Loading shop requests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Shop Requests</h1>
          <p className="text-xs text-white/60 mt-1">Manage merchant shop verifications</p>
        </div>
        <ExcelExportButton onClick={handleExportExcel} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
          <p className="text-2xl font-bold text-white">{shops.length}</p>
          <p className="text-xs text-white/60">Total</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
          <p className="text-2xl font-bold text-yellow-400">{shops.filter(s=>s.status==='pending').length}</p>
          <p className="text-xs text-white/60">Pending</p>
        </div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10">
          <p className="text-2xl font-bold text-green-400">{shops.filter(s=>s.status==='approved').length}</p>
          <p className="text-xs text-white/60">Approved</p>
        </div>
      </div>

      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl w-fit border border-white/5">
        {['pending','approved','rejected'].map(tab=>(
          <button
            key={tab}
            onClick={()=>setFilter(tab)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filter===tab? 'bg-[#A7E92F] text-black shadow' : 'text-white/70 hover:text-white'}`}
          >
            {tab} ({shops.filter(s=>s.status===tab).length})
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {error && <p className="text-sm bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg">{error}</p>}

        {filtered.map(shop=>(
          <div key={shop._id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 shrink-0 bg-[#A7E92F] text-black rounded-full flex items-center justify-center font-bold text-lg">
                  {shop.shopName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="space-y-1 text-white">
                  <p className="font-bold text-white">{shop.shopName} <span className="text-xs text-white/60 font-normal">({shop.ownerName})</span></p>
                  <p className="text-xs text-white/80">📞 {shop.phone} | 🏙️ {shop.city}</p>
                  <p className="text-xs text-white/80">🪪 CNIC: {shop.cnic}</p>
                  <p className="text-xs text-white/60">📍 {shop.address || 'Not provided'}</p>
                  <p className="text-xs text-white/40">Owner ID: {shop.ownerId || 'N/A'} | {shop.createdAt? new Date(shop.createdAt).toLocaleString() : 'Date unavailable'}</p>

                  {shop.shopImages?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {shop.shopImages.map((image, index) => {
                        const url = getShopImageUrl(image);
                        if(!url) return null;
                        return (
                          <a key={`${shop._id}-${index}`} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`${shop.shopName} ${index + 1}`} className="h-20 w-20 rounded-lg border border-white/10 object-cover hover:scale-105 transition-transform" />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                {shop.status==='pending'? (
                  <div className="flex h-fit gap-2">
                    <button
                      disabled={actionId === shop._id}
                      onClick={()=>updateStatus(shop._id,'rejected')}
                      className="px-4 py-2 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50 min-w-[70px]"
                    >
                      {actionId === shop._id? '...' : 'Reject'}
                    </button>
                    <button
                      disabled={actionId === shop._id}
                      onClick={()=>updateStatus(shop._id,'approved')}
                      className="px-4 py-2 rounded-lg bg-[#A7E92F] text-black text-xs font-bold hover:bg-[#96d42a] disabled:opacity-50 min-w-[70px]"
                    >
                      {actionId === shop._id? '...' : 'Approve'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className={`h-fit text-[11px] uppercase px-3 py-1.5 rounded-full font-bold tracking-wider ${shop.status==='approved'? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                      {shop.status === 'approved'? '✅ Approved' : '❌ Rejected'}
                    </span>
                    {shop.status === 'rejected' && (
                      <button
                        disabled={actionId === shop._id}
                        onClick={() => handleDelete(shop._id)}
                        className="px-3 py-1.5 rounded-full bg-red-900/30 text-red-400 text-[11px] font-bold border border-red-900/50 hover:bg-red-900/50 disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length===0 && (
          <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-dashed border-white/10">
            <p className="text-white/40">No {filter} shops found</p>
          </div>
        )}
      </div>
    </div>
  );
}