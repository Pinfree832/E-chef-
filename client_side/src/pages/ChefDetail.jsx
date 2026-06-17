import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { chefService, userService } from '../services/booking.service';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChefDetail() {
  const { id }  = useParams();
  const { user } = useAuth();
  const [chef, setChef]     = useState(null);
  const [isFav, setIsFav]   = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    chefService.getById(id).then(r => setChef(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  async function toggleFavorite() {
    if (!user) { toast.error('Please sign in to save favorites'); return; }
    try {
      const res = await userService.toggleFavorite(id);
      setIsFav(res.data.is_favorite);
      toast.success(res.data.message);
    } catch { toast.error('Failed to update favorites'); }
  }

  if (loading) return <div><Navbar /><div style={{ textAlign: 'center', padding: 80 }}>Loading...</div></div>;
  if (!chef) return <div><Navbar /><div style={{ textAlign: 'center', padding: 80 }}>Chef not found</div></div>;

  const specialties = Array.isArray(chef.specialties) ? chef.specialties : JSON.parse(chef.specialties || '[]');

  return (
    <div>
      <Navbar />
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--secondary), #1a1a2e)', padding: '48px 0', color: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, border: '4px solid rgba(255,255,255,.2)' }}>
              {chef.avatar_url ? <img src={chef.avatar_url} alt={chef.first_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👨‍🍳'}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: '#fff', fontSize: 36, marginBottom: 8 }}>{chef.first_name} {chef.last_name}</h1>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ color: '#f1c40f', fontWeight: 700, fontSize: 18 }}>★ {chef.avg_rating || 'New'}</span>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>· {chef.total_bookings} bookings</span>
                <span style={{ color: 'rgba(255,255,255,.7)' }}>· {chef.years_of_experience} years exp</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {specialties.map(s => <span key={s} className="badge" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>{s}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={toggleFavorite} className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>
                {isFav ? '❤️ Saved' : '🤍 Save Chef'}
              </button>
              <Link to={`/customer/book?chef=${id}`} className="btn btn-primary btn-lg">Book Now</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 320px', gap: 32 }}>
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '2px solid var(--border)' }}>
              {['menu','portfolio','reviews','about'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -2, textTransform: 'capitalize'
                }}>{tab}</button>
              ))}
            </div>

            {activeTab === 'menu' && (
              <div className="grid grid-3">
                {chef.menuItems?.map(item => (
                  <div key={item.id} className="card">
                    <div className="card-body">
                      <h4 style={{ fontSize: 15, marginBottom: 4 }}>{item.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{item.category_name}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--primary)' }}>KES {Number(item.custom_price || item.base_price).toLocaleString()}</strong>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>~{item.prep_time_mins}min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="grid grid-3">
                {chef.portfolio?.map(img => (
                  <div key={img.id} className="card" style={{ overflow: 'hidden' }}>
                    <img src={img.image_url} alt={img.caption} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    {img.caption && <div style={{ padding: '8px 12px', fontSize: 13 }}>{img.caption}</div>}
                  </div>
                ))}
                {!chef.portfolio?.length && <p style={{ color: 'var(--text-secondary)' }}>No portfolio images yet.</p>}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {chef.reviews?.map(r => (
                  <div key={r.id} className="card" style={{ marginBottom: 16 }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                          {r.reviewer_name?.[0]}
                        </div>
                        <div>
                          <strong>{r.reviewer_name}</strong>
                          <div style={{ color: '#f1c40f' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{r.comment}</p>
                      {r.chef_reply && (
                        <div style={{ background: 'var(--bg)', padding: '12px 16px', borderRadius: 8, marginTop: 12, borderLeft: '3px solid var(--primary)' }}>
                          <strong style={{ fontSize: 13 }}>Chef's Reply:</strong>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{r.chef_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!chef.reviews?.length && <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p>}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="card">
                <div className="card-body">
                  <h3 style={{ marginBottom: 16 }}>About {chef.first_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{chef.bio || 'No biography provided yet.'}</p>
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ marginBottom: 8 }}>Cuisine Specialties</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {specialties.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 20 }}>
              <div className="card-header"><h3>Pricing</h3></div>
              <div className="card-body">
                {[
                  ['Base Rate', `KES ${Number(chef.base_hourly_rate).toLocaleString()}/hr`],
                  ['Travel Rate', `KES ${Number(chef.travel_rate_per_km).toLocaleString()}/km`],
                  ['Equipment Fee', `KES ${Number(chef.equipment_fee).toLocaleString()}`],
                  ['Service Radius', `${chef.service_radius_km} km`],
                  ['Availability', chef.is_available ? '🟢 Available Now' : '⚫ Currently Busy']
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
                <Link to={`/customer/book?chef=${id}`} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }}>Book {chef.first_name}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
