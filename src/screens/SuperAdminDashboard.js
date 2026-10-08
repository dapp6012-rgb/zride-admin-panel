import { useState, useEffect } from 'react';
import { Activity, MapPin, TrendingUp, Users, Car, DollarSign } from 'lucide-react';
import { ScreenFrame, SectionCard, StatCard, Badge } from '../components/ControlRoom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// REAL DATA FILTER - DUMMY HATAO
function cleanRealList(list) {
  const dummyKeywords = ['dummy', 'test', 'fake', 'demo', 'unknown', 'null', 'undefined', 'sample', 'all country', 'all city'];
  return [...new Set(
    (list || [])
     .map(v => String(v || '').trim())
     .filter(v => v.length > 1)
     .filter(v =>!dummyKeywords.includes(v.toLowerCase()))
     .filter(v =>!/^city\d+$/i.test(v))
     .filter(v =>!/^country\d+$/i.test(v))
  )].sort();
}

function getDriverCoordinates(driver) {
  const values = [
    driver,
    driver?.location,
    driver?.currentLocation,
    driver?.lastLocation,
    driver?.position,
    driver?.coordinates,
    driver?.coords,
  ];

  for (const value of values) {
    if (Array.isArray(value) && value.length >= 2) {
      const lng = Number(value[0]);
      const lat = Number(value[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    if (value && typeof value === 'object') {
      const lat = Number(value.lat?? value.latitude?? value.y);
      const lng = Number(value.lng?? value.lon?? value.longitude?? value.x);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }

      if (Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
        const geoLng = Number(value.coordinates[0]);
        const geoLat = Number(value.coordinates[1]);
        if (Number.isFinite(geoLat) && Number.isFinite(geoLng) && geoLat >= -90 && geoLat <= 90 && geoLng >= -180 && geoLng <= 180) {
          return { lat: geoLat, lng: geoLng };
        }
      }
    }
  }

  return null;
}

function RealMap({ drivers }) {
  const pakistanCenter = [30.3753, 69.3451];

  const greenDotIcon = L.divIcon({
    className: 'custom-green-dot',
    html: `
      <div style="position:relative; width:20px; height:20px;">
        <div style="position:absolute; width:20px; height:20px; background:#10b981; border-radius:50%; opacity:0.4; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="position:absolute; top:4px; left:4px; width:12px; height:12px; background:#10b981; border:2px solid white; border-radius:50%; box-shadow:0 0 10px #10b981;"></div>
      </div>
      <style>@keyframes ping { 75%, 100% { transform: scale(2.8); opacity: 0; } }</style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <div style={{ height: '650px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
      <MapContainer center={pakistanCenter} zoom={5.5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {drivers.map((d, i) => {
          const coordinates = getDriverCoordinates(d);
          if (!coordinates) return null;
          return (
          <Marker key={`${d._id || d.id || i}-${coordinates.lat}-${coordinates.lng}`} position={[coordinates.lat, coordinates.lng]} icon={greenDotIcon}>
            <Tooltip direction="top" offset={[0, -10]}><b>{d.name}</b> ● LIVE</Tooltip>
            <Popup>
              <b style={{color:'#10b981'}}>📍 {d.name}</b><br/>
              Status: <b style={{color:'#10b981'}}>● Online</b><br/>
              <small>{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</small>
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
    </div>
  )
}

export default function SuperAdminDashboard({ notify, setScreen }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    async function fetchDashboard() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const params = new URLSearchParams();
        if (selectedCity) params.set('city', selectedCity);
        if (selectedCountry) params.set('country', selectedCountry);
        const query = params.toString();
        const res = await fetch(`${API_URL}/super-admin/dashboard-stats${query? `?${query}` : ''}`);
        if (!res.ok) throw new Error(`Dashboard request failed (${res.status})`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Dashboard data unavailable');
        if (active) {
          setStats(data.stats);
          // SIRF REAL CITY/COUNTRY SHOW HOGA - DUMMY FILTER
          setCities(cleanRealList(data.cities));
          setCountries(cleanRealList(data.countries));
          setLiveDrivers(Array.isArray(data.liveDrivers)? data.liveDrivers.filter(d => {
            const city = String(d.city || '').toLowerCase();
            const country = String(d.country || '').toLowerCase();
            return!['dummy','test','fake','demo'].includes(city) &&!['dummy','test','fake','demo'].includes(country);
          }) : []);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message || 'Dashboard data unavailable');
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    }
    fetchDashboard();
    const t = setInterval(fetchDashboard, 10000);
    return () => { active = false; clearInterval(t); };
  }, [selectedCity, selectedCountry]);

  const handleExportExcel = () => {
    if (!stats) return;
    const summary = [{
      City: selectedCity || 'All',
      Country: selectedCountry || 'All',
      TotalRidesToday: stats.totalRides,
      GrossCollectedToday: stats.gross,
      ActiveDrivers: stats.activeDrivers,
      ActiveRiders: stats.activeUsers,
      PendingRides: stats.pendingRides
    }];
    const driversSheet = liveDrivers.map(d => ({
      DriverID: d.driverId,
      Name: d.name,
      City: d.city,
      Country: d.country,
      Lat: d.lat,
      Lng: d.lng,
      LocationUpdatedAt: d.locationUpdatedAt
    }));
    const combined = [...summary,...driversSheet];
    exportExcel(combined, 'SuperAdminDashboard');
  };

  if (loading &&!stats) return <ScreenFrame eyebrow="Super admin / network pulse" title="Loading..."><div className="w-full h-[60vh] flex items-center justify-center text-white">Fetching live data...</div></ScreenFrame>;

  const pending = stats?.pendingRides?? 0;
  const isOverloaded = pending > 5;
  const isHighDemand = (stats?.todayRides || 0) > 10 && (stats?.activeDrivers || 0) < 3;
  const isHealthy =!isOverloaded &&!isHighDemand;
  const rideVolume = stats?.rideVolume || [];
  const maxHourlyRides = Math.max(1,...rideVolume.map(value => Number(value.rides || 0)));

  return (
    <div className="text-white">
    <ScreenFrame eyebrow="Super admin / network pulse" title="Pakistan Live Network" description={`Live tracking - ${liveDrivers.length} drivers online${selectedCity? ` in ${selectedCity}` : ' across all cities'}`}
      actions={<div className="flex flex-wrap items-center gap-2">
        <select aria-label="Filter by country" value={selectedCountry} onChange={event => setSelectedCountry(event.target.value)} className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white">
          <option value="">All countries</option>
          {countries.map(country => <option key={country} value={country}>{country}</option>)}
        </select>
        <select aria-label="Filter by city" value={selectedCity} onChange={event => setSelectedCity(event.target.value)} className="rounded-md border border-white/20 bg-black px-3 py-2 text-sm text-white">
          <option value="">All cities</option>
          {cities.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
        {/* EXPORT CSV BUTTON HATA DIYA HAI - SIRF EXCEL RAHEGA */}
        <ExcelExportButton onClick={handleExportExcel} disabled={!stats} />
      </div>}
    >
      {error && <div role="status" className="mb-3 rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</div>}
      <div className="grid stats">
        <StatCard icon={<Car size={18} />} label="Total Rides Today" value={stats? Number(stats.totalRides || 0).toLocaleString() : '—'} note={<span className="flex items-center gap-1 text-white"><TrendingUp size={12}/> Live</span>} />
        <StatCard icon={<DollarSign size={18} />} label="Gross Earnings" value={stats? `₨ ${Number(stats.gross || 0).toLocaleString()}` : '—'} note="Today collected" />
        <StatCard icon={<Activity size={18} />} label="Active Drivers" value={stats? Number(stats.activeDrivers || 0).toLocaleString() : '—'} note={`${liveDrivers.length} live on map`} />
        <StatCard icon={<Users size={18} />} label="Active Riders" value={stats? Number(stats.activeUsers || 0).toLocaleString() : '—'} note="Online now" />
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Live network" meta={`${liveDrivers.length} DRIVERS ONLINE${selectedCountry? ` - ${selectedCountry.toUpperCase()}` : ''}`}>
          <RealMap drivers={liveDrivers} />
        </SectionCard>
      </div>

      <div className="grid two-col" style={{ marginTop: 16 }}>
        <SectionCard title="Drivers by city" meta={`${liveDrivers.length} LIVE`}>
          <div className="py-2 text-sm space-y-2 text-white">
            {liveDrivers.filter(d => getDriverCoordinates(d)).map((d,i)=>(
              <div key={i} className="flex justify-between text-white">
                <span>📍 {d.name} · {d.city || d.country || 'Location available'}</span>
                <span className="text-white">● Live</span>
              </div>
            ))}
            {liveDrivers.length===0 && <div className="py-6 text-center text-white">No drivers online - Waiting for recent location updates</div>}
          </div>
        </SectionCard>
        <SectionCard title="Ride volume" meta="TODAY"><div className="bar-chart">{rideVolume.map(value => (<div className="bar" style={{ height: `${value.rides? Math.max(4, Number(value.rides) / maxHourlyRides * 100) : 0}%` }} key={value.hour}><span className="text-white">{String(value.hour).padStart(2, '0')}h</span></div>))}{rideVolume.length===0 && <div className="text-white text-sm py-10 text-center w-full">No ride volume data</div>}</div></SectionCard>
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="System posture" meta={isHealthy? "HEALTHY" : pending > 0? "BUSY" : "IDLE"}>
          <div className="activity text-white">
            <div className="activity-row"><Activity size={16} color="#ffffff" /><div><strong className="text-white">{isOverloaded? "High load - Need drivers" : "All services operational"}</strong><small className="text-white">Dispatch, Payments, SOS · {pending} pending</small></div></div>
            <div className="activity-row"><MapPin size={16} color="#ffffff" /><div><strong className="text-white">{isHighDemand? "High demand zone detected" : "Normal demand - All Pakistan"}</strong><small className="text-white">{isHighDemand? "Check Zone Management" : "All zones balanced"}</small></div></div>
            <Badge tone={isHealthy? "good" : "warn"}>{isHealthy? "System Healthy" : "System Busy"}</Badge>
          </div>
        </SectionCard>
      </div>
    </ScreenFrame>
    </div>
  );
}