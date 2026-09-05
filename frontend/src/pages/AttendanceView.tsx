import React, { useState, useEffect, FormEvent } from 'react';
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Edit2,
  X
} from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord } from '../types';

export default function AttendanceView() {
  const { user, isHRManager } = useAuth();
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [myStatus, setMyStatus] = useState<{ checkedIn: boolean; record: AttendanceRecord | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [punchMsg, setPunchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    check_in: '',
    check_out: '',
    status: 'Present',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const logsData = await apiRequest<AttendanceRecord[]>('/api/attendance');
      setLogs(logsData);
      if (user?.employee_id) {
        const st = await apiRequest<{ checkedIn: boolean; record: AttendanceRecord | null }>('/api/attendance/me/status');
        setMyStatus(st);
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

  const handlePunch = async (action: 'in' | 'out') => {
    setPunching(true);
    setPunchMsg(null);
    try {
      if (action === 'in') {
        await apiRequest('/api/attendance/check-in', {
          method: 'POST',
          body: { employee_id: user?.employee_id },
        });
        setPunchMsg({ type: 'success', text: 'Checked in successfully! Shift started.' });
      } else {
        const res = await apiRequest<{ worked_hours: number; overtime_hours: number }>('/api/attendance/check-out', {
          method: 'POST',
          body: { employee_id: user?.employee_id },
        });
        setPunchMsg({
          type: 'success',
          text: `Checked out successfully. Shift total: ${res.worked_hours}h (Overtime: ${res.overtime_hours}h)`,
        });
      }
      fetchData();
    } catch (err: any) {
      setPunchMsg({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setPunching(false);
    }
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await apiRequest(`/api/attendance/${editingRecord.id}`, {
        method: 'PUT',
        body: editForm,
      });
      setEditingRecord(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update record');
    }
  };

  if (loading && !logs.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading attendance records...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {user?.employee_id && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(19, 26, 43, 0.95) 0%, rgba(27, 38, 65, 0.85) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Clock size={20} color="#818cf8" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  Self-Service Punch Clock
                </h3>
                <span className={`badge ${myStatus?.checkedIn ? 'badge-success' : 'badge-neutral'}`}>
                  <span className="badge-dot" />
                  {myStatus?.checkedIn ? 'Active Shift' : 'Off Clock'}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {myStatus?.record?.check_in
                  ? `Shift began at ${new Date(myStatus.record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'You have not checked in for today yet.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!myStatus?.checkedIn ? (
                <button
                  className="btn btn-success btn-lg"
                  disabled={punching || Boolean(myStatus?.record && myStatus.record.check_out)}
                  onClick={() => handlePunch('in')}
                  style={{ minWidth: '160px' }}
                >
                  <Play size={18} />
                  <span>{myStatus?.record?.check_out ? 'Shift Finished' : 'Punch In (Check In)'}</span>
                </button>
              ) : (
                <button
                  className="btn btn-danger btn-lg"
                  disabled={punching}
                  onClick={() => handlePunch('out')}
                  style={{ minWidth: '160px' }}
                >
                  <Square size={18} />
                  <span>Punch Out (Check Out)</span>
                </button>
              )}
            </div>
          </div>

          {punchMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: punchMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              border: `1px solid ${punchMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: punchMsg.type === 'success' ? '#34d399' : '#fca5a5',
              fontSize: '0.85rem',
            }}>
              {punchMsg.text}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Company Attendance Register</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
              Real-time daily punch logs and overtime calculations
            </p>
          </div>
          <span className="badge badge-info">{logs.length} Total Records</span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Worked (Hours)</th>
                <th>Overtime (Hours)</th>
                <th>Status</th>
                {isHRManager && <th>Correction</th>}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{log.employee_name}</span>
                  </td>
                  <td>{log.date}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                      {log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.825rem' }}>
                      {log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {log.worked_hours || 0} hrs
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: log.overtime_hours > 0 ? 700 : 400,
                      color: log.overtime_hours > 0 ? '#34d399' : 'var(--text-muted)',
                    }}>
                      {log.overtime_hours > 0 ? `+${log.overtime_hours} hrs` : '0'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      log.status === 'Present' ? 'badge-success' :
                      log.status === 'Late' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      <span className="badge-dot" />
                      {log.status}
                    </span>
                  </td>
                  {isHRManager && (
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingRecord(log);
                          setEditForm({
                            check_in: log.check_in || '',
                            check_out: log.check_out || '',
                            status: log.status || 'Present',
                            notes: log.notes || '',
                          });
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Adjust Attendance Record</h3>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setEditingRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Employee: <strong style={{ color: '#fff' }}>{editingRecord.employee_name}</strong> on <strong>{editingRecord.date}</strong>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Check-in ISO Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.check_in}
                      onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-out ISO Time</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.check_out}
                      onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adjustment Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Approved manual timesheet"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
