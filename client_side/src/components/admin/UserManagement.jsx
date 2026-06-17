import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../common/Sidebar';
import { adminService } from '../../services/booking.service';

export default function UserManagement() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    adminService.getUsers({ search, role, page, limit: 20 }).then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  }, [search, role, page]);

  async function toggleStatus(id, currentStatus) {
    try {
      await adminService.updateUserStatus(id, !currentStatus);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px 40px' }}>
        <h1 style={{ marginBottom: 32 }}>User Management</h1>
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input className="form-control" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          <select className="form-control" value={role} onChange={e => setRole(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="chef">Chef</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div> : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.email}</td>
                      <td style={{ fontSize: 13 }}>{u.phone || '–'}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'chef' ? 'badge-info' : 'badge-primary'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => toggleStatus(u.id, u.is_active)} className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-success'}`} style={{ fontSize: 12 }}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
