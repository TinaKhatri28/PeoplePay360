import React, { useState, useEffect, FormEvent } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  X,
  Download
} from 'lucide-react';
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
    if (!formData.type_id) {
      setFormError('Please select a leave category');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/time-off/requests', {
        method: 'POST',
        body: {
          type_id: String(formData.type_id),
          start_date: formData.start_date,
          end_date: formData.end_date,
          duration: durationDays,
          reason: formData.reason,
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected = requests.length > 0 && requests.every((r) => selectedIds.includes(r.id));
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  const handleToggleSelectOne = (id: number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const exportSelectedCSV = () => {
    const targetRequests = selectedIds.length > 0
      ? requests.filter((r) => selectedIds.includes(r.id))
      : requests;

    const headers = ['ID', 'Employee', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Reason', 'Status'];
    const rows = targetRequests.map((r) => [
      r.id,
      r.employee_name,
      r.type_name,
      r.start_date,
      r.end_date,
      `${r.duration} ${r.unit || 'Days'}`,
      r.reason || '',
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `time_off_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkApprove = async () => {
    const pendingIds = requests
      .filter((r) => selectedIds.includes(r.id) && r.status === 'To Approve')
      .map((r) => r.id);
    if (!pendingIds.length) {
      alert('No pending requests to approve among selected items.');
      return;
    }
    try {
      await Promise.all(pendingIds.map((id) => apiRequest(`/api/time-off/requests/${id}/approve`, { method: 'POST' })));
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Bulk approval failed');
    }
  };

  const handleBulkRefuse = async () => {
    const pendingIds = requests
      .filter((r) => selectedIds.includes(r.id) && r.status === 'To Approve')
      .map((r) => r.id);
    if (!pendingIds.length) {
      alert('No pending requests to refuse among selected items.');
      return;
    }
    try {
      await Promise.all(pendingIds.map((id) => apiRequest(`/api/time-off/requests/${id}/refuse`, { method: 'POST' })));
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Bulk refusal failed');
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Leave Quota & Allocations</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
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
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {al.type_name}
                    </span>
                    <span className="badge badge-info">{al.unit}</span>
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
                    {rem} <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 500 }}>remaining</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {al.taken} used of {al.allocated} allocated
                  </div>
                </div>
              );
            })
          ) : (
            types.map((t) => (
              <div key={t.id} className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '8px' }}>
                  Policy {t.unit}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                  Approval: {t.approval_role}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Leave Requests Register</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Pending and processed absence requests
            </p>
          </div>
          <span className="badge badge-primary">{requests.length} Total Requests</span>
        </div>

        {/* Contextual Bulk Action Bar when items are selected */}
        {selectedIds.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-primary">{selectedIds.length} Selected</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                {selectedIds.length === requests.length
                  ? 'All leave requests selected'
                  : `${selectedIds.length} of ${requests.length} leave requests selected`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isHRManager && (
                <>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleBulkApprove}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Approve Selected</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleBulkRefuse}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                  >
                    <XCircle size={13} />
                    <span>Refuse Selected</span>
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={exportSelectedCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedIds([])}
                style={{ fontSize: '0.78rem' }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center', padding: '10px 12px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    title="Select All Requests"
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                  />
                </th>
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
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={isHRManager ? 8 : 7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <tr
                      key={r.id}
                      style={{
                        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.03)' : undefined,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOne(r.id, e)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#000000' }}
                          title={`Select request for ${r.employee_name}`}
                        />
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.employee_name}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#818cf8' }}>{r.type_name}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem' }}>{r.start_date} → {r.end_date}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {r.duration} {r.unit || 'Days'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
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
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Submit Time-Off Application</h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
                    background: 'rgba(220, 38, 38, 0.08)',
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    color: '#DC2626',
                    fontSize: '0.825rem',
                    fontWeight: 500,
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
                  background: 'rgba(99, 102, 241, 0.1)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Calculated Duration:</span>
                  <strong style={{ color: 'var(--primary-dark, #0f172a)', fontSize: '0.95rem' }}>{durationDays} Day(s)</strong>
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
