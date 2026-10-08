import { useState } from 'react';
import {
  AlertTriangle, BarChart3, Bell, Building2, Car, ChevronDown, CircleHelp,
  LayoutDashboard, History, Image as ImageIcon, MapPin, Menu, MessageSquare, Search,
  Settings, Shield, Star, Users, X, Zap, Store, Phone
} from 'lucide-react';

export function Button({ children, title, variant = 'primary', style, disabled, onClick }) {
  return (
    <button className={`btn ${variant}`} style={style} disabled={disabled} onClick={onClick}>
      {children || title}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function ScreenFrame({ eyebrow, title, description, actions, children }) {
  return (
    <section className="screen-frame">
      <div className="screen-heading">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="screen-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function SectionCard({ title, meta, children }) {
  return (
    <section className="section-card">
      <div className="section-card-header"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, note }) {
  return <div className="stat"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><small>{note}</small></div>;
}

export function DataScreen({ title, description, rows = [], columns = [], renderRow }) {
  return (
    <SectionCard title={title} meta={description}>
      <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map(renderRow)}</tbody></table></div>
    </SectionCard>
  );
}

export function MiniMap({ label = 'LIVE MAP', pins = 0 }) {
  return <div className="mini-map"><strong>{label}</strong><span>{pins} active points</span></div>;
}

export function SparkBars({ values = [] }) {
  return <div className="spark-bars">{values.map((value, index) => <i key={`${value}-${index}`} style={{ height: `${value}%` }} />)}</div>;
}

export function Toast({ message }) {
  return message ? <div className="toast" role="status">{message}</div> : null;
}

export function Shell({ screen, setScreen, role, onLogout, children }) {
  const [open, setOpen] = useState(false);
  
  const groups = [
    { 
      label: 'Main Admin', 
      items: [
        { key: 'dashboard', label: 'Super Admin Dashboard', icon: LayoutDashboard },
        { key: 'shop-requests', label: 'Shop Requests', icon: Store },
        { key: 'banners', label: 'Banner Manager', icon: ImageIcon },
      ] 
    },
    { 
      label: 'City Operations', 
      items: [
        { key: 'city-dashboard', label: 'City Dashboard', icon: Building2 },
        { key: 'add-city', label: 'Add Country and City', icon: MapPin },
        { key: 'city-onboarding', label: 'Driver Onboarding', icon: Shield },
        { key: 'city-performance', label: 'Driver Performance', icon: Users },
        { key: 'city-vehicles', label: 'Vehicle Type', icon: Car },
        { key: 'zones', label: 'Zone Management', icon: MapPin },
        { key: 'commission', label: 'Commission', icon: BarChart3 },
      ] 
    },
    { 
      label: 'Drivers & Users', 
      items: [
        { key: 'users', label: 'User Management', icon: Users },
        { key: 'passenger-history', label: 'Users History', icon: History },
      ] 
    },
    { 
      label: 'Support & Monitoring', 
      items: [
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
                  key={key} 
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
            <button className="icon-btn" onClick={() => setScreen('notifications')} title="Open Notifications">
              <Bell size={15} />
            </button>
            <div className="avatar">AK</div>
            <ChevronDown size={14} color="hsl(215 16% 63%)" />
          </div>
        </header>
        <div style={{ paddingBottom: 40 }}>
          {children}
        </div>
      </div>
    </div>
  );
}