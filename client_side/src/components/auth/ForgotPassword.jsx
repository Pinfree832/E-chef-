import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>🍽 Mobility Chef</Link>
          <h2 style={{ marginTop: 16, fontSize: 26 }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Enter your email to receive a reset link</p>
        </div>
        <div className="card">
          <div className="card-body">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <h3>Check Your Email</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>We sent a password reset link to <strong>{email}</strong></p>
                <Link to="/auth/login" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/auth/login" style={{ color: 'var(--primary)' }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
