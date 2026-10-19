import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_URL } from "../lib/api";

const getProfileImageUrl = image => {
  if (!image || typeof image !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const ShopLoginHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchShopHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.get(`${API_URL}/shops/history`, {
        params: { role: "shop" },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const shops = response.data.shops;
      if (!Array.isArray(shops)) throw new Error("Server returned an invalid shop history list");
      setHistory(shops);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(`Shop history load nahi hui: ${message}`);
      console.error("Shop history fetch failed:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopHistory(true);
    const interval = setInterval(() => fetchShopHistory(), 10000);
    return () => clearInterval(interval);
  }, [fetchShopHistory]);

  const filtered = history.filter(shop =>
    [shop.shopName, shop.ownerName, shop.ownerEmail, shop.phone, shop.city]
      .some(value => String(value || "").toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center">Loading Shop History...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Shop Mode - Login History</h1>
        <div className="flex gap-3">
          <input
            placeholder="Search shop, owner, Gmail..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-80 rounded-lg border px-4 py-2"
          />
          <button onClick={() => fetchShopHistory(true)} className="rounded-lg bg-gray-200 px-4 py-2">
            Refresh
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</div>}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-4">Shop</th>
              <th className="p-4">Owner Profile</th>
              <th className="p-4">Phone</th>
              <th className="p-4">City</th>
              <th className="p-4">Total Products</th>
              <th className="p-4">Last Login</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">No Shop Login History Found</td></tr>
            ) : filtered.map(shop => (
              <tr key={shop._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold">{shop.shopName || "N/A"}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {shop.profileImage ? (
                      <img src={getProfileImageUrl(shop.profileImage)} alt={shop.ownerName || "Shop owner"} className="h-11 w-11 rounded-full border object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                        {(shop.ownerName || "S").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{shop.ownerName || "N/A"}</div>
                      <div className="text-xs text-gray-500">{shop.ownerEmail || "No Gmail provided"}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-sm">{shop.phone || "-"}</td>
                <td className="p-4">{shop.city || "-"}</td>
                <td className="p-4">{shop.totalProducts || shop.products?.length || 0}</td>
                <td className="p-4 text-xs">{shop.lastLogin ? new Date(shop.lastLogin).toLocaleString() : shop.createdAt ? new Date(shop.createdAt).toLocaleString() : "-"}</td>
                <td className="p-4">
                  <span className={`rounded px-2 py-1 text-xs capitalize ${
                    shop.status === "approved" ? "bg-green-100 text-green-700" :
                    shop.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {shop.status || "pending"}
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

export default ShopLoginHistoryScreen;
