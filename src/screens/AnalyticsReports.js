import React, { useEffect, useState, useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

const CHART_COLORS = ['#A7E92F', '#2878B5', '#D99424', '#C74D4D', '#7665A8'];
const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function AnalyticsReport() {
  const [stats, setStats] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // City list - only once
  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/analytics/cities`)
     .then(r => r.ok? r.json() : Promise.reject(`City list ${r.status}`))
     .then(d => { if (active && d.success) setCities(Array.isArray(d.cities)? d.cities : []); })
     .catch(() => { if (active) setCities([]); });
    return () => { active = false; };
  }, []); // <-- FIX: empty dependency

  // Analytics data
  useEffect(() => {
    let active = true;
    const cityQuery = selectedCity? `?city=${encodeURIComponent(selectedCity)}` : '';
    setLoading(true);
    fetch(`${API_URL}/analytics${cityQuery}`)
     .then(r => { if (!r.ok) throw new Error(`Analytics ${r.status}`); return r.json(); })
     .then(d => {
        if (!d.success) throw new Error(d.message || 'Could not load analytics');
        if (active) { setStats(d); setError(''); }
      })
     .catch(e => { if (active) setError(e.message || 'Could not load analytics'); })
     .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedCity]);

  // Safe arrays
  const revenue7Days = useMemo(() => Array.isArray(stats?.revenue7Days)? stats.revenue7Days : [], [stats]);
  const tripsByZone = useMemo(() => Array.isArray(stats?.tripsByZone)? stats.tripsByZone : [], [stats]);
  const paymentSplit = useMemo(() => Array.isArray(stats?.paymentSplit)? stats.paymentSplit : [], [stats]);
  const commissionByVehicleType = useMemo(() => Array.isArray(stats?.commissionByVehicleType)? stats.commissionByVehicleType : [], [stats]);

  const handleExportExcel = () => {
    exportExcel(commissionByVehicleType.map(t => ({
      VehicleType: t.vehicleType,
      Rate: `${t.commissionPercent}%`,
      Trips: Number(t.trips || 0),
      Revenue: money(t.totalRevenue),
      CommissionEarned: money(t.totalCommission),
    })), `Analytics_${selectedCity || 'AllCities'}`);
  };

  if (loading) return <div className="p-6 text-white bg-black min-h-screen flex items-center gap-3"><div className="w-5 h-5 border-2 border-white/10 border-t-[#A7E92F] rounded-full animate-spin" /> Loading analytics...</div>;
  if (error) return <p className="p-6 text-red-400 bg-black min-h-screen">❌ {error} <button onClick={()=>window.location.reload()} className="ml-3 underline">Retry</button></p>;
  if (!stats) return <p className="p-6 text-white bg-black min-h-screen">No analytics data available.</p>;

  const cards = [
    { label: 'Trips', value: Number(stats.totalTrips || 0).toLocaleString() },
    { label: 'Revenue', value: money(stats.totalRevenue) },
    { label: 'Real Commission', value: money(stats.totalCommission) },
    { label: 'Active Drivers', value: Number(stats.activeDrivers || 0).toLocaleString() },
  ];

  return (
    <main className="min-h-full space-y-5 bg-black p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Analytics Report {selectedCity && `- ${selectedCity}`}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="min-w-44 rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A7E92F]/50">
            <option value="">All cities</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <ExcelExportButton onClick={handleExportExcel} />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4 hover:border-white/20 transition-colors">
            <p className="text-xs text-white/50 uppercase tracking-wider">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <h2 className="mb-4 text-sm font-semibold">Revenue, last 7 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" tick={{ fill: '#FFF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#FFF', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', color: '#fff' }} formatter={v => money(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#A7E92F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <h2 className="mb-4 text-sm font-semibold">Payment split</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={82}>{paymentSplit.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} /><Legend wrapperStyle={{ color: '#FFF', fontSize: 12 }} /></PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
        <h2 className="mb-4 text-sm font-semibold">Trips by zone</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={tripsByZone}><CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="zone" tick={{ fill: '#FFF', fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: '#FFF', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} /><Bar dataKey="trips" fill="#A7E92F" radius={[6, 6, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </section>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]">
        <h2 className="px-4 py-3 text-sm font-semibold border-b border-white/10">Commission by vehicle type</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-black/50 text-white/60 border-b border-white/10"><tr><th className="px-4 py-3 font-medium">Vehicle type</th><th className="px-4 py-3 font-medium">Rate</th><th className="px-4 py-3 font-medium">Trips</th><th className="px-4 py-3 font-medium">Revenue</th><th className="px-4 py-3 font-medium">Commission</th></tr></thead>
            <tbody>
              {commissionByVehicleType.map(t => (
                <tr key={t.vehicleTypeId || t.vehicleType} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">{t.vehicleType}</td><td className="px-4 py-3">{t.commissionPercent}%</td><td className="px-4 py-3">{Number(t.trips || 0).toLocaleString()}</td><td className="px-4 py-3">{money(t.totalRevenue)}</td><td className="px-4 py-3 font-bold text-[#A7E92F]">{money(t.totalCommission)}</td>
                </tr>
              ))}
              {commissionByVehicleType.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-white/30">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}