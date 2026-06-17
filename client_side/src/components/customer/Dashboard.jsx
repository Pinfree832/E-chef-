import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { bookingService, userService } from '../../services/booking.service';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [loyalty, setLoyalty]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      bookingService.getAll({ limit: 5 }),
      userService.getLoyalty()
    ]).then(([b, l]) => {
      setBookings(b.data.data || []);
      setLoyalty(l.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: '#f1c40f', confirmed: '#3498db', chef_en_route: '#9b59b6', in_progress: '#e67e22', completed: '#27ae60', cancelled: '#e74c3c' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Welcome back, {user?.first_name}! 👋</h1>
          <p style={{ color: 'var(--text-secondary)' }}>What would you like to eat today?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Bookings',   value: bookings.length,                        icon: '📋', color: '#3498db' },
            { label: 'Completed',        value: bookings.filter(b => b.status === 'completed').length, icon: '✅', color: '#27ae60' },
            { label: 'Loyalty Points',   value: loyalty?.loyalty_points || 0,            icon: '🏆', color: '#f1c40f' },
            { label: 'Subscription',     value: loyalty?.subscription_plan || 'Free',    icon: '⭐', color: 'var(--primary)' }
          ].map(stat => (
            <div key={stat.label} className="stat-card" style={{ borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/customer/book" className="btn btn-primary btn-lg">📅 Book a Chef</Link>
              <Link to="/menu" className="btn btn-outline btn-lg">🍽 Browse Menu</Link>
              <Link to="/chefs" className="btn btn-outline btn-lg">👨‍🍳 Find Chefs</Link>
              <Link to="/customer/favorites" className="btn btn-outline btn-lg">❤️ Favorite Chefs</Link>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/customer/bookings" style={{ fontSize: 14, color: 'var(--primary)' }}>View All</Link>
          </div>
          {loading ? <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div> : bookings.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <p>No bookings yet. <Link to="/customer/book">Book your first chef!</Link></p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Chef</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>{b.chef_name}</td>
                      <td>{new Date(b.booking_date).toLocaleDateString()} {b.start_time}</td>
                      <td><strong>KES {Number(b.total_amount).toLocaleString()}</strong></td>
                      <td><span className="badge" style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status.replace(/_/g,' ')}</span></td>
                      <td><Link to={`/customer/bookings/${b.id}`} className="btn btn-sm btn-outline">View</Link></td>
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
