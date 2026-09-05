import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Download,
  Eye,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, downloadPayslipPdf } from '../api';
import { AttendanceRecord, TimeOffAllocation, TimeOffRequest, Payslip } from '../types';

export default function EmployeeDashboardView() {
  const { user } = useAuth();
  const [attendanceToday, setAttendanceToday] = useState<AttendanceRecord | null>(null);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [myRequests, setMyRequests] = useState<TimeOffRequest[]>([]);
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  // Time off request modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [attData, allocData, reqData, slipData] = await Promise.all([
        apiRequest<AttendanceRecord[]>('/api/attendance/my-attendance').catch(() => []),
        apiRequest<TimeOffAllocation[]>('/api/time-off/my-allocations').catch(() => []),
        apiRequest<TimeOffRequest[]>('/api/time-off/my-requests').catch(() => []),
        apiRequest<Payslip[]>('/api/payroll/my-payslips').catch(() => []),
      ]);

      setAttendanceToday(attData?.[0] || null);
      setAllocations(allocData || []);
      setMyRequests(reqData || []);
      setMyPayslips(slipData || []);
    } catch (err) {
      console.error('Error fetching employee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handlePunch = async (action: 'check-in' | 'check-out') => {
    try {
      await apiRequest(`/api/attendance/${action}`, { method: 'POST' });
      fetchEmployeeData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action}`);
    }
  };

  const handleCreateLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/time-off/requests', {
        method: 'POST',
        body: {
          type_id: +leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          duration: +duration,
          reason,
        },
      });
      setShowLeaveModal(false);
      fetchEmployeeData();
      alert('Time off request submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #3F5F7F 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: '#93C5FD', textTransform: 'uppercase' }}>
            EMPLOYEE PORTAL
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 6px 0', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.employee_name || user?.email}!
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#CBD5E1', margin: 0 }}>
            Track your daily attendance, manage leave balance, and download monthly payslips.
          </p>
        </div>

        {/* Live Punch Clock Button */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#93C5FD', fontWeight: 600 }}>Shift Status Today</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {attendanceToday?.check_in && !attendanceToday?.check_out ? 'Clocked In' : attendanceToday?.check_out ? 'Shift Completed' : 'Not Clocked In'}
            </div>
          </div>

          {!attendanceToday?.check_in ? (
            <button
              onClick={() => handlePunch('check-in')}
              className="btn btn-success"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              Clock In Now
            </button>
          ) : !attendanceToday?.check_out ? (
            <button
              onClick={() => handlePunch('check-out')}
              className="btn btn-danger"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              Clock Out
            </button>
          ) : (
            <span className="badge badge-success">Done for Today</span>
          )}
        </div>
      </div>

      {/* Grid: Attendance, Time Off Quotas, Payslips */}
      <div className="grid-3" style={{ gap: '24px' }}>
        {/* Attendance Summary */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>My Attendance</h3>
            <Clock size={18} color="#1E3A5F" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Check In Time</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginTop: '2px' }}>
                {attendanceToday?.check_in ? new Date(attendanceToday.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Check Out Time</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', marginTop: '2px' }}>
                {attendanceToday?.check_out ? new Date(attendanceToday.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>

            <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Worked Hours</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2E7D5B', marginTop: '2px' }}>
                {attendanceToday?.worked_hours ? `${attendanceToday.worked_hours} hrs` : '0 hrs'}
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balance Quota */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>My Time Off Balances</h3>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowLeaveModal(true)}
            >
              <Plus size={14} /> Request Leave
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {allocations.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '12px 0' }}>No leave quota allocated yet.</div>
            ) : (
              allocations.map((alloc) => (
                <div
                  key={alloc.id}
                  style={{
                    padding: '12px',
                    background: '#F8F9FA',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' }}>{alloc.type_name}</div>
                    <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                      Allocated: {alloc.allocated} {alloc.unit || 'Days'} • Taken: {alloc.taken}
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E3A5F' }}>
                    {alloc.allocated - alloc.taken} rem
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Payslips */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937' }}>My Payslips</h3>
            <FileText size={18} color="#1E3A5F" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myPayslips.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '12px 0' }}>No released payslips found.</div>
            ) : (
              myPayslips.map((slip) => (
                <div
                  key={slip.id}
                  style={{
                    padding: '12px',
                    background: '#F8F9FA',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' }}>
                      Payslip #{slip.id}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#2E7D5B', fontWeight: 600 }}>
                      Net: ₹{slip.net.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => downloadPayslipPdf(slip.id)}
                    title="Download Payslip PDF"
                  >
                    <Download size={14} /> PDF
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1F2937' }}>Request Time Off</h2>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Leave Type</label>
                <select
                  className="form-control"
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(+e.target.value)}
                >
                  <option value={1}>Paid Time Off (Days)</option>
                  <option value={2}>Sick Leave (Days)</option>
                  <option value={3}>Comp Off (Hours)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Duration (Days/Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-control"
                  value={duration}
                  onChange={(e) => setDuration(+e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Reason</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide reason for time off..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setShowLeaveModal(false)}
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
