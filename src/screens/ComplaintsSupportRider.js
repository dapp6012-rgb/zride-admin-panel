import React, { useEffect, useState, useCallback } from 'react';
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function ComplaintsSupportRider({ notify }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/complaint/all`);
      const data = await res.json();
      setComplaints(data.complaints?.filter(c => c.role === 'rider' || c.role === 'passenger') || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleResolve = async (id) => {
    if(!window.confirm("Resolve karna hai?")) return;
    setActionId(id);
    try {
      const res = await fetch(`${API_URL}/complaint/${id}/resolve`, { method: 'PUT' });
      if(!res.ok) throw new Error();
      setComplaints(prev => prev.map(c => c._id===id? {...c, status:'resolved'} : c));
      notify?.("Rider complaint resolved ✅");
    } catch { notify?.("❌ Error"); }
    finally { setActionId(null); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete karni hai?")) return;
    setActionId(id);
    try {
      const res = await fetch(`${API_URL}/complaint/${id}`, { method: 'DELETE' });
      if(!res.ok) throw new Error();
      setComplaints(prev => prev.filter(c => c._id!==id));
      notify?.("Complaint deleted 🗑️");
    } catch { notify?.("❌ Delete failed"); }
    finally { setActionId(null); }
  };

  const filteredList = complaints.filter(c => filter==='all'? true : c.status===filter);

  const handleExportExcel = () => {
    exportExcel(filteredList.map(c=>({
      TicketID: c.ticketId,
      Role: c.role,
      Type: c.type,
      Rider: `${c.passengerName || 'Rider'} (${c.passengerId || '-'})`,
      RideID: c.rideId || 'General',
      Driver: c.driverName || '-',
      Description: c.description,
      Status: c.status,
      CreatedAt: c.createdAt? new Date(c.createdAt).toLocaleString() : '-',
    })), 'Rider_Complaints');
  };

  if(loading) return <div className="min-h-screen bg-black text-white p-10 flex gap-3 items-center"><div className="w-5 h-5 border-2 border-white/10 border-t-[#A7E92F] rounded-full animate-spin" /> Loading rider complaints...</div>;

  return (
    <div className="p-6 bg-black min-h-screen text-white space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-xl font-bold">Rider Complaints ({filteredList.length})</h2>
        <div className="flex gap-2">
          <button onClick={fetchComplaints} className="px-4 py-2 rounded-xl bg-white/10 text-sm font-bold hover:bg-white/20">↻ Refresh</button>
          <ExcelExportButton onClick={handleExportExcel} />
        </div>
      </div>

      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl w-fit border border-white/10">
        {['all','pending','resolved'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase ${filter===f? 'bg-[#A7E92F] text-black' : 'text-white/60 hover:text-white'}`}>{f}</button>
        ))}
      </div>

      {filteredList.length===0? <div className="text-center py-16 bg-[#1a1a1a] rounded-xl border border-dashed border-white/10 text-white/30">No {filter} rider complaints</div>
      : <div className="grid gap-3">
        {filteredList.map(c=>(
          <div key={c._id} className="bg-[#1a1a1a] rounded-xl border border-white/10 p-4 border-l-4" style={{borderLeftColor: c.status==='resolved'? '#22c55e' : '#ef4444'}}>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2"><span className="bg-black border border-white/10 text-[#A7E92F] px-2.5 py-1 rounded-full text-[11px] font-bold">{c.ticketId}</span><span className="bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase">{c.role} - {c.type}</span></div>
              <span className="text-xs text-white/40">{new Date(c.createdAt||c.timestamp).toLocaleString()}</span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="font-bold text-sm">{c.passengerName || 'Rider'} <span className="font-normal text-white/50">({c.passengerId})</span></p>
              <p className="text-xs text-white/60">Ride: {c.rideId || 'General'} {c.driverName? `| Driver: ${c.driverName}` : ''}</p>
              <p className="mt-2 bg-black/60 p-3 rounded-lg text-sm border border-white/5">{c.description}</p>
              {c.attachments?.length>0 && <div className="flex gap-2 flex-wrap mt-2">{c.attachments.map((a,i)=>{const src=typeof a==='string'? a : a?.url||a?.uri; return src? <a key={i} href={src} target="_blank" rel="noreferrer"><img src={src} alt="" className="w-20 h-20 rounded-lg object-cover border border-white/10" /></a>:null})}</div>}
            </div>
            <div className="flex gap-2 mt-4">
              {c.status!=='resolved' && <button disabled={actionId===c._id} onClick={()=>handleResolve(c._id)} className="flex-1 bg-[#A7E92F] text-black font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{actionId===c._id? '...' : '✓ Resolve'}</button>}
              <button disabled={actionId===c._id} onClick={()=>handleDelete(c._id)} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">🗑️ Delete</button>
            </div>
            <span className={`mt-2 inline-block text-[11px] px-2.5 py-1 rounded-full font-bold uppercase ${c.status==='pending'? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>{c.status}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}