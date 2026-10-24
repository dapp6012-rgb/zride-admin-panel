import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, API_URL } from "../lib/api";
import GlobalImageViewer from "../components/GlobalImageViewer";

const getShopImageUrl = (image) => {
  if (!image || typeof image !== "string") return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

export default function AdminShopVerification() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [viewer, setViewer] = useState({ isOpen: false, images: [], index: 0 });

  // FIX: token yahan define kiya - yehi missing tha
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

  const openViewer = (images, index) => setViewer({ isOpen: true, images, index });

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = {
        "bypass-tunnel-reminder": "true",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.get(`${API_URL}/shops`, {
        headers: headers,
      });

      console.log("Admin API Response:", res.data);

      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (Array.isArray(res.data.shops)) data = res.data.shops;
      else if (Array.isArray(res.data.data)) data = res.data.data;

      setRequests(data);
    } catch (e) {
      console.error("Fetch Error:", e.response?.data || e.message);
      setError(
        e.response?.data?.message ||
          "Failed to load requests. Backend URL check karo: " + API_URL
      );
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // REAL APPROVE / REJECT - User ke ShopAccountStatusScreen me auto update hoga
  const handleAction = async (id, action) => {
    const ok = window.confirm(
      `${action === "approve" ? "Approve" : "Reject"} this shop?\nUser ke ShopAccountStatusScreen me 3 sec me auto update ho jayega.`
    );
    if (!ok) return;

    setActionLoading(id + action);
    setSuccessMsg("");
    try {
      const headers = {
        "bypass-tunnel-reminder": "true",
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.put(
        `${API_URL}/shops/${encodeURIComponent(id)}/status`,
        { status: action === "approve" ? "approved" : "rejected" },
        {
          headers: headers,
        }
      );

      console.log("Action Response:", res.data);
      setSuccessMsg(
        `Shop ${action}d successfully! User ke app me status auto "${action === "approve" ? "APPROVED" : "REJECTED"}" ho jayega.`
      );
      setSelected(null);
      fetchRequests();

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      console.error("Action Error:", e.response?.data || e.message);
      alert(e.response?.data?.message || "Action Failed - Backend check karo");
    }
    setActionLoading("");
  };

  const filtered = requests.filter(
    (r) =>
      r.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search) ||
      r.cnic?.includes(search)
  ).filter(r => filter === "all" || r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black">Shop Verification Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            User ki taraf se aayi hui requests yahan show hongi - Approve karte hi user app auto update
          </p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Search name, phone, CNIC..."
            className="border rounded-lg px-4 py-2 w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchRequests}
            className="bg-black text-white px-4 py-2 rounded-lg font-bold"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-100 border border-green-200 text-green-700 p-3 rounded-lg mb-4 font-bold">
          {successMsg}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-bold border ${
              filter === f
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600"
            }`}
          >
            {f.toUpperCase()} {f === "pending" ? `(${requests.length})` : ""}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 text-left text-xs font-bold text-gray-600">
            <tr>
              <th className="p-4">Shop Owner</th>
              <th className="p-4">CNIC / Phone</th>
              <th className="p-4">Address</th>
              <th className="p-4">Shop Pics</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center">
                  Loading requests from {API_URL}...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                  No {filter} requests found.
                  <br />
                  <span className="text-xs">
                    App se ShopRegistrationScreen se submit karo to yahan ayegi.
                  </span>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold">{item.shopName}</div>
                    <div className="text-xs text-gray-500">{item.ownerName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {item._id?.slice(-6)}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div>CNIC: {item.cnic}</div>
                    <div className="text-blue-600 font-semibold">
                      {item.phone}
                    </div>
                  </td>
                  <td className="p-4 text-sm max-w-[200px] truncate">
                    {item.address}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {item.shopImages?.map(getShopImageUrl).filter(Boolean).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="shop"
                          className="w-12 h-12 cursor-pointer rounded-lg border object-cover hover:opacity-80"
                          onClick={() => openViewer(item.shopImages.map(getShopImageUrl).filter(Boolean), i)}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-black ${
                        item.status === "pending"
                          ? "bg-orange-100 text-orange-600"
                          : item.status === "approved"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(item)}
                        className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs"
                      >
                        View
                      </button>
                      {item.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(item._id, "approve")}
                            disabled={actionLoading === item._id + "approve"}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold"
                          >
                            {actionLoading === item._id + "approve"
                              ? "..."
                              : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(item._id, "reject")}
                            disabled={actionLoading === item._id + "reject"}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                          >
                            {actionLoading === item._id + "reject"
                              ? "..."
                              : "Reject"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black">Shop Details</h2>
              <button onClick={() => setSelected(null)} className="text-2xl">
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Shop Name</span>
                <span className="font-bold">{selected.shopName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Owner Name</span>
                <span className="font-bold">{selected.ownerName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">CNIC</span>
                <span className="font-bold">{selected.cnic}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Phone</span>
                <span className="font-bold text-blue-600">
                  {selected.phone}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">City</span>
                <span className="font-bold">{selected.city}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Address</span>
                <span className="font-bold text-right max-w-[300px]">
                  {selected.address}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Request ID</span>
                <span className="font-mono text-xs">{selected._id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Status</span>
                <span className="font-black">{selected.status?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Date</span>
                <span className="font-bold">
                  {new Date(selected.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="font-bold mb-2">Shop Pictures ({selected.shopImages?.length || 0})</p>
              <div className="grid grid-cols-2 gap-4">
                {selected.shopImages?.map(getShopImageUrl).filter(Boolean).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Shop ${i + 1}`}
                    className="w-full h-48 cursor-pointer rounded-xl border object-cover hover:opacity-80"
                    onClick={() => openViewer(selected.shopImages.map(getShopImageUrl).filter(Boolean), i)}
                  />
                ))}
              </div>
            </div>
            {selected.status === "pending" && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleAction(selected._id, "reject")}
                  className="flex-1 bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-black"
                >
                  REJECT - User app me auto update
                </button>
                <button
                  onClick={() => handleAction(selected._id, "approve")}
                  className="flex-1 bg-black text-white py-3 rounded-xl font-black"
                >
                  APPROVE - User app me auto update
                </button>
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="w-full mt-3 bg-gray-100 py-3 rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <GlobalImageViewer images={viewer.images} initialIndex={viewer.index} isOpen={viewer.isOpen} onClose={() => setViewer(current => ({ ...current, isOpen: false }))} />
    </div>
  );
}