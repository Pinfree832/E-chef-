import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { bookingService } from '../../services/booking.service';

const STATUS_COLORS = { pending: '#f1c40f', confirmed: '#3498db', chef_en_route: '#9b59b6', in_progress: '#e67e22', completed: '#27ae60', cancelled: '#e74c3c', disputed: '#e74c3c' };

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {};
    bookingService.getAll(params).then(r => setBookings(r.data.data || [])).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>My Bookings</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track and manage all your bookings</p>
          </div>
          <Link to="/customer/book" className="btn btn-primary">+ New Booking</Link>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {['all','pending','confirmed','in_progress','completed','cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📋</div>
            <h3>No bookings found</h3>
            <Link to="/customer/book" className="btn btn-primary" style={{ marginTop: 20 }}>Book a Chef</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 18 }}>Booking #{b.id}</h3>
                      <span className="badge" style={{ background: `${STATUS_COLORS[b.status]}22`, color: STATUS_COLORS[b.status] }}>{b.status.replace(/_/g,' ')}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Chef: <strong>{b.chef_name}</strong> · {new Date(b.booking_date).toLocaleDateString()} at {b.start_time}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <strong style={{ fontSize: 18, color: 'var(--primary)' }}>KES {Number(b.total_amount).toLocaleString()}</strong>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/customer/bookings/${b.id}`} className="btn btn-sm btn-outline">View Details</Link>
                      {b.status === 'chef_en_route' && <Link to={`/customer/track/${b.id}`} className="btn btn-sm btn-primary">Track Chef</Link>}
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
