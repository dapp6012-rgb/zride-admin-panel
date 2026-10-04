import { useState, useEffect } from 'react';
import { Activity, ArrowUpRight, MapPin, TrendingUp, Users, Car, DollarSign } from 'lucide-react';
import { Button, ScreenFrame, SectionCard, StatCard, Badge } from '../components/ControlRoom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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
  const [alerts, setAlerts] = useState([]);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [onlineRiders, setOnlineRiders] = useState([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/overview');
        const data = await res.json();
        setStats(data.stats);
        setAlerts(data.alerts || []);
        setOnlineDrivers(data.onlineDrivers || []);
        setOnlineRiders(data.onlineRiders || []);
      } catch (err) {
        setStats({ totalRides: 0, gross: 0, activeDrivers: 0, activeUsers: 0, todayRides: 0, pendingRides: 0, rideVolume: [] });
        setAlerts([]);
        setOnlineDrivers([]);
        setOnlineRiders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
    const t = setInterval(fetchDashboard, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <ScreenFrame eyebrow="Super admin / network pulse" title="Loading..."><div className="w-full h-[60vh] flex items-center justify-center text-white">Fetching live data...</div></ScreenFrame>;

  const pending = stats?.pendingRides || 0;
  const isOverloaded = pending > 5;
  const isHighDemand = (stats?.todayRides || 0) > 10 && (stats?.activeDrivers || 0) < 3;
  const isHealthy =!isOverloaded &&!isHighDemand;

  return (
    <div className="text-white">
    <ScreenFrame eyebrow="Super admin / network pulse" title="Pakistan Live Network" description={`Live tracking - ${onlineDrivers.length} drivers online across Pakistan`}
      actions={<Button variant="ghost" onClick={() => notify('Report export queued')}><ArrowUpRight size={14} /> Export CSV</Button>}
    >
      <div className="grid stats">
        <StatCard icon={<Car size={18} />} label="Total Rides Today" value={stats?.totalRides?.toString() || '0'} note={<span className="flex items-center gap-1 text-white"><TrendingUp size={12}/> Live</span>} />
        <StatCard icon={<DollarSign size={18} />} label="Gross Earnings" value={`₨ ${((stats?.gross || 0) / 1000000).toFixed(2)}m`} note="Today collected" />
        <StatCard icon={<Activity size={18} />} label="Active Drivers" value={onlineDrivers.length} note={`${onlineDrivers.length} live on map`} />
        <StatCard icon={<Users size={18} />} label="Active Riders" value={stats?.activeUsers?.toString() || '0'} note="Real-time" />
      </div>

      <div style={{ marginTop: 16 }}>
        <SectionCard title="Live network" meta={`${onlineDrivers.length} DRIVERS ONLINE - ALL PAKISTAN`}>
          <RealMap drivers={onlineDrivers} />
        </SectionCard>
      </div>

      <div className="grid two-col" style={{ marginTop: 16 }}>
        <SectionCard title="Drivers by city" meta={`${onlineDrivers.length} LIVE`}>
          <div className="py-2 text-sm space-y-2 text-white">
            {onlineDrivers.filter(d => getDriverCoordinates(d)).map((d,i)=>(
              <div key={i} className="flex justify-between text-white">
                <span>📍 {d.name}</span>
                <span className="text-white">● Live</span>
              </div>
            ))}
            {onlineDrivers.length===0 && <div className="py-6 text-center text-white">No drivers online - Waiting for real drivers</div>}
          </div>
        </SectionCard>
        <SectionCard title="Ride volume" meta="TODAY"><div className="bar-chart">{(stats?.rideVolume || []).map((v, i) => (<div className="bar" style={{ height: `${Math.min(v,100)}%` }} key={i}><span className="text-white">{i + 8}h</span></div>))}{(!stats?.rideVolume || stats.rideVolume.length===0) && <div className="text-white text-sm py-10 text-center w-full">No rides yet today</div>}</div></SectionCard>
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