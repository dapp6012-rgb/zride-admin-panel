import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_URL } from "../lib/api";

const imageFields = [
  ["driverFront", "Driver - Front"],
  ["driverSide", "Driver - Side"],
  ["cnicFront", "CNIC - Front"],
  ["cnicBack", "CNIC - Back"],
  ["license", "Driving License"],
];

const getStatus = request => String(request.status || "pending").toLowerCase();

const getImageUrl = image => {
  if (!image || typeof image !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) return image;
  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const TruckRequestScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState("");

  const fetchTruckRequests = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/truck-owners`);
      const owners = response.data.truckOwners || response.data.data || response.data;
      if (!Array.isArray(owners)) throw new Error("Server returned an invalid truck request list");
      setRequests(owners);
      setError("");
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      setError(`Truck requests load nahi ho sake: ${message}`);
      console.error("Truck request fetch failed:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTruckRequests(true);
    const interval = setInterval(() => fetchTruckRequests(), 5000);
    return () => clearInterval(interval);
  }, [fetchTruckRequests]);

  const handleStatusUpdate = async (request, status) => {
    const id = request._id;
    if (!id || updatingId) return;
    if (!window.confirm(`Kya aap ${request.ownerName || "is driver"} ko ${status} karna chahte hain?`)) return;

    setUpdatingId(id);
    try {
      const response = await axios.put(`${API_URL}/truck-owners/${id}/status`, { status });
      const updatedOwner = response.data.truckOwner || response.data;
      setRequests(current => current.map(item => item._id === id ? updatedOwner : item));
      setSelected(current => current?._id === id ? updatedOwner : current);
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      console.error("Truck request status update failed:", message);
      window.alert(`Status update nahi ho saka: ${message}`);
    } finally {
      setUpdatingId("");
    }
  };

  const filteredRequests = requests.filter(request =>
    filter === "all" || getStatus(request) === filter
  );

  if (loading) return <div className="p-8 text-center">Loading Truck Requests...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Truck Registration Requests</h1>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-4 py-1 capitalize ${filter === status ? "bg-black text-white" : "border bg-white"}`}
            >
              {status}
            </button>
          ))}
          <button onClick={() => fetchTruckRequests(true)} className="rounded-lg bg-gray-200 px-4 py-1">
            Refresh
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</div>}

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-4">Driver</th>
              <th className="p-4">Truck No</th>
              <th className="p-4">CNIC</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Documents</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">No Truck Requests Found</td></tr>
            ) : filteredRequests.map(item => {
              const status = getStatus(item);
              return (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold">{item.ownerName || item.driverName || "N/A"}</div>
                    <div className="text-xs text-gray-500">{item.city || "N/A"}</div>
                    <div className="text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</div>
                  </td>
                  <td className="p-4 font-mono">{item.truckNumber || "N/A"}</td>
                  <td className="p-4">{item.cnic || "N/A"}</td>
                  <td className="p-4">{item.phone || "N/A"}</td>
                  <td className="p-4">
                    <button onClick={() => setSelected(item)} className="text-blue-600 underline">
                      View photos
                    </button>
                  </td>
                  <td className="p-4">
                    <span className={`rounded px-2 py-1 text-xs capitalize ${
                      status === "approved" ? "bg-green-100 text-green-700" :
                      status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelected(item)} className="rounded bg-gray-200 px-3 py-1 text-sm">
                        Details
                      </button>
                      {status === "pending" && (
                        <>
                          <button
                            disabled={updatingId === item._id}
                            onClick={() => handleStatusUpdate(item, "approved")}
                            className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={updatingId === item._id}
                            onClick={() => handleStatusUpdate(item, "rejected")}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Truck Registration Details</h2>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-2xl">×</button>
            </div>
            <div className="mb-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div><b>Driver:</b> {selected.ownerName || selected.driverName || "N/A"}</div>
              <div><b>Phone:</b> {selected.phone || "N/A"}</div>
              <div><b>CNIC:</b> {selected.cnic || "N/A"}</div>
              <div><b>License number:</b> {selected.licenseNumber || selected.licenseNo || "N/A"}</div>
              <div><b>Truck number:</b> {selected.truckNumber || "N/A"}</div>
              <div><b>City:</b> {selected.city || "N/A"}</div>
              <div><b>Status:</b> {getStatus(selected)}</div>
              <div><b>Submitted:</b> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "N/A"}</div>
            </div>
            <h3 className="mb-3 font-bold">Photos and Documents</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {imageFields.map(([field, label]) => {
                const imageUrl = getImageUrl(selected.images?.[field]);
                return (
                  <div key={field} className="rounded-lg border p-2">
                    <p className="mb-2 text-sm font-semibold">{label}</p>
                    {imageUrl ? (
                      <a href={imageUrl} target="_blank" rel="noreferrer">
                        <img src={imageUrl} alt={label} className="h-44 w-full rounded object-cover" />
                      </a>
                    ) : <p className="py-12 text-center text-sm text-gray-500">Not provided</p>}
                  </div>
                );
              })}
            </div>
            {getStatus(selected) === "pending" && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  disabled={updatingId === selected._id}
                  onClick={() => handleStatusUpdate(selected, "approved")}
                  className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={updatingId === selected._id}
                  onClick={() => handleStatusUpdate(selected, "rejected")}
                  className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="mt-3 w-full rounded-xl bg-gray-100 py-3 font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckRequestScreen;
