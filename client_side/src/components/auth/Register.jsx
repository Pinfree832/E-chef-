import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer', referral_code: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, password: form.password, role: form.role, referral_code: form.referral_code || undefined });
      toast.success('Account created! Please sign in.');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>🍽 Mobility Chef</Link>
          <h2 style={{ marginTop: 16, fontSize: 26 }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Join thousands enjoying chef-cooked meals</p>
        </div>

        <div className="card">
          <div className="card-body">
            {/* Role selector */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {['customer', 'chef'].map(r => (
                <button key={r} type="button" onClick={() => setForm(p => ({ ...p, role: r }))} style={{
                  flex: 1, padding: '12px', borderRadius: 8, border: `2px solid ${form.role === r ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.role === r ? 'rgba(230,126,34,.08)' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all .2s'
                }}>
                  {r === 'customer' ? '🧑 I want to book a chef' : '👨‍🍳 I am a chef'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="form-control" placeholder="John" required value={form.first_name} onChange={set('first_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" placeholder="Doe" required value={form.last_name} onChange={set('last_name')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-control" type="email" placeholder="you@example.com" required value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" type="tel" placeholder="+254700000000" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" placeholder="Min 8 chars, 1 upper, 1 number" required value={form.password} onChange={set('password')} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-control" type="password" placeholder="Confirm your password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
              </div>
              {form.role === 'customer' && (
                <div className="form-group">
                  <label className="form-label">Referral Code <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-control" placeholder="Enter referral code" value={form.referral_code} onChange={set('referral_code')} />
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
          Already have an account? <Link to="/auth/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
