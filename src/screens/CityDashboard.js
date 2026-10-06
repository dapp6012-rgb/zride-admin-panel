import { useCallback, useEffect, useState } from 'react';
import { Button, MiniMap, ScreenFrame, SectionCard, StatCard, Badge } from '../components/ControlRoom';
import { API_URL } from '../lib/api';
import { exportToExcel } from '../utils/exportExcel';

export default function CityDashboard({ notify }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/zones`);
      if (!res.ok) throw new Error(`City list failed (${res.status})`);
      const data = await res.json();
      const zones = Array.isArray(data.zones)? data.zones : [];
      const cityList = [...new Set(zones.map((zone) => {
        const isLegacyCity = zone.countryId && zone.country && zone.city === 'Karachi' && zone.name!== 'Karachi';
        return (isLegacyCity? zone.name : zone.city || zone.name)?.trim();
      }).filter(Boolean))].sort((a, b) => a.localeCompare(b));

      if (cityList.length > 0) {
        setCities(cityList);
        setSelectedCity((current) => cityList.includes(current)? current : cityList[0]);
      } else {
        setCities([]);
        setSelectedCity('');
      }
    } catch (err) {
      console.log('City list error:', err.message);
      setCities([]);
    }
  }, []);

  const fetchCityStats = useCallback(async (city) => {
    if (!city) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/analytics?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`Analytics failed (${res.status})`);
      const data = await res.json();
      setStats({...data, cityName: city });
    } catch (err) {
      console.error('City dashboard failed:', err);
      notify?.(`Failed to load ${city} data`, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  useEffect(() => {
    if (!selectedCity) return;
    fetchCityStats(selectedCity);
    const interval = setInterval(() => fetchCityStats(selectedCity), 10000);
    return () => clearInterval(interval);
  }, [selectedCity, fetchCityStats]);

  const ridesToday = stats?.totalTrips?? 0;
  const onlineDrivers = stats?.activeDrivers?? 0;
  const cityEarnings = stats?.totalRevenue?? 0;
  const openIncidents = stats?.openIncidents?? 0;
  const dispatchSuccess = stats?.dispatchSuccess?? 0;
  const pickupTime = stats?.medianPickupTime?? 0;
  const rating = stats?.avgRating?? 0;

  const handleExportExcel = () => {
    if (!stats) return;
    const formatted = [{
      City: selectedCity,
      RidesToday: ridesToday,
      OnlineDrivers: onlineDrivers,
      CityEarnings_Total: cityEarnings,
      CityEarnings_Millions: (cityEarnings / 1000000).toFixed(2),
      OpenIncidents: openIncidents,
      DispatchSuccessPercent: dispatchSuccess,
      MedianPickupMinutes: pickupTime,
      AvgRating: rating,
      Mode: stats.mode || '-',
      LastUpdated: new Date().toLocaleString()
    }];
    exportToExcel(formatted, `ZRide_City_${selectedCity}_${new Date().toISOString().slice(0,10)}`);
  };

  if (!loading && cities.length === 0) {
    return (
      <div className="text-white min-h-screen bg-black p-8" style={{ color: '#fff' }}>
        <h2 style={{ color: '#fff' }}>No City Added</h2>
        <p style={{ color: '#aaa' }}>Admin panel se pehle city add karo, tabhi yahan list ayegi.</p>
        <Button variant="primary" onClick={fetchCities}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen bg-black" style={{ color: '#FFFFFF', backgroundColor: '#000000' }}>
      <ScreenFrame
        eyebrow={selectedCity? `City admin / ${selectedCity}` : 'City admin'}
        title={selectedCity? `${selectedCity}, on the move.` : 'Select a city'}
        description={`Your city pulse since midnight. Last updated: ${new Date().toLocaleTimeString()}${stats?.mode!== 'mongodb'? ' • ' + (stats?.mode || 'loading') : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ background: '#1a1a1a', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
            >
              <option value="" disabled style={{ background: '#000' }}>Select City</option>
              {cities.map((c, idx) => {
                const cityName = typeof c === 'string'? c : c.name;
                return <option key={idx} value={cityName} style={{ background: '#000' }}>{cityName}</option>;
              })}
            </select>
            <button onClick={handleExportExcel} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>📥 Export Excel</button>
          </div>
        }
      >
        {loading &&!stats? (
          <div className="grid stats">
            <StatCard label="Rides today" value="..." note="Loading..." />
            <StatCard label="Online drivers" value="..." note="Loading..." />
            <StatCard label="City earnings" value="..." note="Loading..." />
            <StatCard label="Open incidents" value="..." note="Loading..." />
          </div>
        ) : (
          <>
            <div className="grid stats">
              <StatCard label="Rides today" value={Number(ridesToday).toLocaleString()} note={`${selectedCity} real count`} />
              <StatCard label="Online drivers" value={Number(onlineDrivers).toLocaleString()} note={`${selectedCity} active now`} />
              <StatCard label="City earnings" value={`₨ ${(cityEarnings / 1000000).toFixed(2)}m`} note={`Total: Rs. ${Number(cityEarnings).toLocaleString()}`} />
              <StatCard label="Open incidents" value={String(openIncidents).padStart(2, '0')} note={openIncidents > 0? `${openIncidents} open` : "All clear"} />
            </div>
            <div className="grid two-col">
              <SectionCard title="Local live view" meta={`${selectedCity.toUpperCase()} • REAL-TIME`}>
                <MiniMap label={`${selectedCity.toUpperCase()} / CITY DESK`} pins={onlineDrivers > 0? Math.min(onlineDrivers, 50) : 0} />
                <p style={{ marginTop: 12, fontSize: 12, color: '#FFFFFF' }}>{onlineDrivers} drivers online in {selectedCity} • {ridesToday} trips today</p>
              </SectionCard>
              <SectionCard title="City health" meta="REAL DATA">
                <div className="activity">
                  <div className="activity-row">
                    <Badge tone={dispatchSuccess >= 90? "good" : "warn"}><span style={{ color: '#FFFFFF' }}>{dispatchSuccess}%</span></Badge>
                    <div><strong style={{ color: '#FFFFFF' }}>Dispatch success</strong><small style={{ color: '#FFFFFF' }}>Real: {ridesToday} completed</small></div>
                  </div>
                  <div className="activity-row">
                    <Badge tone={pickupTime > 15? "warn" : "good"}><span style={{ color: '#FFFFFF' }}>{pickupTime || 0} min</span></Badge>
                    <div><strong style={{ color: '#FFFFFF' }}>Median pickup time</strong><small style={{ color: '#FFFFFF' }}>Real avg from DB</small></div>
                  </div>
                  <div className="activity-row">
                    <Badge tone="good"><span style={{ color: '#FFFFFF' }}>{rating || 0} / 5</span></Badge>
                    <div><strong style={{ color: '#FFFFFF' }}>Customer rating</strong><small style={{ color: '#FFFFFF' }}>Real rating avg</small></div>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </ScreenFrame>
    </div>
  );
}