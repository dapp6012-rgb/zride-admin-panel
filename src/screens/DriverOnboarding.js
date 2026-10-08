import { useState, useEffect } from 'react';
import { Badge, DataScreen, SectionCard, ScreenFrame } from '../components/ControlRoom';
import { API_BASE_URL as API_URL } from '../lib/api';
import { exportExcel } from '../utils/exportExcel';
import ExcelExportButton from '../components/ExcelExportButton';
import { Button } from '../components/ControlRoom';

export default function DriverOnboarding({ notify }) {
  const [applicants, setApplicants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers`);
      const data = await res.json();
      setApplicants(data.drivers || data.data || []);
    } catch(e){ console.log(e) }
  };

  useEffect(() => { fetchDrivers(); const id = setInterval(fetchDrivers, 5000); return () => clearInterval(id); }, []);

  const handleAction = async (driverId, status) => {
    const nextStatus = status === 'rejected'? 'rejected' : 'approved';
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${encodeURIComponent(driverId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (!res.ok || result.success === false ||!result.driver) {
        throw new Error(result.message || `Approval API returned ${res.status}`);
      }
      notify(nextStatus === 'approved'? 'Driver Approved ✅' : 'Driver Rejected ❌');
      setSelected(null);
      await fetchDrivers();
    } catch(e){ notify('Error: '+e.message) }
    setLoading(false);
  };

  const handleDelete = async (driver) => {
    if (driver.status!== 'rejected') return;
    const driverId = driver.driverId || driver.id || driver._id;
    if (!window.confirm('Delete this rejected driver permanently?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/drivers/${encodeURIComponent(driverId)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        throw new Error(result.message || `Delete API returned ${res.status}`);
      }
      if (selected && String(selected.driverId || selected.id || selected._id) === String(driverId)) {
        setSelected(null);
      }
      notify('Rejected driver deleted ✅');
      await fetchDrivers();
    } catch (e) {
      notify('Delete error: ' + e.message);
    }
    setLoading(false);
  };

  const handleExportExcel = () => {
    const formatted = applicants.map(a => ({
      Driver: `${a.basicInfo?.name || a.name || 'Unknown'} (${a.driverId || '-'})`,
      CNICPhone: `${a.basicInfo?.cnic || a.cnic || 'No CNIC'} / ${a.basicInfo?.phone || a.phone || '-'}`,
      Email: a.basicInfo?.email || a.email || '-',
      Vehicle: `${a.vehicleInfo?.model || a.vehicleModel || '-'} ${a.vehicleInfo?.numberPlate || a.carNumber || ''}`.trim(),
      Status: a.status || '',
      Action: a.status === 'rejected' ? 'View All Info / Delete' : 'View All Info',
    }));
    exportExcel(formatted, 'DriverOnboarding');
  };

  const getPic = (obj,...keys) => {
    for (let k of keys) {
      const parts = k.split('.');
      let val = obj;
      for (let p of parts) { val = val?.[p]; }
      if (val && typeof val === 'string' && val.length > 50 &&!/^(file|content):\/\//i.test(val)) return val;
    }
    return null;
  };

  return (
    <div className="text-white">
    <ScreenFrame title="Driver Verification Center" description="Real InDrive style verification - All driver docs." actions={<div style={{display:'flex', gap:8}}><ExcelExportButton onClick={handleExportExcel} /></div>}>

      <div className="grid two-col">
        <SectionCard title="Queue Status" meta="LIVE">
          <div className="grid stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="stat"><div className="stat-label text-white">Pending</div><div className="stat-value text-white">{applicants.filter(a=>a.status==='pending').length}</div></div>
            <div className="stat"><div className="stat-label text-white">Approved</div><div className="stat-value text-white">{applicants.filter(a=>a.status==='approved').length}</div></div>
            <div className="stat"><div className="stat-label text-white">Rejected</div><div className="stat-value text-white">{applicants.filter(a=>a.status==='rejected').length}</div></div>
          </div>
        </SectionCard>
        <SectionCard title="Selected Driver" meta="DETAIL">
          {selected? (
            <div className="text-white">
              <h3 style={{fontSize:18, fontWeight:'bold', color:'white'}}>{selected.basicInfo?.name || selected.name} - {selected.driverId}</h3>
              <p style={{color:'white', fontSize:12}}>Status: {selected.status}</p>
              <div style={{marginTop:10, display:'flex', gap:10}}>
                {selected.status === 'approved' ? (
                  <div style={{background:'#22c55e', color:'white', padding:'8px 16px', borderRadius:20, fontWeight:'bold'}}>✅ Already Approved</div>
                ) : (
                  <>
                    <Button variant="primary" disabled={loading} onClick={()=>handleAction(selected.driverId, 'approved')}>✅ Approve</Button>
                    <Button variant="ghost" disabled={loading} onClick={()=>handleAction(selected.driverId, 'rejected')} style={{background:'#ff4444', color:'white'}}>❌ Reject</Button>
                  </>
                )}
                <Button variant="ghost" onClick={()=>setSelected(null)}>Close</Button>
              </div>
            </div>
          ) : <p style={{color:'white'}}>Kisi driver par click karo detail dekhne ke liye</p>}
        </SectionCard>
      </div>

      <div style={{ marginTop: 16 }} className="text-white">
        <DataScreen
          title={`All Drivers (${applicants.length})`}
          description="Driver app se real data"
          rows={applicants}
          columns={['Driver', 'CNIC/Phone', 'Gmail', 'Vehicle', 'Status', 'Action']}
          renderRow={a => (
            <tr key={a._id} style={{cursor:'pointer', color:'white'}}>
              <td style={{color:'white'}}><b style={{color:'white'}}>{a.basicInfo?.name || a.name || 'Unknown'}</b><small style={{ display: 'block', color: 'white' }}>{a.driverId}</small></td>
              <td style={{color:'white'}}><span style={{color:'white'}}>{a.basicInfo?.cnic || a.cnic || 'No CNIC'}</span><small style={{display:'block', color:'white'}}>{a.basicInfo?.phone || a.phone}</small></td>
              <td style={{color:'white'}}>{a.basicInfo?.email || a.email || '-'}</td>
              <td style={{color:'white'}}><span style={{color:'white'}}>{a.vehicleInfo?.model || a.vehicleModel || '-'} {a.vehicleInfo?.numberPlate || a.carNumber || ''}</span></td>
              <td><Badge tone={a.status==='approved'?'good':a.status==='rejected'?'bad':'warn'}>{a.status}</Badge></td>
              <td style={{display:'flex', gap:8, alignItems:'center'}}>
                <Button variant="ghost" onClick={() => setSelected(a)}>View All Info</Button>
                {a.status === 'rejected' && (
                  <Button variant="ghost" disabled={loading} onClick={() => handleDelete(a)} style={{background:'#991b1b', color:'white'}}>🗑️ Delete</Button>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      {selected && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:9999, overflowY:'auto', padding:20}}>
          <div style={{background:'#1a1a1a', maxWidth:900, margin:'0 auto', borderRadius:16, padding:24, color:'white', border:'1px solid rgba(255,255,255,0.1)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h2 style={{fontSize:22, fontWeight:'bold', color:'white'}}>Driver Full Verification - {selected.basicInfo?.name || selected.name}</h2>
              <Button variant="ghost" onClick={()=>setSelected(null)}>X Close</Button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:20}}>
              <div style={{background:'#272727', padding:16, borderRadius:12, color:'white'}}>
                <h4 style={{color:'white', marginBottom:10}}>👤 Basic Info</h4>
                <p style={{color:'white'}}><b style={{color:'white'}}>Name:</b> {selected.basicInfo?.name || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Phone:</b> {selected.basicInfo?.phone || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>CNIC:</b> {selected.basicInfo?.cnic || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>City:</b> {selected.basicInfo?.city || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Email:</b> {selected.basicInfo?.email || '-'}</p>
                <div style={{marginTop:12}}>
                  <small style={{color:'white'}}>Basic Info Photo</small>
                  {getPic(selected, 'basicInfo.photo', 'basicInfo.profilePhoto', 'basicInfo.driverPhoto', 'photo', 'profilePhoto', 'driverPhoto')?
                    <img src={getPic(selected, 'basicInfo.photo', 'basicInfo.profilePhoto', 'basicInfo.driverPhoto', 'photo', 'profilePhoto', 'driverPhoto')} alt="Basic info profile" style={{display:'block', width:140, height:140, objectFit:'cover', borderRadius:8, marginTop:4, border:'1px solid #444'}} />
                    : <div style={{background:'#333', width:140, height:100, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white'}}>No Image</div>}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12}}>
                  <div>
                    <small style={{color:'white'}}>CNIC Front (Basic)</small>
                    {getPic(selected, 'basicInfo.cnicFrontPic', 'basicInfo.cnicFront', 'basicInfo.cnic_front', 'cnicFront', 'cnicFrontPic', 'documents.cnicFront')?
                      <img src={getPic(selected, 'basicInfo.cnicFrontPic', 'basicInfo.cnicFront', 'basicInfo.cnic_front', 'cnicFront', 'cnicFrontPic', 'documents.cnicFront')} style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, marginTop:4, border:'1px solid #444'}} />
                      : <div style={{background:'#333', height:120, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white'}}>No Image</div>}
                  </div>
                  <div>
                    <small style={{color:'white'}}>CNIC Back (Basic)</small>
                    {getPic(selected, 'basicInfo.cnicBackPic', 'basicInfo.cnicBack', 'basicInfo.cnic_back', 'cnicBack', 'cnicBackPic', 'documents.cnicBack')?
                      <img src={getPic(selected, 'basicInfo.cnicBackPic', 'basicInfo.cnicBack', 'basicInfo.cnic_back', 'cnicBack', 'cnicBackPic', 'documents.cnicBack')} style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, marginTop:4, border:'1px solid #444'}} />
                      : <div style={{background:'#333', height:120, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'white'}}>No Image</div>}
                  </div>
                </div>
              </div>
              <div style={{background:'#272727', padding:16, borderRadius:12, color:'white'}}>
                <h4 style={{color:'white', marginBottom:10}}>🏍️ Vehicle Info</h4>
                <p style={{color:'white'}}><b style={{color:'white'}}>Type:</b> {selected.vehicleInfo?.type || selected.vehicleType || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Company:</b> {selected.vehicleInfo?.company || selected.make || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Model:</b> {selected.vehicleInfo?.model || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Year:</b> {selected.vehicleInfo?.year || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Number Plate:</b> {selected.vehicleInfo?.numberPlate || selected.carNumber || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Color:</b> {selected.vehicleInfo?.color || '-'}</p>
              </div>
              <div style={{background:'#272727', padding:16, borderRadius:12, color:'white'}}>
                <h4 style={{color:'white', marginBottom:10}}>🪪 Licence Info</h4>
                <p style={{color:'white'}}><b style={{color:'white'}}>Licence No:</b> {selected.licenceInfo?.licenceNumber || selected.licenceNumber || '-'}</p>
                <p style={{color:'white'}}><b style={{color:'white'}}>Expiry:</b> {selected.licenceInfo?.expiry || '-'}</p>
              </div>
              <div style={{background:'#272727', padding:16, borderRadius:12, color:'white'}}>
                <h4 style={{color:'white', marginBottom:10}}>🤳 Selfie with Licence</h4>
                {getPic(selected, 'selfie', 'selfieWithLicence', 'basicInfo.selfie', 'documents.selfie')? <img src={getPic(selected, 'selfie', 'selfieWithLicence', 'basicInfo.selfie', 'documents.selfie')} alt="selfie" style={{width:'100%', height:200, objectFit:'cover', borderRadius:8, border:'1px solid #333'}} /> : <p style={{color:'white'}}>No Selfie</p>}
              </div>
              <div style={{gridColumn:'span 2', background:'#272727', padding:16, borderRadius:12, color:'white'}}>
                <h4 style={{color:'white', marginBottom:10}}>📸 All Uploaded Documents (Real Pics)</h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
                  <div><small style={{color:'white'}}>CNIC Front</small><br/>{getPic(selected, 'basicInfo.cnicFrontPic', 'basicInfo.cnicFront', 'cnicFront', 'cnicFrontPic')? <img src={getPic(selected, 'basicInfo.cnicFrontPic', 'basicInfo.cnicFront', 'cnicFront', 'cnicFrontPic')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                  <div><small style={{color:'white'}}>CNIC Back</small><br/>{getPic(selected, 'basicInfo.cnicBackPic', 'basicInfo.cnicBack', 'cnicBack', 'cnicBackPic')? <img src={getPic(selected, 'basicInfo.cnicBackPic', 'basicInfo.cnicBack', 'cnicBack', 'cnicBackPic')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                  <div><small style={{color:'white'}}>Licence Front</small><br/>{getPic(selected, 'licenceInfo.licenceFrontPic', 'licenceInfo.licenceFront', 'licenceFront', 'licenceFrontPic')? <img src={getPic(selected, 'licenceInfo.licenceFrontPic', 'licenceInfo.licenceFront', 'licenceFront', 'licenceFrontPic')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                  <div><small style={{color:'white'}}>Vehicle Front</small><br/>{getPic(selected, 'vehicleInfo.vehicleFrontPic', 'vehicleInfo.frontPic', 'vehicleFront', 'vehicleFrontPic', 'frontPic')? <img src={getPic(selected, 'vehicleInfo.vehicleFrontPic', 'vehicleInfo.frontPic', 'vehicleFront', 'vehicleFrontPic', 'frontPic')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                  <div><small style={{color:'white'}}>Vehicle Back</small><br/>{getPic(selected, 'vehicleInfo.vehicleBackPic', 'vehicleInfo.backPic', 'vehicleBack', 'vehicleBackPic', 'backPic')? <img src={getPic(selected, 'vehicleInfo.vehicleBackPic', 'vehicleInfo.backPic', 'vehicleBack', 'vehicleBackPic', 'backPic')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                  <div><small style={{color:'white'}}>Selfie</small><br/>{getPic(selected, 'selfie', 'selfieWithLicence')? <img src={getPic(selected, 'selfie', 'selfieWithLicence')} style={{width:'100%', height:150, objectFit:'cover', borderRadius:8}} /> : <div style={{background:'#333', height:150, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>No Image</div>}</div>
                </div>
              </div>
            </div>

            {/* ====== FINAL CHANGE - APPROVE KE BAAD BUTTON GAYAB ====== */}
            <div style={{display:'flex', gap:12, marginTop:20, justifyContent:'flex-end', alignItems:'center'}}>
              {selected.status === 'approved' ? (
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <div style={{background:'#22c55e', color:'white', padding:'12px 24px', borderRadius:8, fontWeight:'bold'}}>✅ Already Approved - No Action Needed</div>
                  <button onClick={()=>setSelected(null)} style={{background:'#333', color:'white', padding:'12px 24px', borderRadius:8, border:'none', cursor:'pointer'}}>Close</button>
                </div>
              ) : selected.status === 'rejected' ? (
                <>
                  <button onClick={() => handleDelete(selected)} disabled={loading} style={{background:'#991b1b', color:'white', padding:'12px 24px', borderRadius:8, fontWeight:'bold', border:'none', cursor:'pointer'}}>🗑️ Delete</button>
                  <div style={{background:'#ef4444', color:'white', padding:'12px 24px', borderRadius:8, fontWeight:'bold'}}>❌ Already Rejected</div>
                  <button onClick={()=>setSelected(null)} style={{background:'#333', color:'white', padding:'12px 24px', borderRadius:8, border:'none', cursor:'pointer'}}>Close</button>
                </>
              ) : (
                <>
                  <button onClick={()=>handleAction(selected.driverId, 'rejected')} disabled={loading} style={{background:'#ef4444', color:'white', padding:'12px 24px', borderRadius:8, fontWeight:'bold', border:'none', cursor:'pointer'}}>❌ Reject Driver</button>
                  <button onClick={()=>handleAction(selected.driverId, 'approved')} disabled={loading} style={{background:'#22c55e', color:'white', padding:'12px 24px', borderRadius:8, fontWeight:'bold', border:'none', cursor:'pointer'}}>✅ Approve & Activate</button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </ScreenFrame>
    </div>
  );
}