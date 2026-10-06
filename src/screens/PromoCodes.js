import React, { useState, useEffect } from 'react';

import { API_URL } from '../lib/api';

export default function PromoCodes() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: 50, maxDiscount: 200, minFare: 0, maxUses: 100, expiryDate: '', description: '' });
  const [expiryParts, setExpiryParts] = useState({ mm: '', dd: '', yyyy: '' });

  const fetchPromos = async () => {
    const res = await fetch(`${API_URL}/promo/list`);
    const data = await res.json();
    if (data.success) setPromos(data.promos);
  };

  useEffect(() => { fetchPromos(); }, []);

  // MM DD YYYY ko real expiryDate me convert
  useEffect(() => {
    const { mm, dd, yyyy } = expiryParts;
    if (mm && dd && yyyy && yyyy.length === 4) {
      // YYYY-MM-DD format banega backend ke liye
      const m = mm.padStart(2, '0');
      const d = dd.padStart(2, '0');
      if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
        setForm(f => ({...f, expiryDate: `${yyyy}-${m}-${d}` }));
      }
    }
  }, [expiryParts]);

  const handleExpiryChange = (field, value) => {
    // sirf numbers
    let val = value.replace(/\D/g, '');
    if (field === 'mm' && val.length > 2) val = val.slice(0,2);
    if (field === 'dd' && val.length > 2) val = val.slice(0,2);
    if (field === 'yyyy' && val.length > 4) val = val.slice(0,4);
    setExpiryParts(prev => ({...prev, [field]: val }));
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.expiryDate) return alert('Code and Expiry (MM DD YYYY) required');
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      expiryDate: `${form.expiryDate}T23:59:59.999Z`,
      isActive: true,
    };
    const res = await fetch(`${API_URL}/promo/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) {
      alert('Promo Created');
      fetchPromos();
      setForm({ code: '', discountType: 'percentage', discountValue: 50, maxDiscount: 200, minFare: 0, maxUses: 100, expiryDate: '', description: '' });
      setExpiryParts({ mm: '', dd: '', yyyy: '' });
    }
    else alert(data.message);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this code?')) return;
    await fetch(`${API_URL}/promo/${id}`, { method: 'DELETE' });
    fetchPromos();
  };

  return (
    <div style={{ padding: 24, background: '#000000', minHeight: '100vh' }}>
      <h2 style={{ color: '#FFFFFF', fontWeight: 900 }}>Promo Code Management</h2>

      {/* CREATE FORM */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input placeholder="CODE (e.g. ZIDE50)" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase() })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />
        <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }}>
          <option value="percentage" style={{background:'#000', color:'#fff'}}>Percentage %</option>
          <option value="flat" style={{background:'#000', color:'#fff'}}>Flat PKR</option>
        </select>
        <input type="number" placeholder="Discount Value" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />
        <input type="number" placeholder="Max Discount PKR" value={form.maxDiscount} onChange={e => setForm({...form, maxDiscount: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />
        <input type="number" placeholder="Min Fare" value={form.minFare} onChange={e => setForm({...form, minFare: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />
        <input type="number" placeholder="Max Uses" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />

        {/* MM DD YYYY ALAG ALAG BOX */}
        <div style={{ display: 'flex', gap: 8, gridColumn: '1fr' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700 }}>MM</label>
            <input placeholder="MM" value={expiryParts.mm} onChange={e => handleExpiryChange('mm', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000', textAlign:'center' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700 }}>DD</label>
            <input placeholder="DD" value={expiryParts.dd} onChange={e => handleExpiryChange('dd', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000', textAlign:'center' }} />
          </div>
          <div style={{ flex: 1.5 }}>
            <label style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 700 }}>YYYY</label>
            <input placeholder="YYYY" value={expiryParts.yyyy} onChange={e => handleExpiryChange('yyyy', e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000', textAlign:'center' }} />
          </div>
        </div>

        <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value })} style={{ padding: 10, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#FFFFFF', background: '#000000' }} />

        {form.expiryDate && <p style={{ color: '#A7E92F', fontSize: 12, gridColumn: 'span 2', margin: 0 }}>Selected Expiry: {expiryParts.mm}/{expiryParts.dd}/{expiryParts.yyyy} ({form.expiryDate})</p>}

        <button onClick={handleCreate} style={{ gridColumn: 'span 2', background: '#A7E92F', color: '#000000', padding: 12, borderRadius: 8, fontWeight: 800, cursor: 'pointer', border: 0 }}>Create Promo Code</button>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: '#FFFFFF' }}>All Promo Codes ({promos.length})</h3>
        {promos.map(p => (
          <div key={p._id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 14, borderRadius: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a' }}>
            <div>
              <b style={{ color: '#FFFFFF', fontSize: 16 }}>{p.code}</b> <span style={{ background: p.isActive? '#00C853' : '#FF3B30', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{p.isActive? 'ACTIVE' : 'INACTIVE'}</span>
              <p style={{ margin: '4px 0 0', color: '#FFFFFF', fontSize: 13 }}>{p.discountValue}{p.discountType === 'percentage'? '% off' : ' PKR off'} | Used {p.usedCount}/{p.maxUses} | Exp: {new Date(p.expiryDate).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleDelete(p._id)} style={{ background: '#FF3B30', color: '#fff', border: 0, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}