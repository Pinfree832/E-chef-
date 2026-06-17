import React, { useEffect, useState } from 'react';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {};
    adminService.getBookings(params).then(r => setBookings(r.data.data || [])).finally(() => setLoading(false));
  }, [filter]);

  const statusColor = { pending: '#f1c40f', confirmed: '#3498db', chef_en_route: '#9b59b6', in_progress: '#e67e22', completed: '#27ae60', cancelled: '#e74c3c', disputed: '#e74c3c' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Booking Management</h1>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all','pending','confirmed','in_progress','completed','cancelled','disputed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>ID</th><th>Customer</th><th>Chef</th><th>Date</th><th>Amount</th><th>Status</th><th>Type</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>{b.customer_name}</td>
                      <td>{b.chef_name}</td>
                      <td>{new Date(b.booking_date).toLocaleDateString()} {b.start_time}</td>
                      <td><strong>KES {Number(b.total_amount).toLocaleString()}</strong></td>
                      <td><span className="badge" style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status.replace(/_/g,' ')}</span></td>
                      <td><span className="badge badge-info">{b.booking_type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
