import { useState, useCallback, useEffect } from 'react';
import { Shell, Toast } from './components/ControlRoom';
import './index.css';
import React from 'react';
import NoInternetBanner from './components/NoInternetBanner';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AnalyticsReports from './screens/AnalyticsReports';
import CityDashboard from './screens/CityDashboard';
import DriverOnboarding from './screens/DriverOnboarding';
import DriverPerformance from './screens/DriverPerformance';
import VehicleTypes from './screens/VehicleTypes';
import Commission from './screens/Commission';
import ComplaintsSupportRider from './screens/ComplaintsSupportRider';
import ComplaintsSupportDriver from './screens/ComplaintsSupportDriver';
import CallLogs from './screens/CallLogs';
import UsersHistory from './screens/UsersHistory';
import Notifications from './screens/Notifications';
import PromoCodes from './screens/PromoCodes';
import RatingsReviewsMonitor from './screens/RatingsReviewsMonitor';
import RoleSelectScreen from './screens/RoleSelectScreen';
import SOSCenter from './screens/SOSCenter';
import SplashFrontScreen from './screens/SplashFrontScreen';
import SuperAdminDashboard from './screens/SuperAdminDashboard';
import UsersManagement from './screens/UsersManagement';
import ZoneManagement from './screens/ZoneManagement';
import AdminShowRoomVerificationScreen from './screens/AdminShowRoomVerificationScreen';
import AdminShopVerification from './screens/AdminShopVerification';
import AdminAddBanner from './screens/AdminAddBanner';
import AdminAddCityScreen from './screens/AdminAddCityScreen';
import TruckRequestScreen from './screens/TruckRequestScreen';

// ===== 4 HISTORY SCREENS ADDED =====
import ShopLoginHistoryScreen from './screens/ShopLoginHistoryScreen';
import TruckDriverHistoryScreen from './screens/TruckDriverHistoryScreen';
import ShowRoomOwnerHistory from './screens/ShowRoomOwnerHistory';
import DriverHistoryScreen from './screens/DriverHistoryScreen';

const SECURE_ADMIN = {
  email: "dapp6012@gmail.com",
  pass: "hammad55443321"
};

class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, error }; }
  componentDidCatch(error, info){ console.error("Screen Crash:", error, info); }
  render(){
    if(this.state.hasError){
      return (
        <div style={{ padding: 40, background: '#fff', color: '#000', borderRadius: 12, margin: 20 }}>
          <h2 style={{color: 'red'}}>Screen Crash: {this.props.screenName}</h2>
          <pre style={{ background: '#f1f5f9', padding: 12, overflow: 'auto', fontSize: 12 }}>{this.state.error?.message}</pre>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }} style={{ marginTop: 12, padding: '8px 16px', background: '#000', color: '#fff', borderRadius: 8 }}>Go to Login</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SCREENS_MAP = {
  'dashboard': SuperAdminDashboard, 'super-admin': SuperAdminDashboard,
  'city-dashboard': CityDashboard, 'city-onboarding': DriverOnboarding,
  'city-driver-onboarding': DriverOnboarding, 'city-performance': DriverPerformance,
  'city-driver-performance': DriverPerformance, 'city-vehicles': VehicleTypes,
  'city-vehicle-type': VehicleTypes, 'zones': ZoneManagement,
  'zone-management': ZoneManagement, 'add-city': AdminAddCityScreen,
  'admin-add-city': AdminAddCityScreen, 'commission': Commission,
  'users': UsersManagement, 'user-management': UsersManagement,
  'rides': UsersHistory, 'live-rides-history': UsersHistory,
  'live-passenger-history': UsersHistory, 'passenger-history': UsersHistory,
  'users-history': UsersHistory, 'users-rides-history': UsersHistory,
  'user-history': UsersHistory, 'user-rides-history': UsersHistory,
  'complaints': ComplaintsSupportRider, 'complaints-rider': ComplaintsSupportRider,
  'complaints-support': ComplaintsSupportRider, 'complaints-support-rider': ComplaintsSupportRider,
  'complaints-driver': ComplaintsSupportDriver, 'complaints-support-driver': ComplaintsSupportDriver,
  'calls': CallLogs, 'call-logs': CallLogs, 'direct-call-logs': CallLogs,
  'ratings': RatingsReviewsMonitor, 'rating-reviews-monitor': RatingsReviewsMonitor,
  'sos-center': SOSCenter, 'analytics': AnalyticsReports,
  'analytics-report': AnalyticsReports, 'notifications': Notifications,
  'bulk': PromoCodes, 'promo-code': PromoCodes,

  // ===== SHOWROOM / SHOP VERIFICATION =====
  'shop-requests': AdminShopVerification,
  'showroom-verification': AdminShowRoomVerificationScreen,
  'show-room-verification': AdminShowRoomVerificationScreen,
  'admin-showroom-verification': AdminShowRoomVerificationScreen,
  'admin-shop-verification': AdminShopVerification,
  'shop-verification': AdminShopVerification,
  'admin-shop-verification-screen': AdminShopVerification,
  'shop-verification-screen': AdminShopVerification,

  'banners': AdminAddBanner,
  'banner-manager': AdminAddBanner,
  'truck-verification': TruckRequestScreen,
  'truck-verifications': TruckRequestScreen,
  'truck-driver-verification': TruckRequestScreen,
  'driver-verification': TruckRequestScreen,

  // ===== 4 HISTORY SCREENS =====
  'shop-history': ShopLoginHistoryScreen,
  'shop-login-history': ShopLoginHistoryScreen,
  'shop-mode-history': ShopLoginHistoryScreen,

  'truck-history': TruckDriverHistoryScreen,
  'truck-login-history': TruckDriverHistoryScreen,
  'truck-driver-history': TruckDriverHistoryScreen,
  'truck-mode-history': TruckDriverHistoryScreen,

  'showroom-history': ShowRoomOwnerHistory,
  'showroom-owner-history': ShowRoomOwnerHistory,
  'showroom-login-history': ShowRoomOwnerHistory,
  'show-room-history': ShowRoomOwnerHistory,

  'driver-history': DriverHistoryScreen,
  'ride-driver-history': DriverHistoryScreen,
  'drivers-history': DriverHistoryScreen,
  'driver-login-history': DriverHistoryScreen,
  'ride-drivers-history': DriverHistoryScreen,
};

export default function App() {
  const [stage, setStage] = useState(() => sessionStorage.getItem('ZRide_stage') || 'splash');
  const [role, setRole] = useState(() => sessionStorage.getItem('ZRide_role') || 'Super Admin');
  const [screen, setScreen] = useState(() => {
    const saved = sessionStorage.getItem('ZRide_screen') || 'dashboard';
    return SCREENS_MAP[saved]? saved : 'dashboard';
  });
  const [toast, setToast] = useState('');
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('ZRide_auth') === 'true');

  useEffect(() => {
    document.title = "ZRide Admin";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
    localStorage.removeItem('ZRide_auth');
    localStorage.removeItem('ZRide_stage');
    localStorage.removeItem('ZRide_role');
    localStorage.removeItem('ZRide_screen');
  }, []);

  useEffect(() => {
    sessionStorage.setItem('ZRide_stage', stage);
    sessionStorage.setItem('ZRide_role', role);
    sessionStorage.setItem('ZRide_screen', screen);
  }, [stage, role, screen]);

  const notify = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const handleLogin = useCallback(() => {
    sessionStorage.setItem('ZRide_auth', 'true');
    setIsAuth(true);
    setRole('Super Admin');
    setScreen('dashboard');
    setStage('app');
    notify('Super Admin login success');
  }, [notify]);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    setIsAuth(false);
    setRole('Super Admin');
    setScreen('dashboard');
    setStage('splash');
  }, []);

  const ActiveScreen = SCREENS_MAP[screen] || SuperAdminDashboard;

  return (
    <>
      <NoInternetBanner />

      {stage === 'splash' && <SplashFrontScreen onContinue={() => {
        setRole('Super Admin');
        setStage('login');
      }} />}

      {stage === 'login' && <AdminLoginScreen role={role} onLogin={handleLogin} secureConfig={SECURE_ADMIN} />}

      {stage === 'app' && isAuth && (
        <div className="app min-h-screen bg-[#F8FAFC] text-black">
          <Shell role={role} screen={screen} setScreen={setScreen} onLogout={handleLogout}>
            <ErrorBoundary screenName={screen}>
              <ActiveScreen notify={notify} setScreen={setScreen} />
            </ErrorBoundary>
          </Shell>
          <Toast message={toast} />
        </div>
      )}
    </>
  );
}