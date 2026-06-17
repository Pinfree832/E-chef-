import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';

export default function CommissionSettings() {
  const [settings, setSettings] = useState([]);
  const [form, setForm]         = useState({ name: 'Updated Rate', commission_rate: 15, tax_rate: 16 });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminService.getCommission().then(r => setSettings(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await adminService.updateCommission(form);
      toast.success('Commission settings updated!');
      adminService.getCommission().then(r => setSettings(r.data.data || []));
    } catch { toast.error('Failed to update'); }
  }

  const current = settings.find(s => s.is_active);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Commission & Tax Settings</h1>
        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><h3>Current Settings</h3></div>
            <div className="card-body">
              {current ? (
                <>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                    <div className="stat-card" style={{ flex: 1, borderTop: '3px solid var(--primary)' }}>
                      <div className="stat-value" style={{ fontSize: 36 }}>{current.commission_rate}%</div>
                      <div className="stat-label">Platform Commission</div>
                    </div>
                    <div className="stat-card" style={{ flex: 1, borderTop: '3px solid #3498db' }}>
                      <div className="stat-value" style={{ color: '#3498db', fontSize: 36 }}>{current.tax_rate}%</div>
                      <div className="stat-label">VAT / Tax Rate</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active since: {new Date(current.effective_from).toLocaleDateString()}</p>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No active settings found</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Update Settings</h3></div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Settings Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Commission (%)</label>
                  <input type="number" className="form-control" min={0} max={50} step={0.5} value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) }))} />
                  <small style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Applied to every booking subtotal</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input type="number" className="form-control" min={0} max={50} step={0.5} value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: parseFloat(e.target.value) }))} />
                  <small style={{ color: 'var(--text-secondary)', fontSize: 12 }}>VAT applied after commission</small>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
                  <strong>Example calculation for KES 5,000 order:</strong>
                  <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
                    <div>+ Commission: KES {(5000 * form.commission_rate / 100).toFixed(2)}</div>
                    <div>+ Tax: KES {(5000 * (1 + form.commission_rate/100) * form.tax_rate / 100).toFixed(2)}</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                      = Total: KES {(5000 * (1 + form.commission_rate/100) * (1 + form.tax_rate/100)).toFixed(2)}
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block">Update Commission Settings</button>
              </form>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h3>Settings History</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Commission</th><th>Tax</th><th>Effective From</th><th>Status</th></tr></thead>
              <tbody>
                {settings.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.commission_rate}%</td>
                    <td>{s.tax_rate}%</td>
                    <td>{new Date(s.effective_from).toLocaleDateString()}</td>
                    <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-warning'}`}>{s.is_active ? 'Active' : 'Superseded'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
