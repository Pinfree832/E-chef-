import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { bookingService } from '../../services/booking.service';

export default function ChefBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {};
    bookingService.getAll(params).then(r => setBookings(r.data.data || [])).finally(() => setLoading(false));
  }, [filter]);

  async function handleStatusChange(id, newStatus) {
    try {
      await bookingService.updateStatus(id, newStatus);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      toast.success(`Booking ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  }

  const statusColor = { pending: '#f1c40f', confirmed: '#3498db', chef_en_route: '#9b59b6', in_progress: '#e67e22', completed: '#27ae60', cancelled: '#e74c3c' };

  const nextStatus = { confirmed: 'chef_en_route', chef_en_route: 'in_progress', in_progress: 'completed' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>My Bookings</h1>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all','pending','confirmed','in_progress','completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📋</div>
            <h3>No bookings found</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: 16 }}>{b.customer_name}</strong>
                      <span className="badge" style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status.replace(/_/g,' ')}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>📅 {new Date(b.booking_date).toLocaleDateString()} at {b.start_time} · 👥 {b.guests_count} guests</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>📍 {b.address_line1}, {b.city}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>KES {Number(b.total_amount).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {b.status === 'pending' && (
                        <button onClick={() => handleStatusChange(b.id, 'confirmed')} className="btn btn-success btn-sm">✓ Accept</button>
                      )}
                      {nextStatus[b.status] && (
                        <button onClick={() => handleStatusChange(b.id, nextStatus[b.status])} className="btn btn-primary btn-sm">
                          {b.status === 'confirmed' ? 'I\'m Departing' : b.status === 'chef_en_route' ? 'I\'ve Arrived' : 'Mark Complete'}
                        </button>
                      )}
                      <Link to={`/messages?booking=${b.id}`} className="btn btn-outline btn-sm">💬 Chat</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
