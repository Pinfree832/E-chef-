import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { userService } from '../../services/booking.service';

export default function FavoriteChefs() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { userService.getFavorites().then(r => setFavorites(r.data.data || [])).finally(() => setLoading(false)); }, []);

  async function handleRemove(chefId) {
    try {
      await userService.toggleFavorite(chefId);
      setFavorites(prev => prev.filter(f => f.chef_profile_id !== chefId));
      toast.success('Removed from favorites');
    } catch { toast.error('Failed to remove'); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Favorite Chefs</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Your saved chefs for quick booking</p>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>❤️</div>
            <h3>No favorite chefs yet</h3>
            <Link to="/chefs" className="btn btn-primary" style={{ marginTop: 20 }}>Browse Chefs</Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {favorites.map(fav => (
              <div key={fav.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>
                      {fav.first_name?.[0]}{fav.last_name?.[0]}
                    </div>
                    <div>
                      <h4>{fav.first_name} {fav.last_name}</h4>
                      <div style={{ color: 'var(--warning)', fontSize: 13 }}>★ {fav.avg_rating}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/chefs/${fav.chef_profile_id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>View Profile</Link>
                    <Link to={`/customer/book?chef=${fav.chef_profile_id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Book</Link>
                  </div>
                  <button onClick={() => handleRemove(fav.chef_profile_id)} style={{ marginTop: 8, width: '100%', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 13 }}>
                    Remove from favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
