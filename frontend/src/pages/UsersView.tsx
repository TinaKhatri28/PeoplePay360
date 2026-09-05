import React, { useState, useEffect, FormEvent } from 'react';
import { Plus, X, Search, Shield, UserCheck, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Employee } from '../types';

export default function UsersView() {
  const { isPayrollAdmin, isHRManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    role: 'Employee',
    status: 'Active',
  });

  const availableRoles = [
    'Employee',
    'HR Manager',
    'HR Payroll User',
    'HR Payroll Admin',
    'Admin',
  ];

  const fetchData = async () => {
    try {
      const [userData, empData] = await Promise.all([
        apiRequest<User[]>('/api/users'),
        apiRequest<Employee[]>('/api/employees'),
      ]);
      setUsers(userData);
      setEmployees(empData);
    } catch (err) {
      console.error('Failed to load user governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          roles: formData.role,
          employee_id: formData.employee_id || null,
        },
      });
      setShowModal(false);
      setFormData({
        employee_id: '',
        email: '',
        password: '',
        role: 'Employee',
        status: 'Active',
      });
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to provision user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        body: {
          role: formData.role,
          roles: formData.role,
          status: formData.status,
          ...(formData.password ? { password: formData.password } : {}),
          employee_id: formData.employee_id || null,
        },
      });
      setEditingUser(null);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user account');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    const rolesList = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : ['Employee']);
    setFormData({
      employee_id: (u.employee_id as any) ? String(u.employee_id) : '',
      email: u.email,
      password: '',
      role: rolesList[0] || u.role || 'Employee',
      status: u.status || 'Active',
    });
    setFormError(null);
  };

  const filteredUsers = users.filter((u) => {
    const rolesList = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
    const matchSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employee_name && u.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(u.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole =
      roleFilter === 'All' ||
      rolesList.some((r) => r.toLowerCase() === roleFilter.toLowerCase()) ||
      (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());
    return matchSearch && matchRole;
  });

  if (loading && !users.length) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', color: 'var(--text-muted)', fontWeight: 600 }}>
        Loading user governance matrix...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              User Governance & Access Control
            </h1>
            <span style={{
              background: '#090D16',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {users.length} Active Accounts
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Manage identity provisioning, authentication credentials, and multi-tenant security roles (RBAC).
          </p>
        </div>

        {(isPayrollAdmin || isHRManager) && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                employee_id: '',
                email: '',
                password: '',
                role: 'Employee',
                status: 'Active',
              });
              setFormError(null);
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            <span>Provision User</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search users by name, email, or identifier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              background: 'transparent',
              color: 'var(--text-main)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Role Filter:</span>
          <select
            className="form-control"
            style={{ width: '170px', padding: '6px 12px', fontSize: '0.825rem', fontWeight: 600 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR Payroll Admin">HR Payroll Admin</option>
            <option value="HR Payroll User">HR Payroll User</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Account Identifier</th>
              <th>Linked Employee</th>
              <th>Work Email</th>
              <th>System Role & Privileges</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No user accounts match the selected filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const rolesList = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : ['Employee']);
                const primaryRole = rolesList[0] || u.role || 'Employee';

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: '#090D16',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}>
                          {u.employee_name ? u.employee_name.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            #{String(u.id).slice(0, 8)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {u.created_at ? String(u.created_at).slice(0, 10) : 'Active'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {u.employee_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unlinked Account</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{u.email}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {rolesList.map((r) => (
                          <span
                            key={r}
                            className={`badge ${
                              r === 'Admin' || r === 'HR Payroll Admin' ? 'badge-danger' :
                              r === 'HR Payroll User' ? 'badge-warning' :
                              r === 'HR Manager' ? 'badge-info' : 'badge-neutral'
                            }`}
                          >
                            <Shield size={11} style={{ marginRight: '4px' }} />
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                        <span className="badge-dot" />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      {(isPayrollAdmin || isHRManager) && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(u)}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit User Modal */}
      {(showModal || editingUser) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={20} color="#000000" />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0 }}>
                  {editingUser ? 'Update User Privileges' : 'Provision User Account'}
                </h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    color: '#DC2626',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Link to Employee Profile</label>
                  <select
                    className="form-control"
                    value={formData.employee_id}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const emp = employees.find((x) => String(x.id) === empId);
                      setFormData({
                        ...formData,
                        employee_id: empId,
                        email: emp ? emp.email : formData.email,
                      });
                    }}
                  >
                    <option value="">Unlinked (System Administrator Account)</option>
                    {employees.map((e) => (
                      <option key={e.id} value={String(e.id)}>{e.name} ({e.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="user@oxp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? 'Reset Password (leave empty to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={editingUser ? '••••••••' : 'Minimum 6 characters'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={6}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Primary Security Role *</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      {availableRoles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {editingUser && (
                    <div className="form-group">
                      <label className="form-label">Account Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingUser ? 'Save Privileges' : 'Provision User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

