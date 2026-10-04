import { useState, lazy, Suspense, useCallback, useEffect, memo } from 'react';
import { Shell, Toast } from './components/ControlRoom';
import './index.css';
import React from 'react';

// --- SECURITY CONFIG - inDrive jaisa secure ---
const SECURE_ADMIN = {
  email: "dapp6012@gmail.com", // <-- Yahan apna admin email daalo
  pass: "hammad55443321" // <-- Yahan strong password daalo
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
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: 12, padding: '8px 16px', background: '#000', color: '#fff', borderRadius: 8 }}>Go to Login</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminLoginScreen = lazy(() => import('./screens/AdminLoginScreen'));
const AnalyticsReports = lazy(() => import('./screens/AnalyticsReports'));
const CityDashboard = lazy(() => import('./screens/CityDashboard'));
const DriverOnboarding = lazy(() => import('./screens/DriverOnboarding'));
const DriverPerformance = lazy(() => import('./screens/DriverPerformance'));
const VehicleTypes = lazy(() => import('./screens/VehicleTypes'));
const Commission = lazy(() => import('./screens/Commission'));
const ComplaintsSupportRider = lazy(() => import('./screens/ComplaintsSupportRider'));
const ComplaintsSupportDriver = lazy(() => import('./screens/ComplaintsSupportDriver'));
const CallLogs = lazy(() => import('./screens/CallLogs'));
const PassengerHistory = lazy(() => import('./screens/PassengerHistory'));
const Notifications = lazy(() => import('./screens/Notifications'));
const PromoCodes = lazy(() => import('./screens/PromoCodes'));
const RatingsReviewsMonitor = lazy(() => import('./screens/RatingsReviewsMonitor'));
const RoleSelectScreen = lazy(() => import('./screens/RoleSelectScreen'));
const SOSCenter = lazy(() => import('./screens/SOSCenter'));
const SplashFrontScreen = lazy(() => import('./screens/SplashFrontScreen'));
const SuperAdminDashboard = lazy(() => import('./screens/SuperAdminDashboard'));
const UsersManagement = lazy(() => import('./screens/UsersManagement'));
const ZoneManagement = lazy(() => import('./screens/ZoneManagement'));
const AdminShopRequestsScreen = lazy(() => import('./screens/AdminShopRequestsScreen'));
const AdminAddBanner = lazy(() => import('./screens/AdminAddBanner'));
const AdminAddCityScreen = lazy(() => import('./screens/AdminAddCityScreen'));

const SCREENS_MAP = {
  'dashboard': SuperAdminDashboard, 'super-admin': SuperAdminDashboard,
  'city-dashboard': CityDashboard, 'city-onboarding': DriverOnboarding,
  'city-driver-onboarding': DriverOnboarding, 'city-performance': DriverPerformance,
  'city-driver-performance': DriverPerformance, 'city-vehicles': VehicleTypes,
  'city-vehicle-type': VehicleTypes, 'zones': ZoneManagement,
  'zone-management': ZoneManagement, 'add-city': AdminAddCityScreen,
  'admin-add-city': AdminAddCityScreen, 'commission': Commission,
  'users': UsersManagement, 'user-management': UsersManagement,
  'rides': PassengerHistory, 'live-rides-history': PassengerHistory,
  'live-passenger-history': PassengerHistory, 'passenger-history': PassengerHistory,
  'complaints': ComplaintsSupportRider, 'complaints-rider': ComplaintsSupportRider,
  'complaints-support': ComplaintsSupportRider, 'complaints-support-rider': ComplaintsSupportRider,
  'complaints-driver': ComplaintsSupportDriver, 'complaints-support-driver': ComplaintsSupportDriver,
  'calls': CallLogs, 'call-logs': CallLogs, 'direct-call-logs': CallLogs,
  'ratings': RatingsReviewsMonitor, 'rating-reviews-monitor': RatingsReviewsMonitor,
  'sos-center': SOSCenter, 'analytics': AnalyticsReports,
  'analytics-report': AnalyticsReports, 'notifications': Notifications,
  'bulk': PromoCodes, 'promo-code': PromoCodes,
  'shop-requests': AdminShopRequestsScreen, 'banners': AdminAddBanner,
  'banner-manager': AdminAddBanner,
};

const LoadingFallback = memo(() => (
  <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-3 bg-white">
    <div className="w-8 h-8 border-2 border-black/10 border-t-[#A7E92F] rounded-full animate-spin" />
    <p className="text-black/60 text-sm tracking-widest">ZRide Loading...</p>
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

export default function App() {
  const [stage, setStage] = useState(() => localStorage.getItem('ZRide_stage') || 'splash');
  const [role, setRole] = useState(() => localStorage.getItem('ZRide_role') || '');
  const [screen, setScreen] = useState(() => {
    const saved = localStorage.getItem('ZRide_screen') || 'dashboard';
    return SCREENS_MAP[saved]? saved : 'dashboard';
  });
  const [toast, setToast] = useState('');
  const [isAuth, setIsAuth] = useState(() => localStorage.getItem('ZRide_auth') === 'true');

  // 1. GOOGLE SE HIDE KARO + AUTH GUARD
  useEffect(() => {
    document.title = "ZRide Admin";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    // Agar auth nahi hai to hamesha login pe bhejo
    if (!isAuth && stage === 'app') {
      setStage('login');
    }
  }, [isAuth, stage]);

  useEffect(() => {
    localStorage.setItem('ZRide_stage', stage);
    localStorage.setItem('ZRide_role', role);
    localStorage.setItem('ZRide_screen', screen);
  }, [stage, role, screen]);

  const notify = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const handleLogin = useCallback(() => {
    localStorage.setItem('ZRide_auth', 'true');
    setIsAuth(true);
    setRole('Super Admin');
    setScreen('dashboard');
    setStage('app');
    notify('Super Admin login success');
  }, [notify]);

  const handleChooseRole = useCallback((selected) => {
    // Role select ke baad seedha login pe bhejo, app pe nahi
    setRole(selected);
    setStage('login');
    notify(`${selected} login required`);
  }, [notify]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setIsAuth(false);
    setRole('');
    setScreen('dashboard');
    setStage('splash');
  }, []);

  const ActiveScreen = SCREENS_MAP[screen] || SuperAdminDashboard;

  return (
    <Suspense fallback={<LoadingFallback />}>
      {stage === 'splash' && <SplashFrontScreen onContinue={() => setStage('role')} />}
      {stage === 'role' && <RoleSelectScreen selected={role} onSelect={handleChooseRole} />}
      {stage === 'login' && <AdminLoginScreen role={role} onLogin={handleLogin} secureConfig={SECURE_ADMIN} />}
      {stage === 'app' && isAuth && (
        <div className="app min-h-screen bg-[#F8FAFC] text-black">
          <Shell role={role} screen={screen} setScreen={setScreen} onLogout={handleLogout}>
            <ErrorBoundary screenName={screen}>
              <Suspense fallback={<LoadingFallback />}>
                <ActiveScreen notify={notify} setScreen={setScreen} />
              </Suspense>
            </ErrorBoundary>
          </Shell>
          <Toast message={toast} />
        </div>
      )}
    </Suspense>
  );
}