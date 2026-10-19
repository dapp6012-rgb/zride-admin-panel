import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_URL } from "../lib/api";

const getProfileImageUrl = image => {
  if (!image || typeof image !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const ShowRoomOwnerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchShowRoomHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_URL}/shops/history`, {
        params: { role: "showroom" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const showrooms = response.data.shops;
      if (!Array.isArray(showrooms)) throw new Error("Server returned an invalid showroom history list");
      setHistory(showrooms);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(`Showroom history load nahi hui: ${message}`);
      console.error("Showroom history fetch failed:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShowRoomHistory(true);
    const interval = setInterval(() => fetchShowRoomHistory(), 10000);
    return () => clearInterval(interval);
  }, [fetchShowRoomHistory]);

  const filtered = history.filter(showroom =>
    [showroom.shopName, showroom.ownerName, showroom.ownerEmail, showroom.phone, showroom.city]
      .some(value => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center">Loading ShowRoom Owner History...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ShowRoom Owner - Login History</h1>
        <div className="flex gap-3">
          <input
            placeholder="Search showroom, owner, Gmail..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-80 rounded-lg border px-4 py-2"
          />
          <button onClick={() => fetchShowRoomHistory(true)} className="rounded-lg bg-gray-200 px-4 py-2">
            Refresh
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</div>}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-4">Showroom</th>
              <th className="p-4">Owner Profile</th>
              <th className="p-4">Phone</th>
              <th className="p-4">City</th>
              <th className="p-4">Total Cars</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">No ShowRoom History Found</td></tr>
            ) : filtered.map(showroom => (
              <tr key={showroom._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold">{showroom.shopName || "N/A"}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {showroom.profileImage ? (
                      <img src={getProfileImageUrl(showroom.profileImage)} alt={showroom.ownerName || "Showroom owner"} className="h-11 w-11 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                        {(showroom.ownerName || "S").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{showroom.ownerName || "N/A"}</div>
                      <div className="text-xs text-gray-500">{showroom.ownerEmail || "No Gmail provided"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-sm">{showroom.phone || "-"}</td>
                <td className="p-4">{showroom.city || "-"}</td>
                <td className="p-4">{showroom.totalCars || showroom.cars?.length || 0}</td>
                <td className="p-4 text-xs">{showroom.lastLogin ? new Date(showroom.lastLogin).toLocaleString() : showroom.createdAt ? new Date(showroom.createdAt).toLocaleString() : "-"}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-1 text-xs capitalize ${
                    showroom.status === "approved" ? "bg-green-100 text-green-700" :
                    showroom.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {showroom.status || "pending"}
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

export default ShowRoomOwnerHistory;
