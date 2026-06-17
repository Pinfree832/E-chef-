import React, { useEffect, useState } from 'react';
import Sidebar from '../common/Sidebar';
import { userService } from '../../services/booking.service';

export default function Loyalty() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { userService.getLoyalty().then(r => setData(r.data.data)).finally(() => setLoading(false)); }, []);

  const plans = [
    { name: 'Free',    color: '#718096', points: '0',    perks: ['Standard booking','Email support'] },
    { name: 'Basic',   color: '#3498db', points: '500',  perks: ['Priority booking','2x points','2 free transport'] },
    { name: 'Premium', color: '#f1c40f', points: '1000', perks: ['Emergency booking','3x points','5 free transport','24/7 support','AI recommendations'] }
  ];

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="main-content" style={{ padding: 40, textAlign: 'center' }}>Loading...</main></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Loyalty Rewards</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Earn points on every booking and unlock exclusive benefits</p>

        {/* Points Card */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', marginBottom: 32 }}>
          <div className="card-body" style={{ padding: 32 }}>
            <p style={{ opacity: .8, marginBottom: 8 }}>Your Loyalty Points</p>
            <div style={{ fontSize: 56, fontWeight: 800, marginBottom: 8 }}>🏆 {(data?.loyalty_points || 0).toLocaleString()}</div>
            <p style={{ opacity: .8, fontSize: 14 }}>Points · Current Plan: <strong style={{ color: '#fff' }}>{(data?.subscription_plan || 'free').toUpperCase()}</strong></p>
            <p style={{ opacity: .7, fontSize: 13, marginTop: 8 }}>Earn 10 points for every KES 100 spent</p>
          </div>
        </div>

        {/* Plans */}
        <h2 style={{ marginBottom: 24 }}>Subscription Plans</h2>
        <div className="grid grid-3" style={{ marginBottom: 40 }}>
          {plans.map(plan => (
            <div key={plan.name} className="card" style={{ border: `2px solid ${plan.color}`, opacity: data?.subscription_plan === plan.name.toLowerCase() ? 1 : 0.85 }}>
              <div className="card-body">
                <div style={{ color: plan.color, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>⭐ {plan.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{plan.points}+ points to unlock</div>
                <ul style={{ listStyle: 'none', fontSize: 14 }}>
                  {plan.perks.map(p => <li key={p} style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>✓ {p}</li>)}
                </ul>
                {data?.subscription_plan === plan.name.toLowerCase() && (
                  <div className="badge badge-success" style={{ marginTop: 16 }}>✓ Current Plan</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        {data?.transactions?.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>Points History</h3></div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Points</th><th>Balance</th></tr></thead>
                <tbody>
                  {data.transactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td><span className={`badge ${t.points > 0 ? 'badge-success' : 'badge-danger'}`}>{t.type}</span></td>
                      <td>{t.description}</td>
                      <td style={{ color: t.points > 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 700 }}>{t.points > 0 ? '+' : ''}{t.points}</td>
                      <td><strong>{t.balance}</strong></td>
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
