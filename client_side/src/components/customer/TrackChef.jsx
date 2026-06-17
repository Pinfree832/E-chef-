import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

export default function TrackChef() {
  const { id }         = useParams();
  const { on, off, joinBooking, leaveBooking } = useSocket();
  const [location, setLocation] = useState(null);
  const [booking, setBooking]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    api.get(`/bookings/${id}`).then(r => setBooking(r.data.data));
    api.get(`/tracking/booking/${id}`).then(r => setLocation(r.data.data?.current_location)).catch(() => {});
    joinBooking(id);

    const handler = (data) => {
      setLocation({ current_latitude: data.latitude, current_longitude: data.longitude });
      setLastUpdate(new Date(data.timestamp));
    };
    on('chef_location_update', handler);

    intervalRef.current = setInterval(() => {
      api.get(`/tracking/booking/${id}`).then(r => { if (r.data.data?.current_location) setLocation(r.data.data.current_location); }).catch(() => {});
    }, 30000);

    return () => {
      off('chef_location_update', handler);
      leaveBooking(id);
      clearInterval(intervalRef.current);
    };
  }, [id, joinBooking, leaveBooking, on, off]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 8 }}>Live Chef Tracking</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Booking #{id}</p>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h3>Chef Location</h3>
              <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>🟢 Live</span>
            </div>
            <div className="card-body">
              {/* Map placeholder – integrate Google Maps API here */}
              <div style={{ background: 'var(--bg)', borderRadius: 12, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 48 }}>🗺️</div>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
                  Google Maps integration required.<br />
                  Set REACT_APP_GOOGLE_MAPS_API_KEY in .env
                </p>
                {location && (
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-primary)' }}>
                    <strong>Chef Coordinates:</strong><br />
                    Lat: {location.current_latitude}<br />
                    Lng: {location.current_longitude}
                  </div>
                )}
              </div>
              {lastUpdate && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Last update: {lastUpdate.toLocaleTimeString()}</p>}
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Status Updates</h3></div>
              <div className="card-body">
                {booking && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Booking Confirmed',  time: booking.chef_accepted_at },
                      { label: 'Chef Departed',       time: booking.chef_departed_at },
                      { label: 'Chef Arrived',        time: booking.chef_arrived_at },
                      { label: 'Cooking Started',     time: booking.service_started_at },
                      { label: 'Service Completed',   time: booking.service_completed_at }
                    ].map(({ label, time }) => (
                      <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: time ? 'var(--accent)' : 'var(--border)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: time ? 600 : 400, fontSize: 14, color: time ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</div>
                          {time && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(time).toLocaleTimeString()}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Quick Contact</h3></div>
              <div className="card-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Chef: <strong>{booking?.chef_name}</strong></p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <a href={`tel:${booking?.chef_phone}`} className="btn btn-outline" style={{ flex: 1 }}>📞 Call Chef</a>
                  <a href="/messages" className="btn btn-primary" style={{ flex: 1 }}>💬 Message</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
