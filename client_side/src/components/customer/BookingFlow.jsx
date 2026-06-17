import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { menuService, chefService, bookingService, userService } from '../../services/booking.service';

const STEPS = ['Select Meals', 'Choose Chef', 'Schedule', 'Confirm & Pay'];

export default function BookingFlow() {
  const [step, setStep]         = useState(0);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems]   = useState([]);
  const [chefs, setChefs]           = useState([]);
  const [addresses, setAddresses]   = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectedChef, setSelectedChef]   = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime]     = useState('');
  const [guests, setGuests]           = useState(2);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading]         = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    menuService.getCategories().then(r => setCategories(r.data.data || []));
    menuService.getItems({ limit: 50 }).then(r => setMenuItems(r.data.data || []));
    chefService.getAll({ limit: 20 }).then(r => setChefs(r.data.data || []));
    userService.getAddresses().then(r => { const addrs = r.data.data || []; setAddresses(addrs); setSelectedAddress(addrs.find(a => a.is_default)?.id); });
  }, []);

  function toggleItem(item) {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[item.id]) delete copy[item.id];
      else copy[item.id] = { ...item, quantity: 1 };
      return copy;
    });
  }

  function updateQuantity(itemId, qty) {
    setSelectedItems(prev => ({ ...prev, [itemId]: { ...prev[itemId], quantity: Math.max(1, qty) } }));
  }

  const itemsForBooking = Object.values(selectedItems);
  const foodTotal = itemsForBooking.reduce((s, i) => s + i.base_price * i.quantity, 0);

  async function handleSubmit() {
    if (!selectedChef || !selectedAddress || !bookingDate || !startTime) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      const res = await bookingService.create({
        chef_id: selectedChef.id,
        address_id: selectedAddress,
        booking_date: bookingDate,
        start_time: startTime,
        guests_count: guests,
        special_instructions: instructions,
        items: itemsForBooking.map(i => ({ menu_item_id: i.id, quantity: i.quantity }))
      });
      toast.success('Booking created!');
      navigate(`/customer/payment/${res.data.data.booking.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Book a Chef</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Follow the steps to book your perfect chef experience</p>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {STEPS.map((s, i) => (
            <div key={s} onClick={() => i < step && setStep(i)} style={{
              flex: 1, padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600,
              background: i === step ? 'var(--primary)' : i < step ? 'var(--accent)' : '#fff',
              color: i <= step ? '#fff' : 'var(--text-secondary)', cursor: i < step ? 'pointer' : 'default',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              {i < step ? '✓ ' : `${i+1}. `}{s}
            </div>
          ))}
        </div>

        {/* Step 0: Select Meals */}
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat.id} className="btn btn-outline btn-sm">{cat.name}</button>
              ))}
            </div>
            <div className="grid grid-4">
              {menuItems.map(item => {
                const selected = !!selectedItems[item.id];
                return (
                  <div key={item.id} className="card" style={{ border: selected ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                    <div style={{ background: 'var(--bg)', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🍽</div>
                    <div className="card-body" style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 15, marginBottom: 4 }}>{item.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{item.category_name}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--primary)' }}>KES {Number(item.base_price).toLocaleString()}</strong>
                        {selected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => updateQuantity(item.id, selectedItems[item.id].quantity - 1)} style={{ background: 'var(--border)', border: 'none', borderRadius: 4, width: 24, height: 24, cursor: 'pointer' }}>-</button>
                            <span style={{ fontWeight: 700 }}>{selectedItems[item.id].quantity}</span>
                            <button onClick={() => updateQuantity(item.id, selectedItems[item.id].quantity + 1)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, width: 24, height: 24, cursor: 'pointer' }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => toggleItem(item)} className="btn btn-primary btn-sm">Add</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, padding: '16px 24px', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
              <span>{itemsForBooking.length} item(s) selected — <strong>KES {foodTotal.toLocaleString()}</strong></span>
              <button className="btn btn-primary" disabled={itemsForBooking.length === 0} onClick={() => setStep(1)}>Next: Choose Chef →</button>
            </div>
          </div>
        )}

        {/* Step 1: Choose Chef */}
        {step === 1 && (
          <div>
            <div className="grid grid-3">
              {chefs.map(chef => (
                <div key={chef.id} className="card" style={{ cursor: 'pointer', border: selectedChef?.id === chef.id ? '2px solid var(--primary)' : '1px solid var(--border)' }} onClick={() => setSelectedChef(chef)}>
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                        {chef.first_name?.[0]}{chef.last_name?.[0]}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 16 }}>{chef.first_name} {chef.last_name}</h4>
                        <div style={{ color: 'var(--warning)', fontWeight: 600, fontSize: 13 }}>★ {chef.avg_rating || 'New'}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginTop: 4 }}>KES {Number(chef.base_hourly_rate).toLocaleString()}/hr</div>
                      </div>
                    </div>
                    {chef.specialties && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(Array.isArray(chef.specialties) ? chef.specialties : JSON.parse(chef.specialties || '[]')).map(s => (
                          <span key={s} className="badge badge-primary">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" disabled={!selectedChef} onClick={() => setStep(2)}>Next: Schedule →</button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Service Date</label>
                <input type="date" className="form-control" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Guests</label>
                <input type="number" className="form-control" value={guests} onChange={e => setGuests(parseInt(e.target.value))} min={1} max={100} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <select className="form-control" value={selectedAddress} onChange={e => setSelectedAddress(e.target.value)}>
                  {addresses.map(a => <option key={a.id} value={a.id}>{a.label} – {a.address_line1}, {a.city}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea className="form-control" rows={3} placeholder="Any dietary requirements, allergies, or special requests..." value={instructions} onChange={e => setInstructions(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" disabled={!bookingDate || !startTime || !selectedAddress} onClick={() => setStep(3)}>Next: Confirm →</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="grid grid-2">
            <div className="card">
              <div className="card-header"><h3>Order Summary</h3></div>
              <div className="card-body">
                {itemsForBooking.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>KES {(item.base_price * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
                <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Chef: {selectedChef?.first_name} {selectedChef?.last_name}</span>
                  <span>{bookingDate} at {startTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 16, color: 'var(--primary)' }}>
                  <span>Estimated Total</span>
                  <span>KES {(foodTotal * 1.15 * 1.16).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>*Includes chef fee, transport, platform fee (15%) & VAT (16%). Exact total calculated at confirmation.</p>
              </div>
            </div>
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-body">
                  <h3 style={{ marginBottom: 16 }}>Payment Method</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>You'll choose your payment method after booking confirmation.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {['M-Pesa', 'Stripe', 'PayPal', 'Visa', 'Mastercard'].map(m => (
                      <span key={m} className="badge badge-info">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating Booking...' : '✓ Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
