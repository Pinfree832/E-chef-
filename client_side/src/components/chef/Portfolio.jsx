import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { chefService } from '../../services/booking.service';
import api from '../../services/api';

export default function Portfolio() {
  const [images, setImages]   = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/users/profile').then(r => {
      if (r.data.data?.profile?.id) {
        api.get(`/chefs/${r.data.data.profile.id}`).then(res => setImages(res.data.data?.portfolio || []));
      }
    });
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) { toast.error('Please select an image'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption);
    try {
      await chefService.addPortfolio(fd);
      toast.success('Portfolio item added!');
      setCaption(''); setFile(null);
      e.target.reset();
    } catch { toast.error('Upload failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>Portfolio Gallery</h1>
        <div className="grid grid-2">
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header"><h3>Add Portfolio Image</h3></div>
              <div className="card-body">
                <form onSubmit={handleUpload}>
                  <div className="form-group">
                    <label className="form-label">Photo</label>
                    <input type="file" className="form-control" accept="image/*" onChange={e => setFile(e.target.files[0])} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Caption</label>
                    <input className="form-control" placeholder="e.g. Signature Nyama Choma" value={caption} onChange={e => setCaption(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload Photo'}</button>
                </form>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: 16 }}>Your Gallery ({images.length} photos)</h3>
            {images.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, border: '2px dashed var(--border)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼</div>
                <p style={{ color: 'var(--text-secondary)' }}>No portfolio images yet. Add your first photo!</p>
              </div>
            ) : (
              <div className="grid grid-3">
                {images.map(img => (
                  <div key={img.id} className="card" style={{ overflow: 'hidden' }}>
                    <img src={img.image_url} alt={img.caption} style={{ width: '100%', height: 160, objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                    {img.caption && <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>{img.caption}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
