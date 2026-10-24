import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://zride-texon.loca.lt/api/commission';

export default function Commission() {
  const [form, setForm] = useState({ 
    userType: 'driver', 
    commissionPrice: '', 
    accountName: '', 
    accountNumber: '', 
    jazzcashNumber: '', 
    easypaisaNumber: '' 
  });
  const [qrFile, setQrFile] = useState(null);
  const [savedData, setSavedData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Load karo jo pehle se save hai
  const fetchSettings = async (type) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}?userType=${type}`);
      if (res.data) {
        setForm({
          userType: type,
          commissionPrice: res.data.commissionPrice || '',
          accountName: res.data.accountName || '',
          accountNumber: res.data.accountNumber || '',
          jazzcashNumber: res.data.jazzcashNumber || '',
          easypaisaNumber: res.data.easypaisaNumber || '',
        });
        setSavedData(res.data);
      }
    } catch (err) {
      console.log("No data yet for", type);
      setSavedData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(form.userType);
  }, [form.userType]);

  // 2. Save karo
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(form).forEach(k => fd.append(k, form[k]));
    if (qrFile) fd.append('qrCode', qrFile);

    try {
      const res = await axios.post(API_URL, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSavedData(res.data);
      alert("Save ho gaya!");
    } catch (err) {
      console.log(err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 800, display: 'flex', gap: 30 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h2>Commission Setting</h2>
        
        <select value={form.userType} onChange={e => setForm({...form, userType: e.target.value})}>
          <option value="driver">Driver</option>
          <option value="truck">Truck</option>
          <option value="rentacar">Rent A Car</option>
          <option value="shop">Shop</option>
        </select>

        {loading ? <p>Loading...</p> : <>
          <input placeholder="Commission Price (e.g 1000)" type="number" value={form.commissionPrice} onChange={e => setForm({...form, commissionPrice: e.target.value})} required />
          <input placeholder="Account Name" value={form.accountName} onChange={e => setForm({...form, accountName: e.target.value})} required />
          <input placeholder="Account Number" value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} required />
          <input placeholder="JazzCash No" value={form.jazzcashNumber} onChange={e => setForm({...form, jazzcashNumber: e.target.value})} />
          <input placeholder="Easypaisa No" value={form.easypaisaNumber} onChange={e => setForm({...form, easypaisaNumber: e.target.value})} />
          <label>QR Code Upload:</label>
          <input type="file" accept="image/*" onChange={e => setQrFile(e.target.files[0])} />
          <button type="submit" style={{ padding: 10, background: '#000', color: '#fff' }}>Save Settings</button>
        </>}
      </form>

      {/* YE WOHI SHOW HOGA JO USER KO DIKHEGA */}
      {savedData && (
        <div style={{ flex: 1, border: '1px solid #ddd', padding: 15, borderRadius: 10 }}>
          <h3>Live Preview (User ko yehi dikhega)</h3>
          <p><b>Type:</b> {savedData.userType}</p>
          <p><b>Commission:</b> Rs. {savedData.commissionPrice}</p>
          <p><b>Account Name:</b> {savedData.accountName}</p>
          <p><b>Account Number:</b> {savedData.accountNumber}</p>
          {savedData.qrCodeUrl && <img src={savedData.qrCodeUrl} alt="QR" style={{ width: '200px', marginTop: 10 }} />}
        </div>
      )}
    </div>
  );
}