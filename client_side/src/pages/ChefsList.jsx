import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { chefService } from '../services/booking.service';

export default function ChefsList() {
  const [chefs, setChefs]     = useState([]);
  const [search, setSearch]   = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    chefService.getAll({ search, min_rating: minRating, max_rate: maxRate, limit: 24 })
      .then(r => setChefs(r.data.data || [])).finally(() => setLoading(false));
  }, [search, minRating, maxRate]);

  return (
    <div>
      <Navbar />
      <div style={{ background: 'var(--secondary)', padding: '48px 0', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 40, marginBottom: 12 }}>Find Your Perfect Chef</h1>
        <p style={{ color: 'rgba(255,255,255,.7)' }}>All chefs are verified, background-checked professionals</p>
      </div>
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search chefs..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          <select className="form-control" value={minRating} onChange={e => setMinRating(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">Min Rating</option>
            {[4.5, 4, 3.5, 3].map(r => <option key={r} value={r}>★ {r}+</option>)}
          </select>
          <select className="form-control" value={maxRate} onChange={e => setMaxRate(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Max Rate</option>
            {[2000, 3000, 5000, 8000, 10000].map(r => <option key={r} value={r}>Under KES {r.toLocaleString()}/hr</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>Loading chefs...</div>
        ) : chefs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>👨‍🍳</div>
            <h3>No chefs found matching your criteria</h3>
          </div>
        ) : (
          <div className="grid grid-4">
            {chefs.map(chef => (
              <Link key={chef.id} to={`/chefs/${chef.id}`} className="card" style={{ textDecoration: 'none' }}>
                <div style={{ background: chef.is_available ? 'var(--accent)' : 'var(--secondary)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: 48 }}>👨‍🍳</span>
                  <span style={{ position: 'absolute', top: 8, right: 8, background: chef.is_available ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.5)', color: chef.is_available ? 'var(--accent)' : '#666', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    {chef.is_available ? '🟢 Available' : '⚫ Busy'}
                  </span>
                </div>
                <div className="card-body">
                  <h3 style={{ fontSize: 17, marginBottom: 4 }}>{chef.first_name} {chef.last_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
                    {Array.isArray(chef.specialties) ? chef.specialties.slice(0,2).join(', ') : ''}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#f1c40f', fontWeight: 700 }}>★ {chef.avg_rating || 'New'}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15 }}>KES {Number(chef.base_hourly_rate).toLocaleString()}/hr</span>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {chef.total_bookings} bookings · {chef.years_of_experience} yrs exp
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
