import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';

export default function ChefVerification() {
  const [chefs, setChefs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminService.getPendingChefs().then(r => setChefs(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  async function handleVerify(id, status) {
    try {
      await adminService.verifyChef(id, status);
      setChefs(prev => prev.filter(c => c.id !== id));
      toast.success(`Chef ${status}`);
      setSelected(null);
    } catch { toast.error('Failed to update status'); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Chef Verification</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Review and approve chef applications</p>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : chefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <h3>No pending verifications</h3>
            <p style={{ color: 'var(--text-secondary)' }}>All chef applications have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            <div>
              {chefs.map(chef => (
                <div key={chef.id} className="card" style={{ marginBottom: 16, cursor: 'pointer', border: selected?.id === chef.id ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setSelected(chef)}>
                  <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {chef.first_name?.[0]}{chef.last_name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: 2 }}>{chef.first_name} {chef.last_name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{chef.email} · Applied {new Date(chef.created_at).toLocaleDateString()}</p>
                      <p style={{ fontSize: 13, marginTop: 4 }}>{chef.years_of_experience} yrs exp · KES {Number(chef.base_hourly_rate).toLocaleString()}/hr</p>
                    </div>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
                <div className="card-header">
                  <h3>{selected.first_name} {selected.last_name}</h3>
                </div>
                <div className="card-body">
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 14, marginBottom: 8 }}><strong>Email:</strong> {selected.email}</p>
                    <p style={{ fontSize: 14, marginBottom: 8 }}><strong>Phone:</strong> {selected.phone}</p>
                    <p style={{ fontSize: 14, marginBottom: 8 }}><strong>Experience:</strong> {selected.years_of_experience} years</p>
                    <p style={{ fontSize: 14, marginBottom: 8 }}><strong>Hourly Rate:</strong> KES {Number(selected.base_hourly_rate).toLocaleString()}</p>
                    <p style={{ fontSize: 14, marginBottom: 8 }}><strong>Service Radius:</strong> {selected.service_radius_km} km</p>
                    {selected.bio && <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--text-secondary)' }}><strong>Bio:</strong> {selected.bio}</p>}
                    {selected.specialties && (
                      <div style={{ marginBottom: 16 }}>
                        <strong style={{ fontSize: 14 }}>Specialties: </strong>
                        {(Array.isArray(selected.specialties) ? selected.specialties : JSON.parse(selected.specialties || '[]')).map(s => (
                          <span key={s} className="badge badge-primary" style={{ marginLeft: 6 }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {selected.certification_url && <a href={selected.certification_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginBottom: 12 }}>📄 View Certification</a>}
                    {selected.id_document_url && <a href={selected.id_document_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginLeft: 8, marginBottom: 12 }}>🪪 View ID</a>}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => handleVerify(selected.id, 'approved')} className="btn btn-success" style={{ flex: 1 }}>✓ Approve</button>
                    <button onClick={() => handleVerify(selected.id, 'rejected')} className="btn btn-danger" style={{ flex: 1 }}>✗ Reject</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
