import React, { useEffect, useState } from 'react';
import { API_BASE_URL as API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';

export default function ComplaintsSupportRider({ setScreen, notify }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/complaint/all`);
      const data = await res.json();
      setComplaints(data.complaints?.filter(c => c.role === 'rider' || c.role === 'passenger') || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    if(!window.confirm("Resolve karna hai?")) return;
    try {
      await fetch(`${API_URL}/api/complaint/${id}/resolve`, { method: 'PUT' });
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: 'resolved' } : c));
      notify?.("Complaint resolved");
    } catch(e) {
      alert("Error");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete karni hai?")) return;
    try {
      await fetch(`${API_URL}/api/complaint/${id}`, { method: 'DELETE' });
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch(e) {
      alert("Error");
    }
  };

  const handleExportExcel = () => {
    const formatted = filteredList.map(c => ({
      TicketID: c.ticketId,
      Role: c.role,
      Type: c.type,
      Rider: `${c.passengerName || 'Rider'} (${c.passengerId || '-'})`,
      RideID: c.rideId || 'General',
      Driver: c.driverName || '-',
      Description: c.description,
      Status: c.status,
      ContactPreference: c.contactPreference,
      CreatedAt: c.createdAt ? new Date(c.createdAt).toLocaleString() : c.timestamp ? new Date(c.timestamp).toLocaleString() : '-',
      Attachments: (c.attachments || []).map(attachment => typeof attachment === 'string' ? attachment : attachment?.url || attachment?.uri || '').filter(Boolean).join(', '),
    }));
    exportExcel(formatted, 'ComplaintsSupportRider');
  };

  const filteredList = complaints.filter(c => {
    if(filter === 'all') return true;
    return c.status === filter;
  });

  if(loading) return <div style={{padding:40, textAlign:'center'}}>Loading rider complaints...</div>;

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontWeight: 900 }}>Rider Complaints  ({filteredList.length})</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExcelExportButton onClick={handleExportExcel} />
          <button onClick={fetchComplaints} style={{ padding: '8px 16px', borderRadius: 8, background: '#000', color: '#fff', fontWeight: 700 }}>Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['all', 'pending', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #000', background: filter === f ? '#000' : '#fff', color: filter === f ? '#A7E92F' : '#000', fontWeight: 700, textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {filteredList.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: '#888' }}>No rider complaints found</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredList.map(c => (
            <div key={c._id} style={{ background: '#fff', borderRadius: 14, padding: 16, borderLeft: `6px solid ${c.status === 'resolved' ? '#00CC66' : '#FF4444'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ background: '#000', color: '#A7E92F', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 900 }}>{c.ticketId}</span>
                  <span style={{ marginLeft: 8, background: '#E0F7FF', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>{c.role?.toUpperCase()} - {c.type}</span>
                </div>
                <span style={{ fontSize: 12, color: '#888' }}>{new Date(c.createdAt || c.timestamp).toLocaleString()}</span>
              </div>

              <div style={{ marginTop: 10 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{c.passengerName || 'Rider'} - <span style={{ fontWeight: 400, color: '#666' }}>{c.passengerId}</span></p>
                <p style={{ margin: '4px 0', fontSize: 13, color: '#333' }}><b>Ride:</b> {c.rideId || 'General'} {c.driverName ? `| Driver: ${c.driverName}` : ''}</p>
                <p style={{ margin: '8px 0', background: '#f9f9f9', padding: 10, borderRadius: 8, fontSize: 14 }}>{c.description}</p>
                {c.attachments?.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>{c.attachments.map((attachment, i) => {
                  const src = typeof attachment === 'string' ? attachment : attachment?.dataUrl || attachment?.url || attachment?.uri;
                  return src ? <a key={`${c._id}-attachment-${i}`} href={src} target="_blank" rel="noreferrer"><img src={src} alt={`Complaint evidence ${i + 1}`} loading="lazy" style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb', cursor: 'zoom-in' }} /></a> : null;
                })}</div>}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: c.status === 'pending' ? '#FFE0E0' : '#E0FFE0', fontSize: 12, fontWeight: 800 }}>{c.status?.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: '#666' }}>Contact: {c.contactPreference}</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {c.status !== 'resolved' && <button onClick={() => handleResolve(c._id)} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#00FF7F', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Resolved</button>}
                <button onClick={() => handleDelete(c._id)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: '#fff', border: '1px solid #FF4444', color: '#FF4444', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}