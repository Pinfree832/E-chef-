import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { bookingService, chefService } from '../../services/booking.service';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function ChefDashboard() {
  const { user }  = useAuth();
  const { on, off } = useSocket();
  const [bookings, setBookings]   = useState([]);
  const [earnings, setEarnings]   = useState(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      bookingService.getAll({ limit: 5 }),
      chefService.getEarnings('month')
    ]).then(([b, e]) => {
      setBookings(b.data.data || []);
      setEarnings(e.data.data.summary);
    }).finally(() => setLoading(false));

    const handler = (data) => {
      toast('📅 New booking request!', { icon: '🍽' });
      setBookings(prev => [data, ...prev]);
    };
    on('new_booking', handler);
    return () => off('new_booking', handler);
  }, [on, off]);

  async function toggleAvailability() {
    try {
      await chefService.updateProfile({ is_available: !available });
      setAvailable(!available);
      toast.success(`You are now ${!available ? 'available' : 'unavailable'} for bookings`);
    } catch { toast.error('Failed to update availability'); }
  }

  async function acceptBooking(bookingId) {
    try {
      await bookingService.updateStatus(bookingId, 'confirmed');
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));
      toast.success('Booking accepted!');
    } catch { toast.error('Failed to accept'); }
  }

  const statusColor = { pending: '#f1c40f', confirmed: '#3498db', chef_en_route: '#9b59b6', in_progress: '#e67e22', completed: '#27ae60', cancelled: '#e74c3c' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1>Chef Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome, Chef {user?.first_name}!</p>
          </div>
          <button onClick={toggleAvailability} className={`btn ${available ? 'btn-success' : 'btn-outline'}`}>
            {available ? '🟢 Available' : '⚫ Set Available'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'This Month\'s Earnings', value: `KES ${Number(earnings?.total_earned || 0).toLocaleString()}`, icon: '💰', color: '#27ae60' },
            { label: 'Bookings This Month',    value: earnings?.total_bookings || 0,                                  icon: '📋', color: '#3498db' },
            { label: 'Avg Per Booking',        value: `KES ${Number(earnings?.avg_per_booking || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '📈', color: 'var(--primary)' },
            { label: 'Pending Requests',       value: bookings.filter(b => b.status === 'pending').length,             icon: '⏳', color: '#f1c40f' }
          ].map(stat => (
            <div key={stat.label} className="stat-card" style={{ borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div className="stat-value" style={{ color: stat.color, fontSize: 24 }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/chef/availability" className="btn btn-primary">📅 Set Availability</Link>
            <Link to="/chef/portfolio" className="btn btn-outline">🖼 Update Portfolio</Link>
            <Link to="/chef/profile" className="btn btn-outline">👤 Edit Profile</Link>
            <Link to="/chef/earnings" className="btn btn-outline">💰 Full Earnings</Link>
          </div>
        </div>

        {/* Pending Bookings */}
        {bookings.filter(b => b.status === 'pending').length > 0 && (
          <div className="card" style={{ marginBottom: 24, border: '2px solid var(--warning)' }}>
            <div className="card-header"><h3>⏳ Pending Requests ({bookings.filter(b => b.status === 'pending').length})</h3></div>
            <div className="card-body">
              {bookings.filter(b => b.status === 'pending').map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>{b.customer_name}</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(b.booking_date).toLocaleDateString()} at {b.start_time} · KES {Number(b.total_amount).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => acceptBooking(b.id)} className="btn btn-success btn-sm">Accept</button>
                    <Link to={`/customer/bookings/${b.id}`} className="btn btn-outline btn-sm">View</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Bookings */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/chef/bookings" style={{ fontSize: 14, color: 'var(--primary)' }}>View All</Link>
          </div>
          {loading ? <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Customer</th><th>Date & Time</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.customer_name}</td>
                      <td>{new Date(b.booking_date).toLocaleDateString()} {b.start_time}</td>
                      <td><strong>KES {Number(b.total_amount).toLocaleString()}</strong></td>
                      <td><span className="badge" style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status.replace(/_/g,' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
