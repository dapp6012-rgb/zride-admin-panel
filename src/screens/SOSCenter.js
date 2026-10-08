import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';
import { API_URL, SOCKET_URL } from '../lib/api';

export default function SOSCenter({ notify }) {
  const [sosList, setSosList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('active');
  const [incomingAlert, setIncomingAlert] = useState(null);

  const fetchSOS = async () => {
    try {
      const res = await fetch(`${API_URL}/sos/list?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        const alerts = Array.isArray(data.sos) ? data.sos : [];
        setSosList(alerts);
        setSelected(current => alerts.find(alert => alert._id === current?._id) || alerts[0] || null);
      }
    } catch (e) {
      console.log("SOS fetch error", e);
    }
  };

  useEffect(() => {
    fetchSOS();
  }, [filter]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    const handleNewSOS = newAlert => {
      const label = newAlert.driverId || newAlert.riderId || newAlert.userId || 'Unknown user';
      notify?.(`NEW SOS: ${label}`);
      if (typeof Audio !== 'undefined') {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
        audio.play().catch(() => {});
      }
      if (filter !== 'resolved') setSosList(previous => [newAlert, ...previous.filter(alert => alert._id !== newAlert._id)]);
      setSelected(newAlert);
      setIncomingAlert(newAlert);
    };
    const handleLocationUpdate = updatedSOS => {
      setSosList(previous => previous.map(alert => alert._id === updatedSOS._id ? { ...alert, ...updatedSOS } : alert));
      setSelected(current => current?._id === updatedSOS._id ? { ...current, ...updatedSOS } : current);
      setIncomingAlert(current => current?._id === updatedSOS._id ? { ...current, ...updatedSOS } : current);
    };
    const handleResolved = ({ sosId, sos }) => {
      if (filter === 'all' || filter === 'resolved') {
        if (sos) setSosList(previous => [sos, ...previous.filter(alert => alert._id !== sosId)]);
      } else {
        setSosList(previous => previous.filter(alert => alert._id !== sosId));
      }
      setSelected(current => current?._id === sosId ? (filter === 'all' || filter === 'resolved' ? sos : null) : current);
      setIncomingAlert(current => current?._id === sosId ? null : current);
    };

    socket.on('new_sos_alert', handleNewSOS);
    socket.on('sos_location_update', handleLocationUpdate);
    socket.on('sos_resolved', handleResolved);

    return () => {
      socket.off('new_sos_alert', handleNewSOS);
      socket.off('sos_location_update', handleLocationUpdate);
      socket.off('sos_resolved', handleResolved);
      socket.disconnect();
    };
  }, [filter, notify]);

  const handleResolve = async (sosId) => {
    try {
      const res = await fetch(`${API_URL}/sos/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sosId, resolvedBy: 'admin' })
      });
      const data = await res.json();
      if (data.success) {
        notify?.('SOS resolved');
        if (filter === 'all' || filter === 'resolved') {
          setSosList(previous => [data.sos, ...previous.filter(alert => alert._id !== sosId)]);
          setSelected(data.sos);
        } else {
          setSosList(previous => previous.filter(alert => alert._id !== sosId));
          setSelected(null);
        }
        setIncomingAlert(null);
      }
    } catch (e) {
      notify?.('Resolve failed');
    }
  };

  const handleCall = (phone) => {
    if (phone) window.open(`tel:${phone}`, '_self');
  };

  const handleExportExcel = () => exportExcel(sosList.map(sos => ({
    UserID: sos.driverId || sos.riderId || sos.userId || 'Unknown',
    Phone: sos.phone || 'Not provided',
    Status: sos.status || '',
    CreatedAt: sos.createdAt ? new Date(sos.createdAt).toLocaleString() : '',
    Latitude: sos.lat ?? '',
    Longitude: sos.lng ?? '',
  })), 'SOSCenter');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>
      {incomingAlert && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(15, 23, 42, 0.58)' }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="incoming-sos-title" style={{ width: 'min(460px, 100%)', background: '#FFFFFF', borderTop: '6px solid #FF3B30', borderRadius: 16, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}>
            <p style={{ margin: '0 0 8px', color: '#FF3B30', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Immediate Assistance Required</p>
            <h2 id="incoming-sos-title" style={{ margin: '0 0 12px', color: '#000000', fontSize: 24, fontWeight: 900 }}>New SOS Alert</h2>
            <p style={{ margin: '0 0 6px', color: '#000000' }}><b style={{color:'#000'}}>User:</b> {incomingAlert.driverId || incomingAlert.riderId || incomingAlert.userId}</p>
            <p style={{ margin: '0 0 18px', color: '#000000' }}><b style={{color:'#000'}}>Phone:</b> {incomingAlert.phone || 'Not provided'}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => { setSelected(incomingAlert); setIncomingAlert(null); }} style={{ background: '#000000', color: '#FFFFFF', border: 0, padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>View Live Location</button>
              {incomingAlert.phone && <button onClick={() => handleCall(incomingAlert.phone)} style={{ background: '#007AFF', color: '#FFFFFF', border: 0, padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Call User</button>}
              <button onClick={() => setIncomingAlert(null)} style={{ background: '#F2F4F7', color: '#000000', border: '1px solid #E5E7EB', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {/* LEFT LIST */}
      <div style={{ width: '380px', background: '#FFFFFF', borderRight: '1px solid #E5E7EB', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
          <h2 style={{ margin: 0, fontWeight: 900, color: '#000000', fontSize: 18, display:'flex', alignItems:'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, background: '#FF3B30', borderRadius: '50%', display: 'inline-block' }}></span>
            SOS Center
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #000000', color: '#000000', background: '#FFFFFF', fontWeight: 600 }}>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
            <ExcelExportButton onClick={handleExportExcel} />
          </div>
        </div>

        {sosList.length === 0 && <p style={{ textAlign: 'center', marginTop: 40, color: '#000000', fontWeight: 600 }}>No {filter} SOS alerts</p>}

        {sosList.map((sos) => (
          <div
            key={sos._id}
            onClick={() => setSelected(sos)}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F0F0F0',
              cursor: 'pointer',
              background: selected?._id === sos._id? '#F8F9FA' : '#FFFFFF',
              borderLeft: selected?._id === sos._id? '4px solid #FF3B30' : '4px solid transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ color: '#000000', fontSize: 14 }}>{sos.driverId || sos.riderId || sos.userId}</b>
              <span style={{ fontSize: '11px', background: sos.status === 'active'? '#FF3B30' : '#00C853', color: '#FFFFFF', padding: '4px 10px', borderRadius: '20px', fontWeight: 800, textTransform: 'uppercase' }}>{sos.status}</span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#000000', fontWeight: 500 }}>{sos.phone || 'No Phone'} • {new Date(sos.createdAt).toLocaleString()}</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#000000' }}>{sos.lat?.toFixed(4)}, {sos.lng?.toFixed(4)}</p>
          </div>
        ))}
      </div>

      {/* RIGHT DETAIL */}
      <div style={{ flex: 1, padding: '24px', background: '#FFFFFF', overflowY: 'auto' }}>
        {!selected? (
          <div style={{ textAlign: 'center', marginTop: '20%', color: '#000000' }}>
            <h3 style={{color:'#000000'}}>Select an SOS alert to view details</h3>
            <p style={{color:'#000000'}}>Alerts will appear here in real-time</p>
          </div>
        ) : (
          <>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: 0, color: '#000000', fontWeight: 800, fontSize: 16 }}>Driver / Rider Information</h3>
              <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div style={{color:'#000000', fontSize: 14}}><b style={{color:'#000000'}}>ID:</b> {selected.driverId || selected.riderId || selected.userId}</div>
                <div style={{color:'#000000', fontSize: 14}}><b style={{color:'#000000'}}>Phone:</b> {selected.phone || 'Not provided'}</div>
                <div style={{color:'#000000', fontSize: 14}}><b style={{color:'#000000'}}>Time:</b> {new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => handleCall(selected.phone)} style={{ background: '#007AFF', color: '#FFFFFF', border: 0, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Call Driver</button>
                <button onClick={() => handleCall('1122')} style={{ background: '#000000', color: '#FFFFFF', border: 0, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Call 1122 Rescue</button>
                <button onClick={() => handleResolve(selected._id)} style={{ background: '#00C853', color: '#FFFFFF', border: 0, padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Mark Resolved</button>
              </div>
            </div>

            {/* MAP */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', height: '60vh', border: '1px solid #E5E7EB' }}>
              <iframe
                title="map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${selected.lat},${selected.lng}&z=16&output=embed`}
                allowFullScreen
              ></iframe>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer" style={{ background: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', color: '#000000', border: '1px solid #000000', fontWeight: 700 }}>Open in Google Maps</a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`} target="_blank" rel="noreferrer" style={{ background: '#FF3B30', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', color: '#FFFFFF', fontWeight: 700 }}>Get Directions</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}