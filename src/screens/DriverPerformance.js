import { useEffect, useMemo, useState } from 'react';
import { Ban, Check, Search, Star, Wallet, X } from 'lucide-react';
import { API_BASE_URL as API_URL } from '../lib/api';
import { exportToExcel } from '../utils/exportExcel';

const numberValue = value => Number(value) || 0;
const performanceScore = driver =>
  numberValue(driver.rating) * 20 +
  numberValue(driver.completedRides) * 0.5 +
  numberValue(driver.acceptance) -
  numberValue(driver.cancelledRides) * 2;

function DriverAvatar({ driver, size = 'large' }) {
  const initials = (driver.name || 'Driver')
   .trim()
   .split(/\s+/)
   .slice(0, 2)
   .map(part => part[0])
   .join('')
   .toUpperCase();

  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-[#A7E92F] font-extrabold text-black ${size === 'small'? 'h-11 w-11 text-sm' : 'h-14 w-14 text-lg'}`}>
      {initials || 'D'}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-white">{value}</p>
    </div>
  );
}

function DriverDetail({ driver, rank, onClose }) {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="driver-detail-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10110d] p-6 shadow-2xl shadow-black/60"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <DriverAvatar driver={driver} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A7E92F]">Rank #{rank}</p>
              <h2 id="driver-detail-title" className="mt-1 truncate text-xl font-extrabold text-white">{driver.name || 'Unnamed driver'}</h2>
              <p className="mt-1 text-sm text-white/55">{driver.phone || 'No phone number'}</p>
            </div>
          </div>
          <button aria-label="Close details" className="rounded-lg p-2 text-white/55 transition hover:bg-white/10 hover:text-white" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Driver ID" value={driver.driverId || '—'} />
          <Metric label="Rating" value={`${numberValue(driver.rating).toFixed(1)} / 5`} />
          <Metric label="Total rides" value={numberValue(driver.totalRides)} />
          <Metric label="Completed" value={numberValue(driver.completedRides)} />
          <Metric label="Cancelled" value={numberValue(driver.cancelledRides)} />
          <Metric label="Acceptance" value={`${numberValue(driver.acceptance)}%`} />
          <Metric label="Online hours" value={`${numberValue(driver.onlineHours)}h`} />
          <Metric label="Earnings" value={`Rs ${numberValue(driver.earnings).toLocaleString()}`} />
          <Metric label="Performance" value={performanceScore(driver).toFixed(1)} />
        </div>
      </section>
    </div>
  );
}

export default function DriverPerformance() {
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchDrivers() {
      try {
        const response = await fetch(`${API_URL}/api/driver/all`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        const data = await response.json();
        if (!Array.isArray(data.drivers)) throw new Error('Unexpected response from driver API');
        setDrivers(data.drivers);
      } catch (fetchError) {
        if (fetchError.name!== 'AbortError') setError('Unable to load drivers. Check that the API is running and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchDrivers();
    return () => controller.abort();
  }, []);

  const rankedDrivers = useMemo(
    () => [...drivers].sort((first, second) => performanceScore(second) - performanceScore(first)),
    [drivers],
  );
  const filteredDrivers = rankedDrivers
   .map((driver, index) => ({ driver, rank: index + 1 }))
   .filter(({ driver }) => {
      const query = search.trim().toLowerCase();
      return!query || driver.name?.toLowerCase().includes(query) || driver.phone?.toLowerCase().includes(query);
    });

  const handleExportExcel = () => {
    const formatted = filteredDrivers.map(({ driver, rank }) => ({
      Rank: rank,
      DriverID: driver.driverId || '-',
      Name: driver.name || 'Unnamed driver',
      Phone: driver.phone || '-',
      Rating: driver.rating,
      TotalRides: driver.totalRides,
      CompletedRides: driver.completedRides,
      CancelledRides: driver.cancelledRides,
      AcceptancePercent: driver.acceptance,
      OnlineHours: driver.onlineHours,
      Earnings: driver.earnings,
      PerformanceScore: performanceScore(driver).toFixed(2)
    }));
    exportToExcel(formatted, `ZRide_DriverPerformance_${search || 'All'}`);
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-black px-4 py-7 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#A7E92F]">City operations / drivers</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Driver performance</h1>
            <p className="mt-2 text-sm text-white/50">Ranked by completed rides, acceptance, ratings and cancellations.</p>
          </div>
          <div className="flex w-full gap-2 sm:max-w-md">
            <div className="relative w-full">
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={17} />
              <input
                aria-label="Search drivers by name or phone"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#A7E92F]"
                onChange={event => setSearch(event.target.value)}
                placeholder="Search name or phone"
                type="search"
                value={search}
              />
            </div>
            <button onClick={handleExportExcel} className="h-12 shrink-0 rounded-xl bg-green-600 hover:bg-green-700 px-4 text-sm font-bold text-white">
              📥 Export
            </button>
          </div>
        </header>

        {loading? (
          <div className="py-20 text-center text-sm font-semibold text-white/55" role="status">Loading drivers...</div>
        ) : error? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-5 py-10 text-center text-sm text-red-200" role="alert">{error}</div>
        ) : filteredDrivers.length === 0? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-16 text-center">
            <p className="text-lg font-bold text-white">No drivers found</p>
            {search && <p className="mt-2 text-sm text-white/45">Try another name or phone number.</p>}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-white/45">
              <span>{filteredDrivers.length} {filteredDrivers.length === 1? 'driver' : 'drivers'}</span>
              <span>Highest performance score first</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredDrivers.map(({ driver, rank }) => (
                <button
                  aria-label={`View details for ${driver.name || 'driver'}, rank ${rank}`}
                  className={`relative rounded-2xl border bg-[#0d0e0b] p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#A7E92F]/60 hover:bg-[#11130d] ${rank === 1? 'border-[#A7E92F]' : 'border-white/10'}`}
                  key={driver._id || driver.driverId || `${driver.name}-${rank}`}
                  onClick={() => setSelectedDriver({ driver, rank })}
                  type="button"
                >
                  {rank <= 3 && (
                    <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${rank === 1? 'bg-[#A7E92F] text-black' : 'bg-white/10 text-white/75'}`}>
                      {rank === 1? '🏆 TOP PERFORMER' : `#${rank} Best`}
                    </span>
                  )}
                  <div className="flex items-center gap-3 pr-16">
                    <DriverAvatar driver={driver} size="small" />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-extrabold text-white">{rank}. {driver.name || 'Unnamed driver'}</h2>
                      <p className="mt-1 truncate text-xs text-white/45">{driver.phone || 'No phone number'}</p>
                      <p className="mt-1 truncate font-mono text-[10px] text-white/30">ID: {driver.driverId || '—'}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-[#A7E92F]/10 px-2 py-1.5 text-xs font-extrabold text-[#A7E92F]">
                      <Star fill="currentColor" size={12} /> {numberValue(driver.rating).toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <Metric label="Total rides" value={numberValue(driver.totalRides)} />
                    <Metric label="Acceptance" value={`${numberValue(driver.acceptance)}%`} />
                    <Metric label="Online hours" value={`${numberValue(driver.onlineHours)}h`} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-[#A7E92F]"><Wallet size={14} /> Rs {numberValue(driver.earnings).toLocaleString()}</span>
                    <span className="flex items-center gap-3 text-white/50">
                      <span className="flex items-center gap-1"><Check className="text-[#A7E92F]" size={13} /> {numberValue(driver.completedRides)} Done</span>
                      <span className="flex items-center gap-1"><Ban className="text-red-400" size={13} /> {numberValue(driver.cancelledRides)} Cancel</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedDriver && (
        <DriverDetail
          driver={selectedDriver.driver}
          onClose={() => setSelectedDriver(null)}
          rank={selectedDriver.rank}
        />
      )}
    </main>
  );
}