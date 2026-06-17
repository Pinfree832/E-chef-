import React, { useEffect, useState } from 'react';
import Sidebar from '../common/Sidebar';
import { chefService } from '../../services/booking.service';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function Earnings() {
  const [period, setPeriod]   = useState('month');
  const [data, setData]       = useState({ earnings: [], summary: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    chefService.getEarnings(period).then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, [period]);

  const chartData = {
    labels: data.earnings.map(e => new Date(e.created_at).toLocaleDateString()),
    datasets: [{ label: 'Net Earnings (KES)', data: data.earnings.map(e => e.net_amount), borderColor: 'var(--primary)', backgroundColor: 'rgba(230,126,34,.1)', fill: true, tension: .4 }]
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1>Earnings Dashboard</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {['week','month','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Gross Earnings',  value: `KES ${Number(data.summary?.total_earned || 0).toLocaleString()}`, icon: '💰' },
            { label: 'Platform Fee',    value: `KES ${Number(data.summary?.total_commission || 0).toLocaleString()}`, icon: '📊' },
            { label: 'Total Bookings',  value: data.summary?.total_bookings || 0,  icon: '📋' },
            { label: 'Avg Per Booking', value: `KES ${Number(data.summary?.avg_per_booking || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '📈' }
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {data.earnings.length > 1 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3>Earnings Trend</h3></div>
            <div className="card-body"><Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} /></div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3>Transaction History</h3></div>
          {loading ? <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Customer</th><th>Gross</th><th>Commission</th><th>Net</th><th>Status</th></tr></thead>
                <tbody>
                  {data.earnings.map(e => (
                    <tr key={e.id}>
                      <td>{new Date(e.created_at).toLocaleDateString()}</td>
                      <td>{e.customer_name}</td>
                      <td>KES {Number(e.gross_amount).toLocaleString()}</td>
                      <td style={{ color: 'var(--danger)' }}>- KES {Number(e.commission).toLocaleString()}</td>
                      <td><strong style={{ color: 'var(--accent)' }}>KES {Number(e.net_amount).toLocaleString()}</strong></td>
                      <td><span className={`badge ${e.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{e.status}</span></td>
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
