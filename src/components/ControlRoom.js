import { useState } from 'react';
import {
  AlertTriangle, BarChart3, Bell, Building2, Car, ChevronDown, CircleHelp,
  LayoutDashboard, History, Image as ImageIcon, MapPin, Menu, Search,
  Shield, Star, Users, X, Store, Phone, Truck
} from 'lucide-react';

export function Shell({ screen, setScreen, role, onLogout, children }) {
  const [open, setOpen] = useState(false);
  
  const groups = [
    { 
      label: 'Main Admin', 
      items: [
        { key: 'dashboard', label: 'Super Admin Dashboard', icon: LayoutDashboard },
        { key: 'shop-requests', label: 'Shop Requests', icon: Store },
        { key: 'shop-top-settings', label: 'Shop Top Settings', icon: Star },
        { key: 'showroom-requests', label: 'ShowRoom Request', icon: Store },
        { key: 'banners', label: 'Banner Manager', icon: ImageIcon },
        { key: 'truck-verification', label: 'Truck Verification', icon: Truck },
        { key: 'shop-history', label: 'Shop History', icon: Store },
        { key: 'driver-history', label: 'Driver History', icon: Users },
        { key: 'showroom-owner-history', label: 'ShowRoom History', icon: Building2 },
        { key: 'truck-history', label: 'Truck History', icon: Truck },
        { key: 'city-dashboard', label: 'City Dashboard', icon: Building2 },
        { key: 'add-city', label: 'Add Country and City', icon: MapPin },
        { key: 'city-deiver-onboarding', label: 'Driver Onboarding', icon: Shield },
        { key: 'city-performance', label: 'Driver Performance', icon: Users },
        { key: 'city-vehicles', label: 'Vehicle Type', icon: Car },
        { key: 'zones', label: 'Zone Management', icon: MapPin },
        { key: 'commission', label: 'Commission', icon: BarChart3 },
        { key: 'passenger-history', label: 'Users History', icon: History },
        { key: 'complaints', label: 'Complaint Support Rider', icon: CircleHelp },
        { key: 'complaints-driver', label: 'Complaint Support Driver', icon: CircleHelp },
        { key: 'call-logs', label: 'Call Logs', icon: Phone },
        { key: 'ratings', label: 'Rating Reviews Monitor', icon: Star },
        { key: 'sos-center', label: 'SOS Center', icon: AlertTriangle },
        { key: 'analytics', label: 'Analytics Report', icon: BarChart3 },
        { key: 'notifications', label: 'Notification', icon: Bell },
        { key: 'bulk', label: 'Promo Code', icon: Bell },
      ] 
    },
  ];

  return (
    <div className="shell" style={{ height: '100vh', overflow: 'hidden', display: 'flex' }}>
      <aside className={`sidebar ${open ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div className="brand">
          <div className="brand-mark">Z</div>
          <div><div className="brand-name">ZRide</div><span className="brand-sub">operations / KHI</span></div>
          <button className="icon-btn mobile-toggle" onClick={() => setOpen(false)}><X size={15} /></button>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {groups.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map(({ key, label, icon: Icon }) => (
                <button 
                  key={`${group.label}-${key}`} 
                  className={`nav-item ${screen === key ? 'active' : ''}`} 
                  onClick={() => { setScreen(key); setOpen(false); }}
                >
                  <Icon size={18} /><span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="role-chip" style={{ flexShrink: 0 }}>
          <small>ACTIVE ROLE</small><strong>{role}</strong>
          <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={onLogout}>Switch role</button>
        </div>
      </aside>
      <div className="main" style={{ flex: 1, height: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="top-actions">
            <button className="icon-btn mobile-toggle" onClick={() => setOpen(true)}><Menu size={16} /></button>
            <div className="crumb">ZRide <span>/</span> <b>{screen.replaceAll('-', ' ')}</b></div>
          </div>
          <div className="top-actions">
            <button className="icon-btn"><Search size={15} /></button>
            <button className="icon-btn" onClick={() => setScreen('notifications')}><Bell size={15} /></button>
            <div className="avatar">AK</div>
            <ChevronDown size={14} color="hsl(215 16% 63%)" />
          </div>
        </header>
        <div style={{ paddingBottom: 40 }}>{children}</div>
      </div>
    </div>
  );
}

export function Button({ variant = 'primary', children, style, ...props }) {
  const primary = variant === 'primary';
  return (
    <button
      {...props}
      style={{
        border: primary ? '1px solid #A7E92F' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        padding: '8px 14px',
        background: primary ? '#A7E92F' : '#20242b',
        color: primary ? '#101010' : '#fff',
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'warn', children }) {
  const colors = {
    good: { background: '#14532d', color: '#bbf7d0' },
    warn: { background: '#713f12', color: '#fde68a' },
    bad: { background: '#7f1d1d', color: '#fecaca' },
  };
  return (
    <span style={{ ...(colors[tone] || colors.warn), display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '3px 9px', fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
}

export function ScreenFrame({ eyebrow, title, description, actions, children }) {
  return (
    <main style={{ padding: 24, color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          {eyebrow && <div style={{ color: '#A7E92F', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>{eyebrow}</div>}
          {title && <h1 style={{ margin: '6px 0', fontSize: 28, fontWeight: 800 }}>{title}</h1>}
          {description && <p style={{ margin: 0, color: '#cbd5e1' }}>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}

export function SectionCard({ title, meta, children }) {
  return (
    <section style={{ minWidth: 0, padding: 18, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, background: '#111827', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h2>
        {meta && <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700 }}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}

export function StatCard({ icon, label, value, note }) {
  return (
    <section className="stat" style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="stat-label">{label}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      {note && <div style={{ color: '#cbd5e1', fontSize: 12 }}>{note}</div>}
    </section>
  );
}

export function MiniMap({ label, pins = 0 }) {
  return (
    <div role="img" aria-label={`${label}: ${pins} online drivers, location detail unavailable`} style={{ minHeight: 180, display: 'grid', placeContent: 'center', gap: 8, textAlign: 'center', borderRadius: 10, background: '#0b1220', color: '#cbd5e1' }}>
      <strong>{label}</strong>
      <span>{pins} online drivers reported; live coordinates are unavailable.</span>
    </div>
  );
}

export function DataScreen({ title, description, rows = [], columns = [], renderRow }) {
  return (
    <section style={{ color: '#fff' }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h2>
        {description && <p style={{ margin: '4px 0 0', color: '#cbd5e1' }}>{description}</p>}
      </header>
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead><tr>{columns.map(column => <th key={column} style={{ padding: 12, background: '#1f2937', color: '#e2e8f0' }}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => renderRow(row, index))}
            {rows.length === 0 && <tr><td colSpan={columns.length} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No records available.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div role="status" style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1000, borderRadius: 10, background: '#111827', color: '#fff', padding: '12px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.35)' }}>
      {message}
    </div>
  );
}