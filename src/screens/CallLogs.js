import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

export default function CallLogs(){
  const [logs,setLogs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [error,setError]=useState('');
  const [refreshKey,setRefreshKey]=useState(0);

  useEffect(()=>{
    let active=true;
    const load = async () =>{
      try {
        const r = await fetch(`${API_URL}/call-logs/list?search=${encodeURIComponent(search)}`);
        const d = await r.json();
        if (!r.ok || !d.success) throw new Error(d.message || 'Could not load call logs');
        if (active) {
          setLogs(Array.isArray(d.logs) ? d.logs : []);
          setError('');
        }
      } catch (e) {
        if (active) setError(e.message || 'Could not load call logs');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval=setInterval(load,10000);
    return ()=>{ active=false; clearInterval(interval); };
  },[search,refreshKey]);

  if(loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return(
    <div className="p-4 min-h-screen bg-black text-white">
      <input 
        placeholder="Search call logs" 
        value={search} 
        onChange={e=>setSearch(e.target.value)}
        className="bg-black text-white border border-white placeholder:text-white/60 p-2 w-full max-w-sm"
      />
      {error ? <div role="alert" className="text-white mt-4">{error}</div> : !logs.length ? <div className="text-white mt-4">No Call Logs Found</div> : (
        <table className="w-full mt-4 border border-white text-white">
          <thead><tr><th className="border border-white p-2 text-white">Trip ID</th><th className="border border-white p-2 text-white">Caller</th><th className="border border-white p-2 text-white">Receiver</th><th className="border border-white p-2 text-white">Phone</th><th className="border border-white p-2 text-white">Time</th></tr></thead>
          <tbody>
            {logs.map((l,i)=>(
              <tr key={l._id || l.id || i} className="border-t border-white">
                <td className="border border-white p-2 text-white">{l.tripId}</td>
                <td className="border border-white p-2 text-white">{l.callerRole}{l.callerId ? ` (${l.callerId})` : ''}</td>
                <td className="border border-white p-2 text-white">{l.receiverName || l.receiverId || '-'}</td>
                <td className="border border-white p-2 text-white">{l.number || '-'}</td>
                <td className="border border-white p-2 text-white">{l.clickedAt ? new Date(l.clickedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}