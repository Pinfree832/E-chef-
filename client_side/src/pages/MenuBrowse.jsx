import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { menuService } from '../services/booking.service';

export default function MenuBrowse() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems]           = useState([]);
  const [activeCategory, setActiveCategory] = useState(params.get('category_id') || '');
  const [search, setSearch]         = useState('');
  const [dietary, setDietary]       = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => { menuService.getCategories().then(r => setCategories(r.data.data || [])); }, []);

  useEffect(() => {
    setLoading(true);
    menuService.getItems({ category_id: activeCategory || undefined, search, dietary: dietary || undefined, limit: 40 })
      .then(r => setItems(r.data.data || [])).finally(() => setLoading(false));
  }, [activeCategory, search, dietary]);

  return (
    <div>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', padding: '48px 0', color: '#fff', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 40, marginBottom: 12 }}>Explore Our Menu</h1>
        <p style={{ color: 'rgba(255,255,255,.8)' }}>200+ dishes across 30+ cuisine types, prepared fresh at your home</p>
      </div>
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
          <select className="form-control" value={dietary} onChange={e => setDietary(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Dietary</option>
            <option value="vegan">Vegan</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="halal">Halal</option>
            <option value="gluten-free">Gluten-Free</option>
            <option value="keto">Keto</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveCategory('')} className={`btn btn-sm ${!activeCategory ? 'btn-primary' : 'btn-outline'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id.toString())} className={`btn btn-sm ${activeCategory === cat.id.toString() ? 'btn-primary' : 'btn-outline'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>Loading menu...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🍽</div>
            <h3>No items found</h3>
          </div>
        ) : (
          <div className="grid grid-4">
            {items.map(item => (
              <div key={item.id} className="card">
                <div style={{ background: 'var(--bg)', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽'}
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>{item.category_name}</span>
                    {Array.isArray(item.dietary_tags) && item.dietary_tags.map(tag => (
                      <span key={tag} className="badge badge-success" style={{ fontSize: 11 }}>{tag}</span>
                    ))}
                  </div>
                  <h4 style={{ fontSize: 15, marginBottom: 4 }}>{item.name}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: 16 }}>KES {Number(item.base_price).toLocaleString()}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>~{item.prep_time_mins}min · {item.serves} servings</span>
                  </div>
                  <Link to={`/customer/book?menu=${item.id}`} className="btn btn-primary btn-sm btn-block" style={{ marginTop: 12 }}>Book This Dish</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
