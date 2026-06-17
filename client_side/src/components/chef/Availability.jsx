import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { chefService } from '../../services/booking.service';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function Availability() {
  const [slots, setSlots] = useState(
    DAYS.map((_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '18:00', enabled: i > 0 && i < 6 }))
  );
  const [loading, setLoading] = useState(false);

  function toggleDay(index) {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  }

  function setTime(index, field, value) {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    setLoading(true);
    const activeSlots = slots.filter(s => s.enabled).map(({ enabled, ...s }) => s);
    try {
      await chefService.setAvailability(activeSlots);
      toast.success('Availability updated!');
    } catch { toast.error('Failed to update'); }
    finally { setLoading(false); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Availability Calendar</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Set your weekly working hours</p>
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-header"><h3>Weekly Schedule</h3></div>
          <div className="card-body">
            {slots.map((slot, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, width: 120, cursor: 'pointer' }}>
                  <input type="checkbox" checked={slot.enabled} onChange={() => toggleDay(i)} style={{ accentColor: 'var(--primary)', width: 18, height: 18 }} />
                  <span style={{ fontWeight: slot.enabled ? 600 : 400, color: slot.enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{DAYS[i]}</span>
                </label>
                <input type="time" className="form-control" style={{ width: 120 }} value={slot.start_time} onChange={e => setTime(i, 'start_time', e.target.value)} disabled={!slot.enabled} />
                <span style={{ color: 'var(--text-secondary)' }}>to</span>
                <input type="time" className="form-control" style={{ width: 120 }} value={slot.end_time} onChange={e => setTime(i, 'end_time', e.target.value)} disabled={!slot.enabled} />
              </div>
            ))}
            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: 24 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
