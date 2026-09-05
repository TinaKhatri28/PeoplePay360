import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  User,
  Mail,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';

export default function UsersView() {
  const { isPayrollAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    password: '',
    roles: ['Employee'],
    status: 'Active',
  });

  const availableRoles = [
    'Employee',
    'HR Manager',
    'HR Payroll User',
    'HR Payroll Admin',
  ];

  const fetchData = async () => {
    try {
      const [userData, empData] = await Promise.all([
        apiRequest('/api/users'),
        apiRequest('/api/employees'),
      ]);
      setUsers(userData);
      setEmployees(empData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleToggle = (role) => {
    if (formData.roles.includes(role)) {
      if (formData.roles.length === 1) return; // must keep at least 1 role
      setFormData({ ...formData, roles: formData.roles.filter((r) => r !== role) });
    } else {
      setFormData({ ...formData, roles: [...formData.roles, role] });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: {
          ...formData,
          employee_id: formData.employee_id ? +formData.employee_id : null,
        },
      });
      setShowModal(false);
      setFormData({
        employee_id: '',
        email: '',
        password: '',
        roles: ['Employee'],
        status: 'Active',
      });
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1F2937' }}>User & Role Governance</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Assign security roles (Employee, HR Manager, Payroll User, Admin) and credentials
          </p>
        </div>

        {isPayrollAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            <span>Create User Account</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Linked Employee</th>
              <th>Email Address</th>
              <th>Assigned System Roles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1E3A5F' }}>
                    #{u.id}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>{u.employee_name || 'System Admin'}</div>
                </td>
                <td>
                  <span style={{ color: '#1F2937' }}>{u.email}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {u.roles?.map((r) => (
                      <span
                        key={r}
                        className={`badge ${
                          r === 'HR Payroll Admin' ? 'badge-danger' :
                          r === 'HR Payroll User' ? 'badge-warning' :
                          r === 'HR Manager' ? 'badge-info' : 'badge-neutral'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                    <span className="badge-dot" />
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Provision System User</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {formError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(180, 35, 24, 0.08)',
                    border: '1px solid rgba(180, 35, 24, 0.25)',
                    color: '#B42318',
                    fontSize: '0.825rem',
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Link to Employee Profile</label>
                  <select
                    className="form-control"
                    value={formData.employee_id}
                    onChange={(e) => {
                      const empId = e.target.value;
                      const emp = employees.find((x) => x.id === +empId);
                      setFormData({
                        ...formData,
                        employee_id: empId,
                        email: emp ? emp.email : formData.email,
                      });
                    }}
                  >
                    <option value="">Unlinked (System User)</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Work Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="user@oxp.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Role Checkboxes */}
                <div className="form-group">
                  <label className="form-label">Assign System Roles *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {availableRoles.map((role) => {
                      const isChecked = formData.roles.includes(role);
                      return (
                        <label
                          key={role}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: isChecked ? 'rgba(30, 58, 95, 0.08)' : '#F8F9FA',
                            border: `1px solid ${isChecked ? '#1E3A5F' : '#E2E8F0'}`,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleRoleToggle(role)}
                          />
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
