import React, { useState, useEffect } from 'react';
import { API_URL, BASE_URL } from '../config';

export default function TruckVerificationScreen() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/truck-verifications`, {
        headers: { 'bypass-tunnel-reminder': 'true' }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || data.verifications || [];
        setVerifications(list);
        localStorage.setItem('truckVerifications', JSON.stringify(list));
      } else {
        const local = localStorage.getItem('truckVerifications');
        if (local) setVerifications(JSON.parse(local));
      }
    } catch (e) {
      const local = localStorage.getItem('truckVerifications');
      if (local) setVerifications(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(fetchVerifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // ===== REAL ACCEPT / REJECT + SYNC WITH APP =====
  const updateStatus = async (id, newStatus) => {
    const prev = [...verifications];
    // Optimistic update
    setVerifications(prev.map(v => (v.id === id || v._id === id) ? { ...v, status: newStatus } : v));

    try {
      // 1. Backend update
      await fetch(`${API_URL}/truck-verifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
        body: JSON.stringify({ status: newStatus })
      });

      // 2. Local storage update for website
      const local = localStorage.getItem('truckVerifications');
      if (local) {
        const list = JSON.parse(local);
        const updated = list.map(v => (v.id === id || v._id === id) ? { ...v, status: newStatus } : v);
        localStorage.setItem('truckVerifications', JSON.stringify(updated));
      }

      // 3. IMPORTANT: App ke liye global status save karo - taake TruckAccountStatusScreen auto update ho
      // Agar tum Firebase/Socket use kar rahe ho to wahan emit karo
      // Yahan hum ek extra key bana rahe hain jo App polling karega
      const verifiedItem = verifications.find(v => (v.id === id || v._id === id));
      if (verifiedItem) {
        const syncData = {
          ...verifiedItem,
          status: newStatus,
          verifiedAt: new Date().toISOString(),
          nextScreen: newStatus === 'Approved' ? 'TruckDashboard' : 'RoleSelectScreen'
        };
        localStorage.setItem(`truck_verification_status_${verifiedItem.userId || verifiedItem.cnic}`, JSON.stringify(syncData));
      }

      alert(`Verification ${newStatus}! App me TruckAccountStatusScreen auto update hoga.`);
      setSelected(null);
      fetchVerifications();

    } catch (e) {
      setVerifications(prev);
      alert('Failed: ' + e.message);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    if (typeof img === 'object' && img.uri) img = img.uri;
    if (typeof img !== 'string') return '';
    if (img.startsWith('http') || img.startsWith('file://') || img.startsWith('data:')) return img;
    return `${BASE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  const filtered = verifications.filter(v => {
    const matchSearch = `${v.driverName} ${v.truckNumber} ${v.cnic} ${v.phone}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || v.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'Pending').length,
    approved: verifications.filter(v => v.status === 'Approved').length,
    rejected: verifications.filter(v => v.status === 'Rejected').length,
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B0A2A]"></div><p className="ml-3 text-gray-500">Loading...</p></div>;
  }

  return (
    <div className="p-6 bg-[#F8F8F8] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Truck Driver Verifications</h1>
        <button onClick={fetchVerifications} className="bg-[#9B0A2A] text-white px-4 py-2 rounded-lg">Refresh</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">Total: <b>{stats.total}</b></div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow border-l-4 border-yellow-500">Pending: <b>{stats.pending}</b></div>
        <div className="bg-green-50 p-4 rounded-xl shadow border-l-4 border-green-500">Approved: <b>{stats.approved}</b></div>
        <div className="bg-red-50 p-4 rounded-xl shadow border-l-4 border-red-500">Rejected: <b>{stats.rejected}</b></div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-4">
        <input type="text" placeholder="Search driver, truck, CNIC..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-4 py-2 outline-none" />
        <div className="flex gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-semibold ${filter === f ? 'bg-[#9B0A2A] text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left p-4 text-sm text-gray-500">Driver</th><th className="text-left p-4 text-sm text-gray-500">Truck</th><th className="text-left p-4 text-sm text-gray-500">CNIC / Phone</th><th className="text-left p-4 text-sm text-gray-500">Status</th><th className="text-left p-4 text-sm text-gray-500">Action</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan="5" className="text-center p-10 text-gray-400">No requests</td></tr> : filtered.map(item => (
              <tr key={item.id || item._id} className="border-b hover:bg-gray-50">
                <td className="p-4"><div className="font-bold">{item.driverName}</div><div className="text-xs text-gray-500">{item.city}</div></td>
                <td className="p-4 font-semibold">{item.truckNumber}</td>
                <td className="p-4"><div className="text-sm">{item.cnic}</div><div className="text-xs text-gray-500">{item.phone}</div></td>
                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : item.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span></td>
                <td className="p-4"><div className="flex gap-2">
                  <button onClick={() => setSelected(item)} className="bg-gray-100 px-3 py-1 rounded-lg text-sm">View</button>
                  {item.status === 'Pending' && <>
                    <button onClick={() => updateStatus(item.id || item._id, 'Approved')} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">Approve → Dashboard</button>
                    <button onClick={() => updateStatus(item.id || item._id, 'Rejected')} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm">Reject → RoleSelect</button>
                  </>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{selected.driverName} - {selected.truckNumber}</h2><button onClick={() => setSelected(null)} className="text-2xl">×</button></div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><b>Driver:</b> {selected.driverName}</div><div><b>Truck:</b> {selected.truckNumber}</div><div><b>CNIC:</b> {selected.cnic}</div><div><b>Phone:</b> {selected.phone}</div><div><b>City:</b> {selected.city}</div><div><b>Status:</b> {selected.status}</div>
            </div>
            <h3 className="font-bold mt-4 mb-2">Documents:</h3>
            <div className="grid grid-cols-3 gap-4">
              {selected.images && Object.entries(selected.images).map(([key, url]) => url && <div key={key} className="border rounded-lg p-2"><p className="text-xs font-semibold capitalize">{key}</p><img src={getImageUrl(url)} alt={key} className="w-full h-32 object-cover rounded" /></div>)}
            </div>
            {selected.status === 'Pending' && (
              <div className="flex gap-3 mt-6">
                <button onClick={() => updateStatus(selected.id || selected._id, 'Approved')} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">✓ Approve → Open TruckDashboard in App</button>
                <button onClick={() => updateStatus(selected.id || selected._id, 'Rejected')} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">✕ Reject → Open RoleSelectScreen in App</button>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full mt-3 bg-gray-100 py-3 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}