import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API_URL } from '../lib/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CHART_COLORS = ['#A7E92F', '#2878B5', '#D99424', '#C74D4D', '#7665A8'];
const money = value => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function AnalyticsReport() {
  const [stats, setStats] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/analytics/cities`)
    .then(response => {
        if (!response.ok) throw new Error(`City list request failed (${response.status})`);
        return response.json();
      })
  .then(data => {
        if (active && data.success) setCities(Array.isArray(data.cities)? data.cities : []);
      })
    .catch(() => {
        if (active) setCities([]);
      });
    return () => { active = false; };
  }, [selectedCity]);

  useEffect(() => {
    let active = true;
    const cityQuery = selectedCity? `?city=${encodeURIComponent(selectedCity)}` : '';
    setLoading(true);
    fetch(`${API_URL}/analytics${cityQuery}`)
    .then(response => {
        if (!response.ok) throw new Error(`Analytics request failed (${response.status})`);
        return response.json();
      })
    .then(data => {
        if (!data.success) throw new Error(data.message || 'Could not load analytics data');
        if (active) {
          setStats(data);
          setError('');
        }
      })
    .catch(requestError => {
        if (active) setError(requestError.message || 'Could not load analytics data');
      })
    .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [selectedCity]);

  const handleExportExcel = () => {
    if(!stats) return alert("No data to export");
    const wb = XLSX.utils.book_new();

    const summaryData = [
      { Metric: 'Total Trips', Value: stats.totalTrips },
      { Metric: 'Total Revenue', Value: stats.totalRevenue },
      { Metric: 'Total Commission', Value: stats.totalCommission },
      { Metric: 'Active Drivers', Value: stats.activeDrivers },
      { Metric: 'City', Value: selectedCity || 'All Cities' },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    if(stats.revenue7Days?.length){
      const ws2 = XLSX.utils.json_to_sheet(stats.revenue7Days.map(r => ({
        Day: r.day,
        Revenue: r.revenue
      })));
      XLSX.utils.book_append_sheet(wb, ws2, "Revenue 7 Days");
    }

    if(stats.tripsByZone?.length){
      const ws3 = XLSX.utils.json_to_sheet(stats.tripsByZone.map(z => ({
        Zone: z.zone,
        Trips: z.trips
      })));
      XLSX.utils.book_append_sheet(wb, ws3, "Trips by Zone");
    }

    if(stats.paymentSplit?.length){
      const ws4 = XLSX.utils.json_to_sheet(stats.paymentSplit.map(p => ({
        PaymentMethod: p.name,
        Count: p.value
      })));
      XLSX.utils.book_append_sheet(wb, ws4, "Payment Split");
    }

    if(stats.commissionByVehicleType?.length){
      const ws5 = XLSX.utils.json_to_sheet(stats.commissionByVehicleType.map(t => ({
        VehicleType: t.vehicleType,
        RatePercent: t.commissionPercent,
        Trips: t.trips,
        TotalRevenue: t.totalRevenue,
        TotalCommission: t.totalCommission
      })));
      XLSX.utils.book_append_sheet(wb, ws5, "Commission by Vehicle");
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const cityName = selectedCity || 'AllCities';
    saveAs(blob, `ZRide_Analytics_${cityName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) return <p className="p-6 text-white bg-black min-h-screen">Loading analytics...</p>;
  if (error) return <p className="p-6 text-white bg-black min-h-screen">{error}</p>;
  if (!stats) return <p className="p-6 text-white bg-black min-h-screen">No analytics data available.</p>;

  const cards = [
    { label: 'Trips', value: Number(stats.totalTrips || 0).toLocaleString() },
    { label: 'Revenue', value: money(stats.totalRevenue) },
    { label: 'Real Commission', value: money(stats.totalCommission) },
    { label: 'Active Drivers', value: Number(stats.activeDrivers || 0).toLocaleString() },
  ];
  const revenue7Days = Array.isArray(stats.revenue7Days)? stats.revenue7Days : [];
  const tripsByZone = Array.isArray(stats.tripsByZone)? stats.tripsByZone : [];
  const paymentSplit = Array.isArray(stats.paymentSplit)? stats.paymentSplit : [];
  const commissionByVehicleType = Array.isArray(stats.commissionByVehicleType)
? stats.commissionByVehicleType
    : [];

  return (
    <main className="min-h-full space-y-5 bg-black p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Analytics Report</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="analytics-city" className="text-sm text-white/70">City</label>
          <select
            id="analytics-city"
            value={selectedCity}
            onChange={event => setSelectedCity(event.target.value)}
            className="min-w-44 rounded-md border border-white/20 bg-[#1a1a1a] px-3 py-2 text-white"
          >
            <option value="">All cities</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            📥 Export Excel
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
            <p className="text-sm text-white">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
          <h2 className="mb-4 text-sm font-semibold text-white">Revenue, last 7 days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" tick={{ fill: '#FFFFFF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#FFFFFF', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', color: '#fff' }} formatter={value => money(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#A7E92F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
          <h2 className="mb-4 text-sm font-semibold text-white">Payment split</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={82} label={{ fill: '#FFFFFF' }}>
                {paymentSplit.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#1a1a1a] p-4">
        <h2 className="mb-4 text-sm font-semibold text-white">Trips by zone</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={tripsByZone}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="zone" tick={{ fill: '#FFFFFF', fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: '#FFFFFF', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', color: '#fff' }} />
            <Bar dataKey="trips" fill="#A7E92F" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]">
        <h2 className="px-4 py-3 text-sm font-semibold text-white">Commission by vehicle type</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-black text-white border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium text-white">Vehicle type</th>
                <th className="px-4 py-3 font-medium text-white">Rate</th>
                <th className="px-4 py-3 font-medium text-white">Trips</th>
                <th className="px-4 py-3 font-medium text-white">Revenue</th>
                <th className="px-4 py-3 font-medium text-white">Commission earned</th>
              </tr>
            </thead>
            <tbody>
              {commissionByVehicleType.map(type => (
                <tr key={type.vehicleTypeId || type.vehicleType} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white">{type.vehicleType}</td>
                  <td className="px-4 py-3 text-white">{type.commissionPercent}%</td>
                  <td className="px-4 py-3 text-white">{Number(type.trips || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-white">{money(type.totalRevenue)}</td>
                  <td className="px-4 py-3 font-semibold text-white">{money(type.totalCommission)}</td>
                </tr>
              ))}
              {commissionByVehicleType.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-white">No vehicle type commission data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}