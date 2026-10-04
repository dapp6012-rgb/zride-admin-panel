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

const CHART_COLORS = ['#A7E92F', '#2878B5', '#D99424', '#C74D4D', '#7665A8'];
const money = value => `Rs. ${Number(value || 0).toLocaleString()}`;

export default function AnalyticsReport() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/analytics`)
    .then(response => {
        if (!response.ok) throw new Error(`Analytics request failed (${response.status})`);
        return response.json();
      })
    .then(data => {
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
  }, []);

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
      <h1 className="text-xl font-bold text-white">Analytics Report</h1>

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