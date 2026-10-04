import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

export default function RatingsReviewsMonitor(){
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, low, high
  const [error, setError] = useState('');

  const loadRatings = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/ratings/list?search=${encodeURIComponent(search)}&filter=${filter}`);
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || 'Could not load ratings');
      setRatings(Array.isArray(d.ratings) ? d.ratings : []);
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
    const interval = setInterval(loadRatings, 10000);
    return () => clearInterval(interval);
  }, [search, filter]);

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this review?")) return;
    try {
      const res = await fetch(`${API_URL}/ratings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      setRatings(prev => prev.filter(x => (x._id || x.id) !== id));
    } catch(e) {
      alert(e.message);
    }
  };

  if(loading) return <div className="min-h-screen bg-black text-white p-4">Loading Ratings...</div>

  return(
    <div className="p-4 min-h-screen bg-black text-white">
      <h1 className="text-2xl font-bold mb-4">Ratings & Reviews Monitor</h1>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <input 
          placeholder="Search driver, passenger, comment" 
          value={search} 
          onChange={e=>setSearch(e.target.value)}
          className="bg-black text-white border border-white placeholder:text-white/60 p-2 w-full max-w-sm"
        />
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-black text-white border border-white p-2">
          <option value="all">All Ratings</option>
          <option value="low">Low (1-2 Stars)</option>
          <option value="high">High (4-5 Stars)</option>
          <option value="driver">Driver Ratings Only</option>
          <option value="passenger">Passenger Ratings Only</option>
        </select>
      </div>

      {error ? <div className="text-red-400 border border-red-500 p-3 rounded">{error}</div> : !ratings.length ? <div className="text-white mt-4">No Ratings Found</div> : (
        <div className="grid gap-3">
          {ratings.map((rv, i) => (
            <div key={rv._id || rv.id || i} className="border border-white p-4 rounded flex justify-between gap-4">
              <div className="flex-1">
                <div className="flex gap-3 items-center mb-2">
                  <span className="font-bold text-yellow-400">{"★".repeat(rv.stars || rv.rating || 0)}{"☆".repeat(5 - (rv.stars || rv.rating || 0))} ({rv.stars || rv.rating})</span>
                  <span className="text-sm border border-white px-2 py-0.5 rounded">{rv.type || (rv.ratedTo === 'driver' ? 'Driver Rated' : 'Passenger Rated')}</span>
                  <span className="text-sm text-white/70">{rv.createdAt ? new Date(rv.createdAt).toLocaleString() : ''}</span>
                </div>
                <p className="text-white"><span className="text-white/60">From:</span> {rv.fromName || rv.raterName || '-'} ({rv.fromRole || rv.raterRole})</p>
                <p className="text-white"><span className="text-white/60">To:</span> {rv.toName || rv.ratedName || '-'} (Trip: {rv.tripId || rv.rideId || '-'})</p>
                <p className="mt-2 text-white italic">"{rv.comment || rv.review || 'No comment'}"</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={()=>handleDelete(rv._id || rv.id)} className="border border-red-500 text-red-400 px-3 py-1 hover:bg-red-500 hover:text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}