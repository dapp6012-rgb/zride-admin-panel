import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SplashFrontScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        navigate('SuperAdminDashboard');
      } else {
        navigate('AdminLoginScreen');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#FFD700', // Yellow Background
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {/* Logo Circle */}
      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#000',
        borderRadius: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <span style={{ color: '#FFD700', fontSize: '48px', fontWeight: '900' }}>Z</span>
      </div>

      {/* Name */}
      <h1 style={{
        marginTop: '20px',
        fontSize: '42px',
        fontWeight: '900',
        letterSpacing: '2px',
        color: '#000'
      }}>
        ZRide
      </h1>
      <p style={{
        marginTop: '-10px',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '6px',
        color: '#000',
        opacity: 0.7
      }}>
        ADMIN PANEL
      </p>

      {/* Loader */}
      <div style={{
        marginTop: '60px',
        width: '40px',
        height: '40px',
        border: '4px solid rgba(0,0,0,0.1)',
        borderTop: '4px solid #000',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SplashFrontScreen;