import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { menuService, chefService } from '../services/booking.service';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredChefs, setFeaturedChefs] = useState([]);

  useEffect(() => {
    menuService.getCategories().then(r => setCategories(r.data.data || [])).catch(() => {});
    chefService.getAll({ limit: 4 }).then(r => setFeaturedChefs(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2c3e50 100%)', color: '#fff', padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: 52, marginBottom: 16, lineHeight: 1.1 }}>
            Restaurant-Quality Meals<br /><span style={{ color: 'var(--primary)' }}>At Your Home</span>
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,.75)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Book a verified professional chef who travels to your location, prepares your selected meal, and creates an unforgettable dining experience.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/register" className="btn btn-primary btn-lg">Book a Chef Now</Link>
            <Link to="/chefs" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>Meet Our Chefs</Link>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
            {[['500+', 'Verified Chefs'], ['10K+', 'Meals Served'], ['4.9★', 'Average Rating'], ['30+', 'Cuisines']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 0', background: '#fff' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48 }}>Four simple steps to an extraordinary meal</p>
          <div className="grid grid-4">
            {[
              { step: '01', icon: '🍽', title: 'Choose Your Meal', desc: 'Browse from 200+ dishes across 30+ cuisine categories' },
              { step: '02', icon: '👨‍🍳', title: 'Select a Chef', desc: 'Pick from verified chefs based on ratings, specialty, and availability' },
              { step: '03', icon: '📅', title: 'Book a Time', desc: 'Choose your preferred date, time, and number of guests' },
              { step: '04', icon: '🏠', title: 'Enjoy at Home', desc: 'Your chef arrives, cooks, and you enjoy a restaurant-quality experience' }
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8, letterSpacing: 2 }}>STEP {step}</div>
                <h3 style={{ fontSize: 20, marginBottom: 12, color: 'var(--secondary)' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Cuisines */}
      {categories.length > 0 && (
        <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>Explore Cuisines</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48 }}>From local Kenyan classics to international delicacies</p>
            <div className="grid grid-4">
              {categories.map(cat => (
                <Link key={cat.id} to={`/menu?category_id=${cat.id}`} className="card" style={{ textAlign: 'center', padding: 24, cursor: 'pointer' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🍴</div>
                  <h3 style={{ fontSize: 18, color: 'var(--secondary)' }}>{cat.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Chefs */}
      {featuredChefs.length > 0 && (
        <section style={{ padding: '80px 0', background: '#fff' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: 36, marginBottom: 12 }}>Top Chefs This Week</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48 }}>Highly-rated professionals ready to cook for you</p>
            <div className="grid grid-4">
              {featuredChefs.map(chef => (
                <Link key={chef.id} to={`/chefs/${chef.id}`} className="card" style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--primary)', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                    {chef.avatar_url ? <img src={chef.avatar_url} alt={chef.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👨‍🍳'}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: 18, marginBottom: 4 }}>{chef.first_name} {chef.last_name}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
                      {Array.isArray(chef.specialties) ? chef.specialties.slice(0,2).join(' · ') : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--warning)', fontWeight: 600 }}>★ {chef.avg_rating || 'New'}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>KES {chef.base_hourly_rate}/hr</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <Link to="/chefs" className="btn btn-primary btn-lg">View All Chefs</Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: 'var(--primary)', padding: '80px 0', textAlign: 'center', color: '#fff' }}>
        <div className="container">
          <h2 style={{ color: '#fff', fontSize: 40, marginBottom: 16 }}>Ready for an Extraordinary Meal?</h2>
          <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 18, marginBottom: 40 }}>Join thousands of Kenyans enjoying restaurant-quality food at home</p>
          <Link to="/auth/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>Start Booking Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-dark)', color: 'rgba(255,255,255,.6)', padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ marginBottom: 8, fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--primary)' }}>🍽 Mobility Chef</p>
          <p style={{ fontSize: 14 }}>© {new Date().getFullYear()} Mobility Chef Ltd. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16, fontSize: 13 }}>
            <Link to="/menu" style={{ color: 'rgba(255,255,255,.6)' }}>Menu</Link>
            <Link to="/chefs" style={{ color: 'rgba(255,255,255,.6)' }}>Chefs</Link>
            <Link to="/auth/login" style={{ color: 'rgba(255,255,255,.6)' }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
