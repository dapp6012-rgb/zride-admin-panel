import { useState, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '../lib/api';
import { exportToExcel } from '../utils/exportExcel';

const SHOP_API_URL = `${API_URL}/shops`;

const getShopImageUrl = image => /^https?:\/\//i.test(image)
  ? image
  : `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

export default function AdminShopRequestsScreen({ notify }) {
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchShops = async () => {
    try {
      const res = await fetch(SHOP_API_URL);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not load shop requests');
      setShops(Array.isArray(data) ? data : data.shops || []);
      setError('');
    } catch (e) {
      console.log(e);
      setError(e.message || 'Could not connect to the backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    const refreshTimer = setInterval(fetchShops, 5000);
    return () => clearInterval(refreshTimer);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`${SHOP_API_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not update shop status');
      notify?.(`Shop ${status}`);
      await fetchShops();
    } catch (e) { alert(e.message); }
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
      SubmittedDate: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString() : 'N/A',
      SubmittedTime: shop.createdAt ? new Date(shop.createdAt).toLocaleTimeString() : 'N/A'
    }));
    exportToExcel(formatted, `ZRide_Shops_${filter}`);
  };

  const filtered = shops.filter(s => s.status === filter);

  if (loading) return <div className="p-10 text-white">Loading shop requests...</div>;

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Shop Requests</h1>
        <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
          📥 Export Excel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10"><p className="text-2xl font-bold text-white">{shops.length}</p><p className="text-xs text-white">Total</p></div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10"><p className="text-2xl font-bold text-white">{shops.filter(s=>s.status==='pending').length}</p><p className="text-xs text-white">Pending</p></div>
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/10"><p className="text-2xl font-bold text-white">{shops.filter(s=>s.status==='approved').length}</p><p className="text-xs text-white">Approved</p></div>
      </div>

      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-lg w-fit">
        {['pending','approved','rejected'].map(tab=>(
          <button key={tab} onClick={()=>setFilter(tab)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase ${filter===tab? 'bg-[#A7E92F] text-black' : 'text-white'}`}>{tab}</button>
        ))}
      </div>

      <div className="grid gap-3">
        {error && <p className="text-sm text-white">{error}</p>}
        {filtered.map(shop=>(
          <div key={shop._id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 shrink-0 bg-[#A7E92F] text-black rounded-full flex items-center justify-center font-bold">{shop.shopName?.charAt(0)}</div>
                <div className="space-y-1 text-white">
                  <p className="font-bold text-white">{shop.shopName} <span className="text-xs text-white">({shop.ownerName})</span></p>
                  <p className="text-xs text-white">Phone: {shop.phone} | City: {shop.city}</p>
                  <p className="text-xs text-white">CNIC: {shop.cnic}</p>
                  <p className="text-xs text-white">Address: {shop.address || 'Not provided'}</p>
                  <p className="text-xs text-white">Owner ID: {shop.ownerId || 'Not provided'}</p>
                  <p className="text-xs text-white">Submitted: {shop.createdAt ? new Date(shop.createdAt).toLocaleString() : 'Date unavailable'}</p>
                  {shop.shopImages?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {shop.shopImages.map((image, index) => (
                        <a key={`${image}-${index}`} href={getShopImageUrl(image)} target="_blank" rel="noreferrer">
                          <img src={getShopImageUrl(image)} alt={`${shop.shopName} shop ${index + 1}`} className="h-20 w-20 rounded-md border border-white/10 object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {shop.status==='pending' ? (
                <div className="flex h-fit gap-2">
                  <button onClick={()=>updateStatus(shop._id,'rejected')} className="px-4 py-2 rounded-lg bg-white/10 text-xs font-bold text-white">Reject</button>
                  <button onClick={()=>updateStatus(shop._id,'approved')} className="px-4 py-2 rounded-lg bg-[#A7E92F] text-black text-xs font-bold">Approve</button>
                </div>
              ) : (
                <span className="h-fit text-xs uppercase px-3 py-1 rounded-full bg-white/10 text-white">{shop.status}</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length===0 && <p className="text-center text-white py-10">No {filter} shops</p>}
      </div>
    </div>
  );
}