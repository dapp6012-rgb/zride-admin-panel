import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState('');

  // Debounce search - 500ms wait
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const r = await fetch(`${API_URL}/call-logs/list?search=${encodeURIComponent(debouncedSearch)}`);
      const d = await r.json();
      if (!r.ok || d.success === false) throw new Error(d.message || 'Could not load call logs');
      setLogs(Array.isArray(d.logs)? d.logs : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load call logs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchLogs(true);
    const interval = setInterval(() => fetchLogs(false), 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleExportExcel = () => {
    const formatted = logs.map(l => ({
      TripID: l.tripId || '-',
      CallerRole: l.callerRole || '-',
      CallerID: l.callerId || '-',
      ReceiverName: l.receiverName || '-',
      ReceiverID: l.receiverId || '-',
      Phone: l.number || '-',
      Time: l.clickedAt? new Date(l.clickedAt).toLocaleString() : '-',
    }));
    exportExcel(formatted, `CallLogs_${debouncedSearch || 'All'}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-white/10 border-t-[#A7E92F] rounded-full animate-spin" />
        Loading call logs...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-black text-white space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Call Logs</h1>
          <p className="text-xs text-white/50 mt-1">Real-time driver/rider call tracking • {logs.length} logs</p>
        </div>
        <ExcelExportButton onClick={handleExportExcel} />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <input
            placeholder="Search by Trip ID, Caller, Receiver, Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] text-white border border-white/10 placeholder:text-white/30 p-3 rounded-xl outline-none focus:border-[#A7E92F]/50 text-sm"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm">✕</button>}
        </div>
        <button onClick={() => fetchLogs(true)} className="px-4 py-3 rounded-xl bg-white/10 text-sm font-bold hover:bg-white/20">↻ Refresh</button>
      </div>

      {error? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">{error}</div>
      ) : logs.length === 0? (
        <div className="bg-[#1a1a1a] border border-dashed border-white/10 rounded-xl p-10 text-center text-white/30">No Call Logs Found {debouncedSearch && `for "${debouncedSearch}"`}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 border-b border-white/10 text-white/50">
                <tr>
                  <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Trip ID</th>
                  <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Caller</th>
                  <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Receiver</th>
                  <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Phone</th>
                  <th className="p-3.5 font-medium text-xs uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((l, i) => (
                  <tr key={l._id || l.id || i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-3.5 font-mono text-xs">{l.tripId || '-'}</td>
                    <td className="p-3.5"><span className="px-2 py-1 rounded-full bg-[#A7E92F]/15 text-[#A7E92F] text-xs font-bold">{l.callerRole || '-'}</span><span className="ml-2 text-xs text-white/60">{l.callerId || ''}</span></td>
                    <td className="p-3.5 text-white/80">{l.receiverName || l.receiverId || '-'}</td>
                    <td className="p-3.5 font-mono text-white/80">{l.number || '-'}</td>
                    <td className="p-3.5 text-xs text-white/50">{l.clickedAt? new Date(l.clickedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}