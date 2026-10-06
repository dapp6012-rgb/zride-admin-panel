import { useEffect, useState } from "react";
import { API_BASE_URL as API_URL } from '../lib/api';
import { exportToExcel } from '../utils/exportExcel';

export default function PassengerHistory() {
  const [riders, setRiders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchRiders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rider/all`);
        if (!response.ok) throw new Error("Riders load nahi ho sake");
        const data = await response.json();
        if (active) {
          setRiders(Array.isArray(data.riders) ? data.riders : []);
          setError("");
        }
      } catch (fetchError) {
        if (active) setError(fetchError.message || "Backend se connection nahi ho raha");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRiders();
    const interval = setInterval(fetchRiders, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const filteredRiders = riders.filter(rider => {
    const q = search.toLowerCase();
    return (
      rider.name?.toLowerCase().includes(q) ||
      rider.phone?.toLowerCase().includes(q) ||
      rider.rides?.some(r =>
        r.pickup?.toLowerCase().includes(q) ||
        (r.destination || r.drop)?.toLowerCase().includes(q)
      )
    );
  });

  const handleExportExcel = () => {
    const formatted = filteredRiders.map(rider => ({
      RiderID: rider.riderId || rider.phone || '-',
      Name: rider.name || 'Rider',
      Phone: rider.phone || 'Phone unavailable',
      TotalRides: rider.totalRides || 0,
      TotalSpent: rider.totalSpent || (rider.rides || []).reduce((sum, r) => sum + (Number(r.finalFare || r.fare) || 0), 0),
      LastRide_Pickup: rider.rides?.[0]?.pickup || '-',
      LastRide_Destination: rider.rides?.[0]?.destination || rider.rides?.[0]?.drop || '-',
      LastRide_Fare: rider.rides?.[0]?.finalFare || rider.rides?.[0]?.fare || '-'
    }));
    exportToExcel(formatted, `ZRide_Riders_${search || 'All'}`);
  };

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by name, phone, pickup, destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-white/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A7E92F] text-white placeholder:text-white/50 bg-[#1a1a1a]"
        />
        <button onClick={handleExportExcel} className="shrink-0 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl text-sm font-bold">
          📥 Export
        </button>
      </div>

      {loading && <p className="text-center text-white">Loading riders...</p>}
      {!loading && error && <p className="text-center text-white">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.map((rider, i) => (
          <div key={rider.riderId || rider.phone || i} className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow p-4">
            <div className="flex items-center gap-3">
              {rider.photo ? (
                <img src={rider.photo} alt={rider.name || "Rider"} className="w-12 h-12 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center font-bold text-white">
                  {(rider.name || "R").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white">{rider.name || "Rider"}</h3>
                <p className="text-sm text-white">{rider.phone || "Phone unavailable"}</p>
              </div>
              <span className="ml-auto bg-[#A7E92F]/20 border border-[#A7E92F]/30 text-white px-3 py-1 rounded-full text-xs font-bold">
                {rider.totalRides || 0} Rides
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {(rider.rides || []).slice(0,5).map(ride => (
                <div key={ride._id} className="text-xs bg-black border border-white/10 p-2 rounded flex justify-between text-white">
                  <span className="text-white">{ride.pickup} → {ride.destination || ride.drop}</span>
                  <span className="font-bold text-white">Rs {ride.finalFare || ride.fare}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && !loading && (
        <p className="text-center text-white mt-10">No rider found</p>
      )}
    </div>
  );
}