import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const location              = useLocation();

  const redirects = { customer: '/customer', chef: '/chef', admin: '/admin' };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate(location.state?.from || redirects[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>🍽 Mobility Chef</Link>
          <h2 style={{ marginTop: 16, fontSize: 26 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Sign in to your account</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="Your password" required
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -12 }}>
                <Link to="/auth/forgot-password" style={{ fontSize: 13, color: 'var(--primary)' }}>Forgot password?</Link>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          Don't have an account? <Link to="/auth/register" style={{ fontWeight: 600 }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}
