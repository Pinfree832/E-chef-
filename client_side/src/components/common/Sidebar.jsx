import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const customerLinks = [
  { path: '/customer',           label: 'Dashboard',        icon: '📊' },
  { path: '/customer/book',      label: 'Book a Chef',      icon: '📅' },
  { path: '/customer/bookings',  label: 'My Bookings',      icon: '📋' },
  { path: '/customer/favorites', label: 'Favorite Chefs',   icon: '❤️' },
  { path: '/customer/loyalty',   label: 'Loyalty Rewards',  icon: '🏆' },
  { path: '/messages',           label: 'Messages',         icon: '💬' },
  { path: '/customer/profile',   label: 'Profile',          icon: '👤' }
];

const chefLinks = [
  { path: '/chef',            label: 'Dashboard',    icon: '📊' },
  { path: '/chef/bookings',   label: 'Bookings',     icon: '📋' },
  { path: '/chef/earnings',   label: 'Earnings',     icon: '💰' },
  { path: '/chef/portfolio',  label: 'Portfolio',    icon: '🖼' },
  { path: '/chef/availability', label: 'Availability', icon: '📅' },
  { path: '/messages',        label: 'Messages',     icon: '💬' },
  { path: '/chef/profile',    label: 'Profile',      icon: '👤' }
];

const adminLinks = [
  { path: '/admin',                   label: 'Dashboard',       icon: '📊' },
  { path: '/admin/users',             label: 'Users',           icon: '👥' },
  { path: '/admin/chef-verification', label: 'Chef Approval',   icon: '✅' },
  { path: '/admin/bookings',          label: 'Bookings',        icon: '📋' },
  { path: '/admin/revenue',           label: 'Revenue',         icon: '💰' },
  { path: '/admin/disputes',          label: 'Disputes',        icon: '⚖️' },
  { path: '/admin/commission',        label: 'Commission',      icon: '⚙️' }
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'chef' ? chefLinks : customerLinks;
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'chef' ? 'Professional Chef' : 'Customer';

  return (
    <aside className="sidebar">
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <Link to="/" style={{ color: 'var(--primary)', fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          🍽 Mobility Chef
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{roleLabel}</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {links.map(link => {
          const active = location.pathname === link.path;
          return (
            <Link key={link.path} to={link.path} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 4,
              borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400,
              color: active ? '#fff' : 'rgba(255,255,255,.65)',
              background: active ? 'var(--primary)' : 'transparent',
              textDecoration: 'none', transition: 'all .2s'
            }}>
              <span>{link.icon}</span> {link.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <button onClick={async () => { await logout(); navigate('/'); }} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', width: '100%',
          background: 'none', border: 'none', color: 'rgba(255,255,255,.65)', cursor: 'pointer', borderRadius: 8, fontSize: 14
        }}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
