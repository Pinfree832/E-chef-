import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { userService } from '../../services/booking.service';
import { useAuth } from '../../context/AuthContext';

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm]   = useState({ first_name: '', last_name: '', phone: '', preferred_language: 'en' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', preferred_language: user.preferred_language || 'en' });
  }, [user]);

  async function handleProfile(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateProfile(form);
      updateUser(form);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    try {
      await userService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>My Profile</h1>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><h3>Personal Information</h3></div>
            <div className="card-body">
              <form onSubmit={handleProfile}>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-control" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-control" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={user?.email} disabled style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+254700000000" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Change Password</h3></div>
            <div className="card-body">
              <form onSubmit={handlePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-secondary">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
