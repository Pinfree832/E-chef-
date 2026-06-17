import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'chef' ? '/chef' : '/customer';

  return (
    <nav className="navbar" style={{ padding: '12px 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '100%', padding: '0 24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--primary)' }}>🍽 Mobility Chef</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/menu" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>Browse Menu</Link>
          <Link to="/chefs" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>Find Chefs</Link>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 24, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                {user.first_name}
              </button>
              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
                  <Link to={dashboardLink} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontSize: 14 }}>Dashboard</Link>
                  <Link to="/messages" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', fontSize: 14 }}>Messages</Link>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '12px 16px', color: 'var(--danger)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14 }}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/auth/login" className="btn btn-outline btn-sm">Sign In</Link>
              <Link to="/auth/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
