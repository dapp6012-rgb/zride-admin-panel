import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_URL } from "../lib/api";

const getProfileImageUrl = image => {
  if (!image || typeof image !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const TruckDriverHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchTruckHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_URL}/truck-owners`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const owners = response.data.truckOwners;
      if (!Array.isArray(owners)) throw new Error("Server returned an invalid truck driver list");
      setHistory(owners);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(`Truck history load nahi hui: ${message}`);
      console.error("Truck driver history fetch failed:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTruckHistory(true);
    const interval = setInterval(() => fetchTruckHistory(), 10000);
    return () => clearInterval(interval);
  }, [fetchTruckHistory]);

  const filtered = history.filter(driver =>
    [driver.ownerName, driver.email, driver.truckNumber, driver.phone]
      .some(value => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center">Loading Truck Driver History...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Truck Driver - Login History</h1>
        <div className="flex gap-3">
          <input
            placeholder="Search driver, Gmail, truck no..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-80 rounded-lg border px-4 py-2"
          />
          <button onClick={() => fetchTruckHistory(true)} className="rounded-lg bg-gray-200 px-4 py-2">
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
              <th className="p-4">Gmail</th>
              <th className="p-4">Truck No</th>
              <th className="p-4">Phone</th>
              <th className="p-4">City</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">No Truck Driver History Found</td></tr>
            ) : filtered.map(driver => (
              <tr key={driver._id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {driver.profileImage ? (
                      <img
                        src={getProfileImageUrl(driver.profileImage)}
                        alt={driver.ownerName || "Truck driver"}
                        className="h-11 w-11 rounded-full border object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                        {(driver.ownerName || "T").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{driver.ownerName || "N/A"}</span>
                  </div>
                </td>
                <td className="p-4">{driver.email || "-"}</td>
                <td className="p-4 font-mono">{driver.truckNumber || "-"}</td>
                <td className="p-4 font-mono text-sm">{driver.phone || "-"}</td>
                <td className="p-4">{driver.city || "-"}</td>
                <td className="p-4 text-xs">{driver.lastLogin ? new Date(driver.lastLogin).toLocaleString() : driver.createdAt ? new Date(driver.createdAt).toLocaleString() : "-"}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-1 text-xs capitalize ${
                    driver.status === "approved" ? "bg-green-100 text-green-700" :
                    driver.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {driver.status || "pending"}
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

export default TruckDriverHistoryScreen;
