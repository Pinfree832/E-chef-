import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart, LineElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, ArcElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="main-content" style={{ padding: 40, textAlign: 'center' }}>Loading dashboard...</main></div>;

  const revenueChart = {
    labels: data?.monthlyRevenue?.map(r => r.month) || [],
    datasets: [{ label: 'Revenue (KES)', data: data?.monthlyRevenue?.map(r => r.revenue) || [], borderColor: 'var(--primary)', backgroundColor: 'rgba(230,126,34,.1)', fill: true, tension: .4 }]
  };

  const bookingChart = {
    labels: ['Pending', 'Completed', 'Cancelled'],
    datasets: [{ data: [data?.bookings?.pending, data?.bookings?.completed, data?.bookings?.cancelled], backgroundColor: ['#f1c40f','#27ae60','#e74c3c'] }]
  };

  const statusColor = { pending: '#f1c40f', confirmed: '#3498db', completed: '#27ae60', cancelled: '#e74c3c', in_progress: '#e67e22' };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Platform overview and analytics</p>

        {/* Key Metrics */}
        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Total Users',        value: data?.users?.total || 0,     icon: '👥', color: '#3498db', link: '/admin/users' },
            { label: 'Active Chefs',       value: data?.chefs?.approved || 0,  icon: '👨‍🍳', color: 'var(--primary)', link: '/admin/chef-verification' },
            { label: 'Total Bookings',     value: data?.bookings?.total || 0,  icon: '📋', color: '#9b59b6', link: '/admin/bookings' },
            { label: 'Revenue Collected',  value: `KES ${Number(data?.revenue?.collected || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💰', color: '#27ae60', link: '/admin/revenue' }
          ].map(stat => (
            <Link key={stat.label} to={stat.link} className="stat-card" style={{ borderTop: `3px solid ${stat.color}`, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div className="stat-value" style={{ color: stat.color, fontSize: 28 }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </Link>
          ))}
        </div>

        {/* Alert: Pending Chefs */}
        {(data?.chefs?.pending || 0) > 0 && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ <strong>{data.chefs.pending} chef(s)</strong> awaiting verification</span>
            <Link to="/admin/chef-verification" className="btn btn-sm btn-warning" style={{ background: '#f1c40f', color: '#333', border: 'none' }}>Review Now</Link>
          </div>
        )}

        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          <div className="card">
            <div className="card-header"><h3>Monthly Revenue</h3></div>
            <div className="card-body">{data?.monthlyRevenue?.length > 0 ? <Line data={revenueChart} options={{ responsive: true }} /> : <p style={{ color: 'var(--text-secondary)' }}>No data yet</p>}</div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Booking Distribution</h3></div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}><Doughnut data={bookingChart} style={{ maxHeight: 280 }} /></div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <Link to="/admin/bookings" style={{ fontSize: 14, color: 'var(--primary)' }}>View All</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Customer</th><th>Chef</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recentBookings || []).map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.customer_name}</td>
                    <td>{b.chef_name}</td>
                    <td>{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td><strong>KES {Number(b.total_amount).toLocaleString()}</strong></td>
                    <td><span className="badge" style={{ background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status}</span></td>
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
