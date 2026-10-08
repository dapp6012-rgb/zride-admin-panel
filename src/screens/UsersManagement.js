"use client"
import { useState, useEffect } from "react"
import { exportExcel } from '../utils/exportExcel'
import ExcelExportButton from '../components/ExcelExportButton'

const API_URL = "http://localhost:3000/api/rider"

export default function UsersManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(API_URL)
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : data.riders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleBlock = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Blocked" : "Active"
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(id)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update user status")
      setUsers(currentUsers => currentUsers.map(user =>
        (user.riderId === id || user._id === id)
          ? { ...user, status: data.status || newStatus }
          : user
      ))
    } catch (err) {
      console.error(err)
      window.alert(err.message || "Could not update user status. Please try again.")
    }
  }

  const handleExportExcel = () => {
    const formatted = filtered.map(u => ({
      User: u.name || "Rider",
      Email: u.email || "No Gmail",
      Phone: u.phone || u.phoneNumber || u.mobile || "-",
      Location: [u.city || u.userCity || u.location?.city, u.country || u.userCountry || u.location?.country].filter(Boolean).join(", ") || "-",
      Rides: u.totalRides || 0,
      Status: u.status || "Unknown",
      Action: u.status === 'Active' ? 'Block' : 'Unblock',
    }))
    exportExcel(formatted, 'UsersManagement')
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )
  
  if (loading) return <div className="p-6 text-white bg-black min-h-screen">Loading...</div>

  return (
    <div className="p-6 bg-black min-h-screen">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">User Management ({filtered.length})</h1>
        <ExcelExportButton onClick={handleExportExcel} />
      </div>
      <input placeholder="Search..." className="border border-white/10 p-2 rounded w-full max-w-md mb-4 text-white placeholder:text-white/50 bg-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#A7E92F]" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="bg-[#1a1a1a] border border-white/10 rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-black border-b border-white/10"><tr><th className="p-3 text-white">User</th><th className="p-3 text-white">Email</th><th className="p-3 text-white">Phone</th><th className="p-3 text-white">Location</th><th className="p-3 text-white">Rides</th><th className="p-3 text-white">Status</th><th className="p-3 text-white">Action</th></tr></thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.riderId || user._id} className="border-t border-white/10 hover:bg-white/[0.03]">
                <td className="p-3 font-medium text-white">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2a2a2a] text-sm font-semibold text-white border border-white/10">
                      {(user.name || "R").charAt(0).toUpperCase()}
                      {user.photo || user.profileImage ? <img src={user.photo || user.profileImage} alt="" className="absolute inset-0 h-full w-full object-cover" onError={event => { event.currentTarget.style.display = "none" }} /> : null}
                    </span>
                    <span className="text-white">{user.name || "Rider"}</span>
                  </div>
                </td>
                <td className="p-3 text-white">{user.email || "No Gmail"}</td>
                <td className="p-3 text-white">{user.phone || user.phoneNumber || user.mobile || "-"}</td>
                <td className="p-3 text-white">{[user.city || user.userCity || user.location?.city, user.country || user.userCountry || user.location?.country].filter(Boolean).join(", ") || "-"}</td>
                <td className="p-3 text-white">{user.totalRides || 0}</td>
                <td className="p-3 text-white"><span className={`px-2 py-1 rounded-full text-xs font-bold border ${user.status === 'Active' ? 'bg-green-500/20 text-white border-green-500/30' : 'bg-red-500/20 text-white border-red-500/30'}`}>{user.status}</span></td>
                <td className="p-3"><button onClick={() => toggleBlock(user.riderId || user._id, user.status)} className="text-[#A7E92F] font-bold underline hover:text-white">{user.status === 'Active' ? 'Block' : 'Unblock'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}