import { useState } from 'react';

export default function AdminLoginScreen({ onLogin, secureConfig, role }){
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(0);

  // Agar App.js se config aaye to wo use karo, warna ye default
  const ADMIN_EMAIL = secureConfig?.email || "admin@zride.com";
  const ADMIN_PASSWORD = secureConfig?.pass || "Zride@123!@#";

  const startLock = () => {
    setIsLocked(true);
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setIsLocked(false);
          setAttempts(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleLogin = () => {
    if (isLocked) return;

    if(email.trim() === ADMIN_EMAIL && pass === ADMIN_PASSWORD){
      localStorage.setItem("ZRide_auth", "true");
      localStorage.setItem("isAdmin", "true");
      onLogin(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      alert(`Wrong credentials! Attempt ${newAttempts}/3`);
      
      if(newAttempts >= 3){
        alert("3 Wrong attempts! Locked for 30 seconds");
        startLock();
      }
    }
  };

  return (
    <div style={{display:'flex', height:'100vh', justifyContent:'center', alignItems:'center', background:'#0f172a'}}>
      <div style={{background:'#fff', padding:30, borderRadius:16, width:340, textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
        <h2 style={{color:'#000', fontWeight:'900'}}>ZRide Admin</h2>
        <p style={{color:'#64748b', fontSize:12, marginTop:4}}>{role || 'Super Admin'} Only</p>
        
        <input 
          type="email" 
          placeholder="Admin Email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)}
          style={{width:'100%', padding:12, marginTop:20, borderRadius:8, border:'1px solid #e2e8f0', color:'#000', background:'#fff', outline:'none'}}
        />
        <input 
          type="password" 
          placeholder="Enter Password" 
          value={pass} 
          onChange={e=>setPass(e.target.value)}
          onKeyDown={(e)=> e.key === 'Enter' && handleLogin()}
          style={{width:'100%', padding:12, marginTop:10, borderRadius:8, border:'1px solid #e2e8f0', color:'#000', background:'#fff', outline:'none'}}
        />
        
        <button 
          onClick={handleLogin} 
          disabled={isLocked}
          style={{marginTop:15, width:'100%', padding:12, background: isLocked ? '#94a3b8' : '#000', color:'#A7E92F', fontWeight:'800', borderRadius:8, cursor: isLocked ? 'not-allowed' : 'pointer', border:'none'}}
        >
          {isLocked ? `Locked - Wait ${timer}s` : 'Secure Enter'}
        </button>

        <p style={{fontSize:10, color:'#94a3b8', marginTop:15}}>Protected • NoIndex • ZRide Internal</p>
      </div>
    </div>
  );
}