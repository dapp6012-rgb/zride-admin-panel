import { useEffect, useState, useMemo } from "react";
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function UsersHistory() {
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchRiders = async () => {
      try {
        const response = await fetch(`${API_URL}/rider/all`);
        if (!response.ok) throw new Error("Riders load nahi ho sake");
        const data = await response.json();
        if (active) {
          setRiders(Array.isArray(data.riders) ? data.riders : Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (fetchError) {
        if (active) setError(fetchError.message || "Backend se connection nahi ho raha");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRiders();
    const interval = setInterval(fetchRiders, 15000); // 15 sec - professional
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const filteredRiders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if(!q) return riders;
    return riders.filter(rider =>
      rider.name?.toLowerCase().includes(q) ||
      rider.phone?.toLowerCase().includes(q) ||
      rider.rides?.some(r =>
        r.pickup?.toLowerCase().includes(q) ||
        (r.destination || r.drop)?.toLowerCase().includes(q)
      )
    );
  }, [riders, search]);

  const handleExportExcel = () => {
    const formatted = filteredRiders.map(rider => ({
      Name: rider.name || 'Rider',
      Phone: rider.phone || 'Phone unavailable',
      TotalRides: rider.totalRides || 0,
      RecentRides: (rider.rides || []).slice(0, 5).map(ride => `${ride.pickup || '-'} to ${ride.destination || ride.drop || '-'} (Rs ${ride.finalFare || ride.fare || '-'})`).join('; '),
    }));
    exportExcel(formatted, `PassengerHistory_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white space-y-5">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div>
          <h1 className="text-xl font-bold">Passenger History</h1>
          <p className="text-xs text-white/50 mt-1">{filteredRiders.length} riders • Auto-refresh 15s</p>
        </div>
        <ExcelExportButton onClick={handleExportExcel} />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, phone, pickup, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3.5 pl-4 pr-10 border border-white/10 rounded-xl focus:outline-none focus:border-[#A7E92F]/50 text-white placeholder:text-white/30 bg-[#1a1a1a] text-sm"
          />
          {search && <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm">✕</button>}
        </div>
      </div>

      {loading && <div className="flex items-center gap-3 justify-center py-20"><div className="w-5 h-5 border-2 border-white/10 border-t-[#A7E92F] rounded-full animate-spin" /> <span className="text-white/50 text-sm">Loading riders...</span></div>}
      {!loading && error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-center">{error} <button onClick={()=>window.location.reload()} className="ml-2 underline font-bold">Retry</button></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRiders.map((rider, i) => (
          <div key={rider.riderId || rider._id || rider.phone || i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors group">
            <div className="flex items-center gap-3">
              {rider.photo ? (
                <img src={rider.photo} alt={rider.name || "Rider"} className="w-12 h-12 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A7E92F]/20 to-[#A7E92F]/5 border border-[#A7E92F]/20 flex items-center justify-center font-black text-[#A7E92F]">
                  {(rider.name || "R").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white truncate group-hover:text-[#A7E92F] transition-colors">{rider.name || "Rider"}</h3>
                <p className="text-xs text-white/50 truncate">{rider.phone || "Phone unavailable"}</p>
              </div>
              <span className="ml-auto bg-[#A7E92F] text-black px-3 py-1 rounded-full text-xs font-black shrink-0">
                {rider.totalRides || rider.rides?.length || 0} Rides
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {(rider.rides || []).slice(0,5).map(ride => (
                <div key={ride._id || ride.id || Math.random()} className="text-xs bg-black border border-white/5 p-2.5 rounded-xl flex justify-between gap-2">
                  <span className="text-white/70 truncate">{ride.pickup || '-'} → {ride.destination || ride.drop || '-'}</span>
                  <span className="font-bold text-[#A7E92F] shrink-0">Rs {ride.finalFare || ride.fare || 0}</span>
                </div>
              ))}
              {(rider.rides || []).length === 0 && <p className="text-xs text-white/20 text-center py-3">No rides yet</p>}
            </div>
          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && !loading && !error && (
        <div className="text-center mt-10 bg-[#1a1a1a] border border-dashed border-white/10 rounded-2xl p-12">
          <p className="text-white/30">No rider found {search && `for "${search}"`}</p>
          {search && <button onClick={()=>setSearch('')} className="mt-3 text-sm text-[#A7E92F] underline">Clear search</button>}
        </div>
      )}
    </div>
  );
}