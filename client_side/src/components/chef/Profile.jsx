import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { chefService } from '../../services/booking.service';

export default function ChefProfile() {
  const [form, setForm] = useState({ bio: '', years_of_experience: 0, base_hourly_rate: 0, travel_rate_per_km: 0, equipment_fee: 0, service_radius_km: 20, mpesa_number: '', is_available: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    import('../../services/booking.service').then(({ userService }) =>
      userService.getProfile().then(r => {
        if (r.data.data.profile) setForm(prev => ({ ...prev, ...r.data.data.profile }));
      })
    );
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await chefService.updateProfile(form);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setLoading(false); }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Chef Profile</h1>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><h3>Professional Info</h3></div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" rows={4} placeholder="Describe your culinary journey..." value={form.bio || ''} onChange={set('bio')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input type="number" className="form-control" value={form.years_of_experience || 0} onChange={set('years_of_experience')} min={0} />
                </div>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (KES)</label>
                    <input type="number" className="form-control" value={form.base_hourly_rate || 0} onChange={set('base_hourly_rate')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Travel Rate/km (KES)</label>
                    <input type="number" className="form-control" value={form.travel_rate_per_km || 0} onChange={set('travel_rate_per_km')} />
                  </div>
                </div>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Equipment Fee (KES)</label>
                    <input type="number" className="form-control" value={form.equipment_fee || 0} onChange={set('equipment_fee')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Radius (km)</label>
                    <input type="number" className="form-control" value={form.service_radius_km || 20} onChange={set('service_radius_km')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">M-Pesa Number</label>
                  <input className="form-control" placeholder="+254700000000" value={form.mpesa_number || ''} onChange={set('mpesa_number')} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" id="available" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
                  <label htmlFor="available" className="form-label" style={{ marginBottom: 0 }}>Available for bookings</label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
              </form>
            </div>
          </div>

          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><h3>Verification Status</h3></div>
            <div className="card-body">
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {form.verification_status === 'approved' ? '✅' : form.verification_status === 'pending' ? '⏳' : '❌'}
                </div>
                <div className={`badge ${form.verification_status === 'approved' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 14, padding: '8px 16px' }}>
                  {form.verification_status || 'pending'}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 14 }}>
                  {form.verification_status === 'approved'
                    ? 'Your account is verified. You can accept bookings.'
                    : 'Your documents are under review. We\'ll notify you once verified.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
