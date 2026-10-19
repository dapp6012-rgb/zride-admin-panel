import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../lib/api";

const DriverHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const fetchDriverHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_URL}/driver-accounts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const drivers = response.data.drivers;
      if (!Array.isArray(drivers)) throw new Error("Server returned an invalid driver account list");
      setHistory(drivers);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(`Driver history load nahi hui: ${message}`);
      console.error("Driver history fetch failed:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverHistory(true);
    const interval = setInterval(() => fetchDriverHistory(), 10000);
    return () => clearInterval(interval);
  }, [fetchDriverHistory]);

  const filtered = history.filter(driver => {
    const matchesSearch = [driver.name, driver.email, driver.phone, driver.vehicleNumber]
      .some(value => String(value || "").toLowerCase().includes(search.toLowerCase()));
    if (filter === "all") return matchesSearch;
    return matchesSearch && (driver.status === filter || driver.isOnline === (filter === "online"));
  });

  if (loading) return <div className="p-8 text-center">Loading Ride Driver History...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Ride Driver - History</h1>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            {["all", "online", "offline", "pending"].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded px-3 py-1 text-xs capitalize ${filter === status ? "bg-black text-white" : "bg-transparent"}`}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            placeholder="Search driver, Gmail, phone..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-80 rounded-lg border px-4 py-2"
          />
          <button onClick={() => fetchDriverHistory(true)} className="rounded-lg bg-gray-200 px-4 py-2">
            Refresh
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</div>}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-4">Driver Profile</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Vehicle No / Type</th>
              <th className="p-4">City</th>
              <th className="p-4">Total Rides</th>
              <th className="p-4">Earnings</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No Ride Driver History Found</td></tr>
            ) : filtered.map(driver => (
              <tr key={driver._id || driver.accountId} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {driver.profileImage ? (
                      <img src={driver.profileImage} alt={driver.name || "Driver"} className="h-11 w-11 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                        {(driver.name || "D").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{driver.name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{driver.email || "No Gmail provided"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-sm">{driver.phone || "-"}</td>
                <td className="p-4">
                  <div className="font-mono text-sm">{driver.vehicleNumber || driver.bikeNumber || "-"}</div>
                  <div className="text-xs text-gray-500">{driver.vehicleType || "Bike"}</div>
                </td>
                <td className="p-4">{driver.city || "-"}</td>
                <td className="p-4 font-semibold">{driver.totalRides || driver.completedRides || 0}</td>
                <td className="p-4 font-semibold text-green-600">Rs. {driver.totalEarnings || driver.earnings || 0}</td>
                <td className="p-4 text-xs">{driver.lastLogin ? new Date(driver.lastLogin).toLocaleString() : driver.createdAt ? new Date(driver.createdAt).toLocaleString() : "-"}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-1 text-xs capitalize ${
                    driver.status === "approved" || driver.isOnline ? "bg-green-100 text-green-700" :
                    driver.status === "blocked" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {driver.isOnline ? "online" : driver.status || "offline"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverHistoryScreen;
