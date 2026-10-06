import { useEffect, useState } from 'react';
import { exportToExcel } from '../utils/exportExcel';

export default function Commission() {
  const [selectedMonth, setSelectedMonth] = useState("September 2026");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [charge, setCharge] = useState(3000);
  const [selectedProof, setSelectedProof] = useState(null);

  const months = ["September 2026", "August 2026", "July 2026", "June 2026", "May 2026"];

  useEffect(() => {
    async function fetchCommissionData() {
      setLoading(true);
      try {
        const stored = JSON.parse(localStorage.getItem('zride_drivers') || '[]');
        const savedCharge = localStorage.getItem('zride_commission_charge');
        if(savedCharge) setCharge(parseInt(savedCharge));

        const realData = stored.map(d => {
          const comm = d.commissions?.[selectedMonth] || {};
          return {
            id: d.id || d.phone,
            name: d.name || 'Driver',
            phone: d.phone || d.vehicleNumber || '-',
            vehicleNumber: d.vehicleNumber || '-',
            photo: d.photo || d.profilePic || null,
            status: comm.status || "Pending",
            date: comm.date || "-",
            proof: comm.proof || comm.proofImage || null,
            amount: comm.amount || charge,
            transactionId: comm.transactionId || "-",
          };
        });
        setDrivers(realData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommissionData();
  }, [selectedMonth, charge]);

  const totalDrivers = drivers.length;
  const paidDrivers = drivers.filter(d => d.status === 'Paid' || d.status === 'Verified').length;
  const pendingDrivers = totalDrivers - paidDrivers;
  const proofPending = drivers.filter(d => d.proof && d.status === 'Proof Sent').length;
  const totalCollection = paidDrivers * charge;
  const pendingAmount = pendingDrivers * charge;

  const updateStorage = (id, newComm) => {
    const stored = JSON.parse(localStorage.getItem('zride_drivers') || '[]');
    const newStored = stored.map(s => {
      if ((s.id || s.phone) === id) {
        return {...s, commissions: {...(s.commissions||{}), [selectedMonth]: {...(s.commissions?.[selectedMonth]||{}),...newComm } } }
      }
      return s;
    });
    localStorage.setItem('zride_drivers', JSON.stringify(newStored));
  };

  const markAsPaid = (id) => {
    setDrivers(prev => prev.map(d => d.id === id? {...d, status: 'Paid', date: new Date().toLocaleDateString()} : d));
    updateStorage(id, { status: 'Paid', date: new Date().toLocaleDateString(), amount: charge });
  };

  const verifyProof = (id) => {
    setDrivers(prev => prev.map(d => d.id === id? {...d, status: 'Verified', date: new Date().toLocaleDateString()} : d));
    updateStorage(id, { status: 'Verified', date: new Date().toLocaleDateString() });
    setSelectedProof(null);
  };

  const rejectProof = (id) => {
    setDrivers(prev => prev.map(d => d.id === id? {...d, status: 'Pending', proof: null } : d));
    updateStorage(id, { status: 'Pending', proof: null, proofImage: null });
    setSelectedProof(null);
  };

  const handleChargeChange = (newCharge) => {
    setCharge(newCharge);
    localStorage.setItem('zride_commission_charge', newCharge);
  };

  const handleExportExcel = () => {
    const formatted = filteredDrivers.map(d => ({
      DriverID: d.id,
      Name: d.name,
      Phone: d.phone,
      VehicleNumber: d.vehicleNumber,
      Month: selectedMonth,
      Amount: d.amount || charge,
      Status: d.status,
      PaidDate: d.date,
      TransactionID: d.transactionId,
      HasProof: d.proof? 'Yes' : 'No'
    }));
    exportToExcel(formatted, `ZRide_Commission_${selectedMonth}_${filter}`);
  };

  const filteredDrivers = drivers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search) || d.vehicleNumber.toLowerCase().includes(search.toLowerCase());
    if (filter === "All") return matchSearch;
    if (filter === "Proof") return matchSearch && d.proof;
    return matchSearch && d.status === filter;
  });

  if (loading) return <div style={{ padding: '40px', opacity: 0.6 }}>Loading commissions...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Monthly Commission - Rs {charge}</h1>
          <p style={{ opacity: 0.6, marginTop: '5px', fontSize: '13px' }}>InDrive Style - Driver se fixed monthly collection</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', color: '#fff', padding: '10px 14px', borderRadius: '10px' }}>
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
          <button onClick={handleExportExcel} style={{ background: '#16a34a', border: 0, color: '#fff', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
            📥 Export Excel
          </button>
        </div>
      </div>

      <div style={{ background: 'hsl(222 28% 13%)', border: '1px dashed #00d49a', borderRadius: '12px', padding: '14px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '13px' }}>⚙️ Fix Commission Amount</div>
          <div style={{ opacity: 0.6, fontSize: '11px', marginTop: '2px' }}>Sab drivers ke liye amount change karo</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ opacity: 0.7 }}>Rs</span>
          <input type="number" value={charge} onChange={e => handleChargeChange(parseInt(e.target.value) || 0)} style={{ background: '#000', border: '1px solid #333', color: '#00d49a', padding: '8px 12px', borderRadius: '8px', width: '100px', fontWeight: '800' }} />
          <button style={{ background: '#00d49a', border: 0, color: '#000', padding: '8px 14px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Save</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '15px', marginTop: '20px' }}>
        <div style={{ background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ opacity: 0.6, fontSize: '11px' }}>TOTAL DRIVERS</div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>{totalDrivers}</div>
        </div>
        <div style={{ background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ opacity: 0.6, fontSize: '11px' }}>PROOF PENDING</div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px', color: '#00aaff' }}>{proofPending}</div>
        </div>
        <div style={{ background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', borderRadius: '14px', padding: '18px' }}>
          <div style={{ opacity: 0.6, fontSize: '11px' }}>PENDING COLLECTION</div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px', color: '#ffcc00' }}>Rs {pendingAmount}</div>
        </div>
        <div style={{ background: '#00d49a', borderRadius: '14px', padding: '18px', color: '#000' }}>
          <div style={{ fontSize: '11px', fontWeight: '700' }}>COLLECTED ({selectedMonth})</div>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '5px' }}>Rs {totalCollection}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
        <input placeholder="Search driver, phone, plate..." value={search} onChange={e=>setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', color: '#fff', padding: '10px 14px', borderRadius: '10px' }} />
        {["All", "Pending", "Proof", "Paid", "Verified"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ background: filter===f? '#fff' : 'hsl(222 28% 13%)', color: filter===f? '#000' : '#fff', border: '1px solid hsl(220 20% 23%)', padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>{f}</button>
        ))}
      </div>

      <div style={{ marginTop: '20px', background: 'hsl(222 28% 13%)', border: '1px solid hsl(220 20% 23%)', borderRadius: '14px', padding: '10px', overflowX: 'auto' }}>
        {filteredDrivers.length === 0? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>Koi driver nahi mila</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ opacity: 0.5, fontSize: '11px', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>DRIVER</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>PROOF PIC</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map(d => (
                <tr key={d.id} style={{ borderTop: '1px solid hsl(220 20% 23%)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d.photo? <img src={d.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{d.name[0]}</span>}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{d.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.6 }}>{d.vehicleNumber} | {d.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>Rs {d.amount || charge}</td>
                  <td>
                    <span style={{ background: d.status==='Verified' || d.status==='Paid'? 'rgba(0,212,154,0.15)' : d.status==='Proof Sent'? 'rgba(0,170,255,0.15)' : 'rgba(255,200,0,0.15)', color: d.status==='Verified' || d.status==='Paid'? '#00d49a' : d.status==='Proof Sent'? '#00aaff' : '#ffcc00', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{d.status}</span>
                  </td>
                  <td>
                    {d.proof? (
                      <img src={d.proof} onClick={()=>setSelectedProof(d)} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '2px solid #00aaff' }} />
                    ) : <span style={{ opacity: 0.3, fontSize: '11px' }}>No Proof</span>}
                  </td>
                  <td>
                    {d.status === 'Proof Sent'? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={()=>setSelectedProof(d)} style={{ background: '#00aaff', border: 0, color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>View</button>
                        <button onClick={()=>verifyProof(d.id)} style={{ background: '#00d49a', border: 0, color: '#000', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Verify</button>
                      </div>
                    ) : d.status === 'Pending'? (
                      <button onClick={() => markAsPaid(d.id)} style={{ background: '#00d49a', border: 0, color: '#000', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>Mark Paid</button>
                    ) : (
                      <span style={{ opacity: 0.5, fontSize: '11px' }}>{d.date}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedProof && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={()=>setSelectedProof(null)}>
          <div style={{ background: '#1a1f2e', borderRadius: '16px', padding: '20px', maxWidth: '400px', width: '100%', border: '1px solid #2a3245' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <div style={{ fontWeight: '800' }}>{selectedProof.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{selectedProof.vehicleNumber}</div>
              </div>
              <button onClick={()=>setSelectedProof(null)} style={{ background: '#2a3245', border: 0, color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}>X</button>
            </div>
            <img src={selectedProof.proof} style={{ width: '100%', borderRadius: '12px', maxHeight: '60vh', objectFit: 'contain', background: '#000' }} />
            <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>Txn ID: {selectedProof.transactionId}</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={()=>rejectProof(selectedProof.id)} style={{ flex: 1, background: '#ff4444', border: 0, color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Reject</button>
              <button onClick={()=>verifyProof(selectedProof.id)} style={{ flex: 1, background: '#00d49a', border: 0, color: '#000', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Verify & Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}