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
  X,
  Plus,
  ArrowLeft,
  User,
  Building2,
  UserCheck,
  Info,
  ChevronRight,
  Download,
  CheckSquare
} from 'lucide-react';
import { apiRequest } from '../api';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, Employee } from '../types';

export default function AttendanceView() {
  const { user, isHRManager } = useAuth();
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myStatus, setMyStatus] = useState<{ checkedIn: boolean; record: AttendanceRecord | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [punchMsg, setPunchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multi-Selection State for Employees / Records
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Filters (Matching Excalidraw Screenshot 1)
  const [search, setSearch] = useState('');
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Selected Attendance Record (Form View of one attendance record)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Manual Attendance Modal [NEW]
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubmitting, setNewSubmitting] = useState(false);
  const [newFormError, setNewFormError] = useState<string | null>(null);
  const [newFormData, setNewFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().slice(0, 10),
    check_in_time: '09:00',
    check_out_time: '18:00',
    status: 'Present',
    notes: 'Manually logged attendance',
  });

  // Edit/Correction Modal [EDIT]
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    check_in_time: '',
    check_out_time: '',
    worked_hours: '',
    overtime_hours: '',
    status: 'Present',
    notes: '',
  });

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateTimeStr?: string | null): string => {
    if (!dateTimeStr) return '—';
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateTimeStr;
    }
  };

  const formatFullDateTime = (dateStr?: string | null, timeStr?: string | null): string => {
    if (!dateStr && !timeStr) return '—';
    if (timeStr) {
      try {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          const day = String(d.getUTCDate()).padStart(2, '0');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const datePart = `${day}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
          const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `${datePart} ${timePart}`;
        }
      } catch {}
    }
    return `${formatDate(dateStr)} ${formatTimeOnly(timeStr)}`;
  };

  const fetchData = async () => {
    try {
      const [logsData, empsData] = await Promise.all([
        apiRequest<AttendanceRecord[]>('/api/attendance'),
        apiRequest<Employee[]>('/api/employees').catch(() => []),
      ]);
      setLogs(logsData || []);
      setEmployees(empsData || []);

      if (user?.employee_id) {
        const st = await apiRequest<{ checkedIn: boolean; record: AttendanceRecord | null }>('/api/attendance/me/status');
        setMyStatus(st);
      }
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdated = () => fetchData();
    window.addEventListener('attendance-updated', handleUpdated);
    return () => window.removeEventListener('attendance-updated', handleUpdated);
  }, [user]);

  const openRecordDetails = async (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setLoadingDetail(true);
    try {
      const detail = await apiRequest<AttendanceRecord>(`/api/attendance/${record.id}`);
      setSelectedRecord(detail);
    } catch (err) {
      console.error('Failed to load attendance record details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

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
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err: any) {
      setPunchMsg({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setPunching(false);
    }
  };

  const startEdit = (record: AttendanceRecord) => {
    let inTime = '';
    let outTime = '';
    if (record.check_in) {
      try {
        const d = new Date(record.check_in);
        inTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch {}
    }
    if (record.check_out) {
      try {
        const d = new Date(record.check_out);
        outTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      } catch {}
    }

    setEditingRecord(record);
    setEditForm({
      date: record.date,
      check_in_time: inTime || '09:00',
      check_out_time: outTime || '18:00',
      worked_hours: String(record.worked_hours || '8.00'),
      overtime_hours: String(record.overtime_hours || '0.00'),
      status: record.status || 'Present',
      notes: record.notes || '',
    });
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      const baseDate = editingRecord.date || new Date().toISOString().slice(0, 10);
      let checkInISO: string | null = null;
      let checkOutISO: string | null = null;

      if (editForm.check_in_time) {
        checkInISO = new Date(`${baseDate}T${editForm.check_in_time}:00`).toISOString();
      }
      if (editForm.check_out_time) {
        checkOutISO = new Date(`${baseDate}T${editForm.check_out_time}:00`).toISOString();
      }

      const updated = await apiRequest<AttendanceRecord>(`/api/attendance/${editingRecord.id}`, {
        method: 'PUT',
        body: {
          check_in: checkInISO,
          check_out: checkOutISO,
          worked_hours: +editForm.worked_hours,
          overtime_hours: +editForm.overtime_hours,
          status: editForm.status,
          notes: editForm.notes,
        },
      });

      setEditingRecord(null);
      if (selectedRecord && selectedRecord.id === editingRecord.id) {
        setSelectedRecord({ ...selectedRecord, ...updated });
      }
      fetchData();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance record');
    }
  };

  const handleBulkUpdateStatus = async (newStatus: 'Present' | 'Absent' | 'Late') => {
    if (!selectedLogIds.length) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedLogIds.map((id) =>
          apiRequest(`/api/attendance/${id}`, {
            method: 'PUT',
            body: { status: newStatus },
          })
        )
      );
      setSelectedLogIds([]);
      fetchData();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err: any) {
      alert(err.message || 'Failed to update selected attendance records');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExportSelectedCSV = () => {
    const selectedRecords = filtered.filter((r) => selectedLogIds.includes(String(r.id)));
    if (!selectedRecords.length) return;
    const headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Overtime', 'Status'];
    const rows = selectedRecords.map((r) => [
      `"${r.employee_name || ''}"`,
      `"${r.date || ''}"`,
      `"${r.check_in || ''}"`,
      `"${r.check_out || ''}"`,
      r.worked_hours || 0,
      r.overtime_hours || 0,
      `"${r.status || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_selected_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNewManual = async (e: FormEvent) => {
    e.preventDefault();
    setNewFormError(null);
    setNewSubmitting(true);
    try {
      let checkInISO: string | null = null;
      let checkOutISO: string | null = null;

      if (newFormData.check_in_time) {
        checkInISO = new Date(`${newFormData.date}T${newFormData.check_in_time}:00`).toISOString();
      }
      if (newFormData.check_out_time) {
        checkOutISO = new Date(`${newFormData.date}T${newFormData.check_out_time}:00`).toISOString();
      }

      await apiRequest('/api/attendance', {
        method: 'POST',
        body: {
          employee_id: newFormData.employee_id,
          date: newFormData.date,
          check_in: checkInISO,
          check_out: checkOutISO,
          status: newFormData.status,
          notes: newFormData.notes,
        },
      });

      setShowNewModal(false);
      setNewFormData({
        employee_id: '',
        date: new Date().toISOString().slice(0, 10),
        check_in_time: '09:00',
        check_out_time: '18:00',
        status: 'Present',
        notes: 'Manually logged attendance',
      });
      fetchData();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err: any) {
      setNewFormError(err.message || 'Failed to create attendance log');
    } finally {
      setNewSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = logs.filter((log) => {
    if (filterTodayOnly && log.date !== todayStr) return false;
    if (selectedStatusFilter !== 'All' && log.status !== selectedStatusFilter) return false;
    if (selectedEmpFilter !== 'All' && String(log.employee_id) !== selectedEmpFilter) return false;

    if (search) {
      const term = search.toLowerCase();
      const matchName = log.employee_name?.toLowerCase().includes(term);
      const matchDate = log.date?.includes(term);
      const matchStatus = log.status?.toLowerCase().includes(term);
      if (!matchName && !matchDate && !matchStatus) return false;
    }
    return true;
  });

  if (loading && !logs.length) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '3px solid #E2E8F0',
          borderTopColor: '#1E3A5F',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Loading attendance workspace...</span>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ATTENDANCE RECORD FORM VIEW (Excalidraw Blueprint Screenshot 1)
  // =========================================================================
  if (selectedRecord) {
    const empName = selectedRecord.employee_name ||
      (selectedRecord.employee ? `${selectedRecord.employee.first_name} ${selectedRecord.employee.last_name}` : 'Employee');
    const deptName = selectedRecord.department_name || selectedRecord.employee?.department?.name || 'Finance';
    const managerName = selectedRecord.manager_name ||
      (selectedRecord.employee?.manager ? `${selectedRecord.employee.manager.first_name} ${selectedRecord.employee.manager.last_name}` : 'Sara Khan');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header & Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setSelectedRecord(null)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                color: '#1E3A5F',
                borderColor: '#E2E8F0',
                background: '#FFFFFF',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Attendance List</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Attendance /</span>
                <h2 style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#1E3A5F',
                  margin: 0,
                }}>
                  {empName} / {formatDate(selectedRecord.date)}
                </h2>
                <span className={`badge ${
                  selectedRecord.status === 'Present' ? 'badge-success' :
                  selectedRecord.status === 'Late' ? 'badge-warning' : 'badge-danger'
                }`}>
                  <span className="badge-dot" />
                  {selectedRecord.status}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#64748B', margin: '3px 0 0 0' }}>
                Form view of one attendance record
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isHRManager && (
              <button
                onClick={() => startEdit(selectedRecord)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Edit2 size={15} />
                <span>Edit Record</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Form Card (Excalidraw Screenshot 1 Right Side) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(30, 58, 95, 0.08)',
                color: '#1E3A5F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A5F', margin: 0 }}>
                  Attendance / {empName} / {formatDate(selectedRecord.date)}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Form View of one attendance record
                </span>
              </div>
            </div>

            <span className={`badge ${
              selectedRecord.status === 'Present' ? 'badge-success' :
              selectedRecord.status === 'Late' ? 'badge-warning' : 'badge-danger'
            }`}>
              <span className="badge-dot" />
              {selectedRecord.status}
            </span>
          </div>

          {/* 2-Column Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px 32px',
          }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field 1: Employee */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Employee
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#1E3A5F',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}>
                    {empName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1F2937', fontSize: '0.95rem' }}>{empName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedRecord.employee?.email || 'Corporate Staff'}</div>
                  </div>
                </div>
              </div>

              {/* Field 2: Check In */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Check In
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <Clock size={16} color="#1E3A5F" />
                  <span>{formatFullDateTime(selectedRecord.date, selectedRecord.check_in)}</span>
                </div>
              </div>

              {/* Field 3: Check Out */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Check Out
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: selectedRecord.check_out ? '#1F2937' : '#94A3B8',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                }}>
                  <Clock size={16} color="#64748B" />
                  <span>{selectedRecord.check_out ? formatFullDateTime(selectedRecord.date, selectedRecord.check_out) : '— (Shift Active)'}</span>
                </div>
              </div>

              {/* Field 4: Worked Hours */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Worked Hours
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(46, 125, 91, 0.06)',
                  border: '1px solid rgba(46, 125, 91, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2E7D5B', fontFamily: 'var(--font-mono)' }}>
                    {Number(selectedRecord.worked_hours || 0).toFixed(2)} hrs
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#2E7D5B', fontWeight: 600 }}>
                    Standard Daily: 8.00 hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field 5: Department */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Department
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                }}>
                  <Building2 size={16} color="#1E3A5F" />
                  <span>{deptName}</span>
                </div>
              </div>

              {/* Field 6: Manager */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Manager
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  fontWeight: 600,
                }}>
                  <UserCheck size={16} color="#1E3A5F" />
                  <span>{managerName}</span>
                </div>
              </div>

              {/* Field 7: Status */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Status
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, color: '#1F2937' }}>{selectedRecord.status}</span>
                  <span className={`badge ${
                    selectedRecord.status === 'Present' ? 'badge-success' :
                    selectedRecord.status === 'Late' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    <span className="badge-dot" />
                    {selectedRecord.status}
                  </span>
                </div>
              </div>

              {/* Field 8: Overtime */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                  Overtime
                </label>
                <div style={{
                  padding: '12px 16px',
                  background: selectedRecord.overtime_hours > 0 ? 'rgba(46, 125, 91, 0.06)' : '#F8F9FA',
                  border: `1px solid ${selectedRecord.overtime_hours > 0 ? 'rgba(46, 125, 91, 0.25)' : '#E2E8F0'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: selectedRecord.overtime_hours > 0 ? '#2E7D5B' : '#64748B',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {Number(selectedRecord.overtime_hours || 0).toFixed(2)} hrs
                  </span>
                  <span style={{ fontSize: '0.75rem', color: selectedRecord.overtime_hours > 0 ? '#2E7D5B' : '#64748B', fontWeight: 600 }}>
                    {selectedRecord.overtime_hours > 0 ? 'Approved OT' : 'Regular Shift'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Box (Matching Excalidraw Screenshot 1) */}
          <div style={{
            background: '#F8F9FA',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
              Notes
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#1F2937', margin: 0, lineHeight: 1.5 }}>
              {selectedRecord.notes || 'System-generated from check in/out or manually corrected by an authorized user.'}
            </p>
          </div>

          {/* Useful Note Callout (Matching Excalidraw Screenshot 1) */}
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(30, 58, 95, 0.05)',
            border: '1px solid rgba(30, 58, 95, 0.15)',
            fontSize: '0.825rem',
            color: '#1E3A5F',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            lineHeight: 1.5,
          }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Useful note:</strong> Worked hours and overtime should be easy to read because they directly influence monthly payroll calculation, unpaid leave reductions, and attendance reliability reporting.
            </div>
          </div>
        </div>

        {/* Edit Record Modal */}
        {editingRecord && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '580px' }}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.15rem' }}>Adjust Attendance Record</h3>
                <button
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                  onClick={() => setEditingRecord(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Adjusting record for <strong style={{ color: '#1E3A5F' }}>{editingRecord.employee_name}</strong> on <strong>{formatDate(editingRecord.date)}</strong>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Check-in Time (HH:MM)</label>
                      <input
                        type="time"
                        className="form-control"
                        value={editForm.check_in_time}
                        onChange={(e) => setEditForm({ ...editForm, check_in_time: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Check-out Time (HH:MM)</label>
                      <input
                        type="time"
                        className="form-control"
                        value={editForm.check_out_time}
                        onChange={(e) => setEditForm({ ...editForm, check_out_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Worked Hours</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editForm.worked_hours}
                        onChange={(e) => setEditForm({ ...editForm, worked_hours: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Overtime Hours</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editForm.overtime_hours}
                        onChange={(e) => setEditForm({ ...editForm, overtime_hours: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                        <option value="Overtime">Overtime</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Adjustment Reason / Notes</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Approved manual biometric correction"
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

  // =========================================================================
  // VIEW 1: ATTENDANCE LIST VIEW (Excalidraw Blueprint Screenshot 1)
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Self-Service Punch Card for logged-in employee */}
      {user?.employee_id && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
          padding: '22px 28px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Clock size={20} color="#1E3A5F" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A5F', margin: 0 }}>
                  Self-Service Punch Clock
                </h3>
                <span className={`badge ${myStatus?.checkedIn ? 'badge-success' : 'badge-neutral'}`}>
                  <span className="badge-dot" />
                  {myStatus?.checkedIn ? 'Active Shift' : 'Off Clock'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                {myStatus?.checkedIn && myStatus.record?.check_in
                  ? `Shift began at ${formatTimeOnly(myStatus.record.check_in)} today`
                  : 'You have not checked in for today yet.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {!myStatus?.checkedIn ? (
                <button
                  className="btn btn-primary"
                  disabled={punching}
                  onClick={() => handlePunch('in')}
                  style={{ minWidth: '160px', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Play size={16} />
                  <span>{punching ? 'Recording...' : 'Check In (Punch In)'}</span>
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  disabled={punching}
                  onClick={() => handlePunch('out')}
                  style={{
                    minWidth: '160px',
                    padding: '10px 18px',
                    color: '#B42318',
                    borderColor: 'rgba(180, 35, 24, 0.3)',
                    background: 'rgba(180, 35, 24, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Square size={16} />
                  <span>{punching ? 'Recording...' : 'Check Out (Punch Out)'}</span>
                </button>
              )}
            </div>
          </div>

          {punchMsg && (
            <div style={{
              marginTop: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: punchMsg.type === 'success' ? 'rgba(46, 125, 91, 0.1)' : 'rgba(180, 35, 24, 0.1)',
              border: `1px solid ${punchMsg.type === 'success' ? 'rgba(46, 125, 91, 0.3)' : 'rgba(180, 35, 24, 0.3)'}`,
              color: punchMsg.type === 'success' ? '#2E7D5B' : '#B42318',
              fontSize: '0.85rem',
            }}>
              {punchMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Main Register & Filters (Matching Excalidraw Screenshot 1 Left Side) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
          {/* Action [NEW] Button */}
          {isHRManager && (
            <button
              className="btn btn-primary"
              onClick={() => setShowNewModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <Plus size={16} />
              <span>NEW</span>
            </button>
          )}

          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search attendance..."
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Pills [Today] and [Employee] */}
          <button
            onClick={() => setFilterTodayOnly(!filterTodayOnly)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${filterTodayOnly ? '#1E3A5F' : '#E2E8F0'}`,
              background: filterTodayOnly ? '#1E3A5F' : '#FFFFFF',
              color: filterTodayOnly ? '#FFFFFF' : '#1F2937',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={14} />
            <span>Today</span>
          </button>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={selectedEmpFilter}
            onChange={(e) => setSelectedEmpFilter(e.target.value)}
          >
            <option value="All">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>Employee: {e.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: '140px' }}
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Overtime">Overtime</option>
          </select>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedLogIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: '#1E3A5F',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 14px rgba(30, 58, 95, 0.25)',
          animation: 'fadeIn 0.2s ease',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '24px',
              height: '24px',
              padding: '0 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}>
              {selectedLogIds.length}
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {selectedLogIds.length} employee{selectedLogIds.length === 1 ? '' : 's'} / attendance record{selectedLogIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedLogIds([])}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => setSelectedLogIds(filtered.map((l) => String(l.id)))}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Select All ({filtered.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isHRManager && (
              <>
                <button
                  type="button"
                  disabled={bulkUpdating}
                  onClick={() => handleBulkUpdateStatus('Present')}
                  style={{
                    background: '#2E7D5B',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Present</span>
                </button>

                <button
                  type="button"
                  disabled={bulkUpdating}
                  onClick={() => handleBulkUpdateStatus('Late')}
                  style={{
                    background: '#D97706',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Mark Late
                </button>

                <button
                  type="button"
                  disabled={bulkUpdating}
                  onClick={() => handleBulkUpdateStatus('Absent')}
                  style={{
                    background: '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Mark Absent
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleExportSelectedCSV}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '48px', textAlign: 'center', padding: '12px 8px' }}>
                <input
                  type="checkbox"
                  aria-label="Select all employees"
                  checked={filtered.length > 0 && selectedLogIds.length === filtered.length}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = selectedLogIds.length > 0 && selectedLogIds.length < filtered.length;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLogIds(filtered.map((log) => String(log.id)));
                    } else {
                      setSelectedLogIds([]);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    accentColor: '#1E3A5F',
                    borderRadius: '4px',
                    verticalAlign: 'middle',
                  }}
                  title="Select all employees"
                />
              </th>
              <th>Employee</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Worked Hours</th>
              <th>Overtime</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                  No attendance records found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const isSelected = selectedLogIds.includes(String(log.id));
                return (
                  <tr
                    key={log.id}
                    onClick={() => openRecordDetails(log)}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: isSelected ? 'rgba(30, 58, 95, 0.05)' : undefined,
                    }}
                    title="Click to open attendance details"
                  >
                    <td
                      style={{ width: '48px', textAlign: 'center', padding: '12px 8px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${log.employee_name}`}
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const idStr = String(log.id);
                          if (e.target.checked) {
                            setSelectedLogIds((prev) => [...prev, idStr]);
                          } else {
                            setSelectedLogIds((prev) => prev.filter((id) => id !== idStr));
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          width: '18px',
                          height: '18px',
                          accentColor: '#1E3A5F',
                          borderRadius: '4px',
                          verticalAlign: 'middle',
                        }}
                        title={`Select ${log.employee_name}`}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#1E3A5F' }}>{log.employee_name}</span>
                        <ChevronRight size={14} color="#94A3B8" />
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(log.date)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#1F2937' }}>
                        {formatTimeOnly(log.check_in)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: log.check_out ? '#1F2937' : '#94A3B8' }}>
                        {log.check_out ? formatTimeOnly(log.check_out) : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: log.worked_hours > 0 ? '#1E3A5F' : '#94A3B8' }}>
                        {Number(log.worked_hours || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: log.overtime_hours > 0 ? 700 : 400,
                        color: log.overtime_hours > 0 ? '#2E7D5B' : '#94A3B8',
                      }}>
                        {log.overtime_hours > 0 ? `+${Number(log.overtime_hours).toFixed(2)} hrs` : '0.00'}
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
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRecordDetails(log);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#1E3A5F' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Useful Note Callout on List View (Matching Excalidraw Screenshot 1) */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(30, 58, 95, 0.04)',
        border: '1px solid rgba(30, 58, 95, 0.12)',
        fontSize: '0.8rem',
        color: '#1E3A5F',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Info size={16} color="#1E3A5F" />
        <span>
          <strong>Useful note:</strong> List view helps users review raw check-in / check-out data and identify missing punches quickly. Click any row to inspect or adjust an individual attendance record.
        </span>
      </div>

      {/* Create Attendance Record Modal [NEW] */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Log Employee Attendance</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowNewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewManual}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {newFormError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(180, 35, 24, 0.1)',
                    color: '#B42318',
                    fontSize: '0.825rem',
                  }}>
                    {newFormError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select
                    className="form-control"
                    value={newFormData.employee_id}
                    onChange={(e) => setNewFormData({ ...newFormData, employee_id: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={String(e.id)}>{e.name} ({e.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Attendance Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newFormData.date}
                      onChange={(e) => setNewFormData({ ...newFormData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={newFormData.status}
                      onChange={(e) => setNewFormData({ ...newFormData, status: e.target.value })}
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                      <option value="Overtime">Overtime</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Check-In Time (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newFormData.check_in_time}
                      onChange={(e) => setNewFormData({ ...newFormData, check_in_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check-Out Time (HH:MM)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={newFormData.check_out_time}
                      onChange={(e) => setNewFormData({ ...newFormData, check_out_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Reason / Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Approved manual biometric correction"
                    value={newFormData.notes}
                    onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={newSubmitting}
                >
                  {newSubmitting ? 'Recording...' : 'Create Attendance Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
