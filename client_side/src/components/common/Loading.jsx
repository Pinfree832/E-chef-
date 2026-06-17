import React from 'react';

export default function Loading({ fullPage = true, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="page-loading" style={{ flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div className="spinner" />
    </div>
  );
}
