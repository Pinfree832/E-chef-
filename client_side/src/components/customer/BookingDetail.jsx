import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { bookingService } from '../../services/booking.service';

const STATUS_STEPS = ['pending','confirmed','chef_en_route','in_progress','completed'];

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', food_rating: 5, service_rating: 5, punctuality_rating: 5 });
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    bookingService.getById(id).then(r => setBooking(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    try {
      await bookingService.updateStatus(id, 'completed');
      toast.success('Service confirmed!');
      setBooking(b => ({ ...b, status: 'completed' }));
      setShowReview(true);
    } catch { toast.error('Failed to confirm'); }
  }

  async function handleReview(e) {
    e.preventDefault();
    try {
      await bookingService.review(id, reviewForm);
      toast.success('Review submitted. Thank you!');
      setShowReview(false);
    } catch { toast.error('Failed to submit review'); }
  }

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="main-content" style={{ padding: 40, textAlign: 'center' }}>Loading...</main></div>;
  if (!booking) return null;

  const currentStep = STATUS_STEPS.indexOf(booking.status);
  const costRows = [
    ['Food Cost', booking.food_cost],
    ['Chef Fee', booking.chef_fee],
    ['Transport Fee', booking.transport_fee],
    ['Equipment Fee', booking.equipment_fee],
    ['Platform Commission (15%)', booking.platform_commission],
    ['VAT (16%)', booking.tax]
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1>Booking #{booking.id}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{new Date(booking.booking_date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.start_time}</p>
          </div>
          {booking.status === 'chef_en_route' && (
            <Link to={`/customer/track/${booking.id}`} className="btn btn-primary">📍 Track Chef</Link>
          )}
        </div>

        {/* Progress */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <h3 style={{ marginBottom: 20 }}>Booking Progress</h3>
            <div style={{ display: 'flex', position: 'relative' }}>
              {STATUS_STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                    background: i <= currentStep ? 'var(--primary)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14
                  }}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 12, color: i <= currentStep ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: i === currentStep ? 700 : 400 }}>
                    {s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 18, left: '50%', width: '100%', height: 2, background: i < currentStep ? 'var(--primary)' : 'var(--border)' }} />
                  )}
                </div>
              ))}
            </div>
            {booking.status === 'in_progress' && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="btn btn-success btn-lg" onClick={handleConfirm}>✓ Confirm Service Completed</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 24 }}>
          {/* Chef Info */}
          <div className="card">
            <div className="card-header"><h3>Chef Details</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 }}>
                  {booking.chef_name?.[0]}
                </div>
                <div>
                  <h4>{booking.chef_name}</h4>
                  <p style={{ color: 'var(--warning)', fontWeight: 600 }}>★ {booking.avg_rating}</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>📞 {booking.chef_phone}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>📍 {booking.address_line1}, {booking.city}</p>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="card">
            <div className="card-header"><h3>Payment Breakdown</h3></div>
            <div className="card-body">
              {costRows.map(([label, val]) => val > 0 && (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span>KES {Number(val).toLocaleString()}</span>
                </div>
              ))}
              <hr style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>KES {Number(booking.total_amount).toLocaleString()}</span>
              </div>
              {booking.loyalty_points_earned > 0 && (
                <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8 }}>+ {booking.loyalty_points_earned} loyalty points earned</p>
              )}
            </div>
          </div>
        </div>

        {/* Items ordered */}
        {booking.items?.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header"><h3>Items Ordered</h3></div>
            <div className="card-body">
              {booking.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{item.name} × {item.quantity}</span>
                  <strong>KES {Number(item.subtotal).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form */}
        {(showReview || booking.status === 'completed') && !booking.has_review && (
          <div className="card" style={{ marginTop: 24, border: '2px solid var(--primary)' }}>
            <div className="card-header"><h3>⭐ Rate Your Experience</h3></div>
            <div className="card-body">
              <form onSubmit={handleReview}>
                <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
                  {[['Overall Rating', 'rating'], ['Food Rating', 'food_rating'], ['Service Rating', 'service_rating'], ['Punctuality', 'punctuality_rating']].map(([label, key]) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <select className="form-control" value={reviewForm[key]} onChange={e => setReviewForm(p => ({ ...p, [key]: parseInt(e.target.value) }))}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n !== 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea className="form-control" rows={3} placeholder="Share your experience..." value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
