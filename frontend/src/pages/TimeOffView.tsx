import React, { useState, useEffect, FormEvent } from 'react';
import { Plus, CheckCircle2, XCircle, X } from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { TimeOffRequest, TimeOffAllocation } from '../types';

export default function TimeOffView() {
  const { user, isHRManager } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [myAllocations, setMyAllocations] = useState<TimeOffAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: '',
  });

  const fetchData = async () => {
    try {
      const [reqData, typeData, allocData] = await Promise.all([
        apiRequest<TimeOffRequest[]>('/api/time-off/requests'),
        apiRequest<any[]>('/api/time-off/types'),
        apiRequest<TimeOffAllocation[]>('/api/time-off/allocations'),
      ]);
      setRequests(reqData);
      setTypes(typeData);
      setAllocations(allocData);

      if (user?.employee_id) {
        const myAllocs = await apiRequest<TimeOffAllocation[]>(`/api/employees/${user.employee_id}/allocations`);
        setMyAllocations(myAllocs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const durationDays = Math.max(
    1,
    Math.round((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / 86400000) + 1
  );

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.type_id) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/time-off/requests', {
        method: 'POST',
        body: {
          ...formData,
          type_id: +formData.type_id,
          employee_id: user?.employee_id,
        },
      });
      setShowModal(false);
      setFormData({
        type_id: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        reason: '',
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await apiRequest(`/api/time-off/requests/${id}/approve`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRefuse = async (id: number) => {
    try {
      await apiRequest(`/api/time-off/requests/${id}/refuse`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Refusal failed');
    }
  };

  if (loading && !requests.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading leave requests...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' }}>My Leave Quota & Allocations</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Active leave entitlements and balance remaining
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            <span>Request Time Off</span>
          </button>
        </div>

        <div className="grid-4">
          {myAllocations.length > 0 ? (
            myAllocations.map((al) => {
              const rem = al.allocated - al.taken;
              return (
                <div key={al.id} className="card card-interactive">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1F2937' }}>
                      {al.type_name}
                    </span>
                    <span className="badge badge-info">{al.unit}</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2E7D5B', letterSpacing: '-0.02em' }}>
                    {rem} <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>remaining</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
                    {al.taken} used of {al.allocated} allocated
                  </div>
                </div>
              );
            })
          ) : (
            types.map((t) => (
              <div key={t.id} className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1F2937' }}>{t.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#64748B', marginTop: '8px' }}>
                  Policy {t.unit}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                  Approval: {t.approval_role}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>Leave Requests Register</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              Pending and processed absence requests
            </p>
          </div>
          <span className="badge badge-primary">{requests.length} Total Requests</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                {isHRManager && <th>HR Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: '#1F2937' }}>{r.employee_name}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#1E3A5F' }}>{r.type_name}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', color: '#1F2937' }}>{r.start_date} → {r.end_date}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1F2937' }}>
                      {r.duration} {r.unit || 'Days'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', color: '#64748B' }}>
                      {r.reason || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      r.status === 'Approved' ? 'badge-success' :
                      r.status === 'To Approve' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      <span className="badge-dot" />
                      {r.status}
                    </span>
                  </td>
                  {isHRManager && (
                    <td>
                      {r.status === 'To Approve' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(r.id)}
                            title="Approve Request"
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRefuse(r.id)}
                            title="Refuse Request"
                          >
                            <XCircle size={14} />
                            <span>Refuse</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Submit Time-Off Application</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit}>
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
                  <label className="form-label">Leave Category *</label>
                  <select
                    className="form-control"
                    value={formData.type_id}
                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.825rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: '#64748B' }}>Calculated Duration:</span>
                  <strong style={{ color: '#1F2937', fontSize: '0.95rem' }}>{durationDays} Day(s)</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide brief context for your supervisor..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
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
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
