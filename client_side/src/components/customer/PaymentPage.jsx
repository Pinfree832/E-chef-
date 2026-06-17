import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { bookingService, paymentService } from '../../services/booking.service';

export default function PaymentPage() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const [booking, setBooking]   = useState(null);
  const [method, setMethod]     = useState('mpesa');
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    bookingService.getById(id).then(r => setBooking(r.data.data)).catch(() => navigate('/customer/bookings'));
  }, [id, navigate]);

  async function handlePay(e) {
    e.preventDefault();
    setProcessing(true);
    try {
      if (method === 'mpesa') {
        await paymentService.initMpesa({ booking_id: id, phone_number: phone });
        toast.success('STK Push sent! Please check your phone and enter your M-Pesa PIN.');
        navigate('/customer/bookings');
      } else if (method === 'paypal') {
        const res = await paymentService.initPaypal(id);
        window.location.href = res.data.data.approve_url;
      } else if (method === 'stripe') {
        const res = await paymentService.initStripe(id);
        toast.success('Stripe payment initialized. Client secret: ' + res.data.data.client_secret.slice(0,20) + '...');
        navigate('/customer/bookings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setProcessing(false); }
  }

  if (!booking) return <div className="dashboard-layout"><Sidebar /><main className="main-content" style={{ padding: 40, textAlign: 'center' }}>Loading...</main></div>;

  const methods = [
    { id: 'mpesa',      label: 'M-Pesa',        icon: '📱', desc: 'Pay via Safaricom M-Pesa STK Push' },
    { id: 'stripe',     label: 'Card (Stripe)', icon: '💳', desc: 'Pay securely with credit/debit card' },
    { id: 'paypal',     label: 'PayPal',        icon: '🅿',  desc: 'Pay via PayPal account' }
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Complete Payment</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Booking #{booking.id} · {booking.booking_date} at {booking.start_time}</p>

        <div className="grid grid-2" style={{ maxWidth: 900 }}>
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header"><h3>Order Total</h3></div>
              <div className="card-body">
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>
                  KES {Number(booking.total_amount).toLocaleString()}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Chef: {booking.chef_name}</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Select Payment Method</h3></div>
              <div className="card-body">
                <form onSubmit={handlePay}>
                  {methods.map(m => (
                    <label key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 8, marginBottom: 12,
                      border: `2px solid ${method === m.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: method === m.id ? 'rgba(230,126,34,.05)' : '#fff', cursor: 'pointer'
                    }}>
                      <input type="radio" name="payment" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.desc}</div>
                      </div>
                    </label>
                  ))}

                  {method === 'mpesa' && (
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label className="form-label">M-Pesa Phone Number</label>
                      <input className="form-control" placeholder="+254700000000" value={phone} onChange={e => setPhone(e.target.value)} required />
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>You'll receive a push notification on your phone</p>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} disabled={processing}>
                    {processing ? 'Processing...' : `Pay KES ${Number(booking.total_amount).toLocaleString()} via ${methods.find(m => m.id === method)?.label}`}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><h3>Secure Payment</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['🔒 256-bit SSL encryption', '✅ PCI DSS compliant', '🛡 Fraud protection', '↩ Easy refund policy'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
