import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    adminService.getDisputes().then(r => setDisputes(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  async function handleResolve() {
    if (!resolution.trim()) { toast.error('Please enter a resolution'); return; }
    try {
      await adminService.resolveDispute(selected.id, resolution);
      setDisputes(prev => prev.map(d => d.id === selected.id ? { ...d, status: 'resolved', resolution } : d));
      toast.success('Dispute resolved!');
      setSelected(null); setResolution('');
    } catch { toast.error('Failed to resolve dispute'); }
  }

  const statusColor = { open: '#e74c3c', investigating: '#f1c40f', resolved: '#27ae60', closed: '#718096' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Dispute Management</h1>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : disputes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>⚖️</div>
            <h3>No disputes found</h3>
          </div>
        ) : (
          <div className="grid grid-2">
            <div>
              {disputes.map(d => (
                <div key={d.id} className="card" style={{ marginBottom: 16, cursor: 'pointer', border: selected?.id === d.id ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setSelected(d)}>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>Dispute #{d.id} · Booking #{d.booking_id}</strong>
                      <span className="badge" style={{ background: `${statusColor[d.status]}22`, color: statusColor[d.status] }}>{d.status}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Raised by: <strong>{d.raised_by_name}</strong> against <strong>{d.against_name}</strong></p>
                    <p style={{ fontSize: 14 }}><strong>Reason:</strong> {d.reason}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
            {selected && (
              <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 20 }}>
                <div className="card-header"><h3>Dispute #{selected.id}</h3></div>
                <div className="card-body">
                  <p style={{ fontSize: 14, marginBottom: 12 }}><strong>Reason:</strong> {selected.reason}</p>
                  <p style={{ fontSize: 14, marginBottom: 12 }}><strong>Description:</strong> {selected.description}</p>
                  <p style={{ fontSize: 14, marginBottom: 20 }}><strong>Booking Amount:</strong> KES {Number(selected.total_amount || 0).toLocaleString()}</p>
                  {selected.status === 'open' || selected.status === 'investigating' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Resolution</label>
                        <textarea className="form-control" rows={4} placeholder="Describe the resolution..." value={resolution} onChange={e => setResolution(e.target.value)} />
                      </div>
                      <button onClick={handleResolve} className="btn btn-primary btn-block">Resolve Dispute</button>
                    </>
                  ) : (
                    <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8 }}>
                      <strong style={{ color: 'var(--accent)' }}>✓ Resolved</strong>
                      <p style={{ fontSize: 14, marginTop: 8 }}>{selected.resolution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
