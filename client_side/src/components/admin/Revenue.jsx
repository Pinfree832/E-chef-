import React, { useEffect, useState } from 'react';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';
import { Line } from 'react-chartjs-2';

export default function Revenue() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate]     = useState(today);
  const [report, setReport]       = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { fetchReport(); }, []);

  async function fetchReport() {
    setLoading(true);
    adminService.getRevenueReport({ start_date: startDate, end_date: endDate }).then(r => setReport(r.data.data || [])).finally(() => setLoading(false));
  }

  const chartData = {
    labels: report.map(r => r.date),
    datasets: [
      { label: 'Gross Revenue', data: report.map(r => r.gross_revenue), borderColor: '#3498db', fill: false, tension: .4 },
      { label: 'Commission',    data: report.map(r => r.commission_earned), borderColor: 'var(--primary)', fill: false, tension: .4 }
    ]
  };

  const totals = report.reduce((acc, r) => ({
    gross: acc.gross + Number(r.gross_revenue), commission: acc.commission + Number(r.commission_earned), transactions: acc.transactions + Number(r.transactions)
  }), { gross: 0, commission: 0, transactions: 0 });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Revenue Reports</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={fetchReport} className="btn btn-primary" disabled={loading}>{loading ? 'Loading...' : 'Generate Report'}</button>
        </div>

        <div className="grid grid-3" style={{ marginBottom: 32 }}>
          {[
            { label: 'Gross Revenue',    value: `KES ${totals.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💰', color: '#3498db' },
            { label: 'Platform Earnings', value: `KES ${totals.commission.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '📊', color: 'var(--primary)' },
            { label: 'Transactions',     value: totals.transactions, icon: '🔄', color: '#27ae60' }
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {report.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><h3>Revenue Trend</h3></div>
            <div className="card-body"><Line data={chartData} options={{ responsive: true }} /></div>
          </div>
        )}

        <div className="card">
          <div className="card-header"><h3>Daily Breakdown</h3></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Gross Revenue</th><th>Commission</th><th>Transactions</th><th>Active Chefs</th></tr></thead>
              <tbody>
                {report.map(r => (
                  <tr key={r.date}>
                    <td>{r.date}</td>
                    <td><strong>KES {Number(r.gross_revenue).toLocaleString()}</strong></td>
                    <td style={{ color: 'var(--primary)' }}>KES {Number(r.commission_earned).toLocaleString()}</td>
                    <td>{r.transactions}</td>
                    <td>{r.active_chefs}</td>
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
