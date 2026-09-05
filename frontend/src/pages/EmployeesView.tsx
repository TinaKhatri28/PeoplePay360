import React, { useState, useEffect, FormEvent } from 'react';
import {
  Search,
  Plus,
  Mail,
  Briefcase,
  Building,
  CreditCard,
  Calendar,
  Clock,
  FileText,
  X,
  CheckCircle2,
  LayoutGrid,
  List,
  Coins,
  Download
} from 'lucide-react';
import { apiRequest, downloadPayslipPdf } from '../api';
import { useAuth } from '../context/AuthContext';
import { Employee, Department, WorkingSchedule } from '../types';

export default function EmployeesView() {
  const { isHRManager } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empDetails, setEmpDetails] = useState<{
    full: any;
    contracts: any[];
    attendance: any[];
    timeoff: any[];
    allocations: any[];
    payslips: any[];
  } | null>(null);
  const [detailTab, setDetailTab] = useState('overview');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department_id: '',
    schedule_id: '',
    work_location: 'Mumbai HQ',
    bank_account: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const [empData, deptData, schedData] = await Promise.all([
        apiRequest<Employee[]>(`/api/employees${q}`),
        apiRequest<Department[]>('/api/employees/meta/departments'),
        apiRequest<WorkingSchedule[]>('/api/schedules'),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
      setSchedules(schedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  const openEmployeeDetail = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setDetailTab('overview');
    try {
      const [full, contracts, attendance, timeoff, allocations, payslips] = await Promise.all([
        apiRequest(`/api/employees/${emp.id}`),
        apiRequest(`/api/employees/${emp.id}/contracts`),
        apiRequest(`/api/employees/${emp.id}/attendance`),
        apiRequest(`/api/employees/${emp.id}/time-off`),
        apiRequest(`/api/employees/${emp.id}/allocations`),
        apiRequest(`/api/employees/${emp.id}/payslips`),
      ]);
      setEmpDetails({ full, contracts, attendance, timeoff, allocations, payslips });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiRequest('/api/employees', {
        method: 'POST',
        body: {
          ...formData,
          department_id: formData.department_id ? +formData.department_id : null,
          schedule_id: formData.schedule_id ? +formData.schedule_id : null,
        },
      });
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        department_id: '',
        schedule_id: '',
        work_location: 'Mumbai HQ',
        bank_account: '',
      });
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = employees.filter((e) => {
    if (selectedDept !== 'All' && e.department_name !== selectedDept) return false;
    return true;
  });

  if (loading && !employees.length) {
    return <div style={{ padding: '20px', color: '#64748B' }}>Loading workforce directory...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search employee by name, email, or role..."
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          <div style={{
            display: 'flex',
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '2px',
            border: '1px solid #E2E8F0',
          }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#1E3A5F' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#1E3A5F' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? '#FFFFFF' : '#64748B',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {isHRManager && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid-3">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="card card-interactive"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '14px' }}
              onClick={() => openEmployeeDetail(emp)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  background: '#1E3A5F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: '#FFFFFF',
                }}>
                  {emp.avatar_initials || emp.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emp.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} />
                    <span>{emp.position || 'Employee'}</span>
                  </div>
                </div>
                <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                  <span className="badge-dot" />
                  {emp.status}
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px 12px',
                background: '#F8F9FA',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                border: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                  <Mail size={13} color="#1E3A5F" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                  <Building size={13} color="#3F5F7F" />
                  <span>{emp.department_name || 'Unassigned Department'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                  <CreditCard size={13} color={emp.bank_account ? '#2E7D5B' : '#B7791F'} />
                  <span>{emp.bank_account ? `Bank: ${emp.bank_account}` : 'No bank account linked'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Email & Phone</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#1E3A5F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        color: '#FFFFFF',
                      }}>
                        {emp.avatar_initials || emp.name.slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td>{emp.department_name || '—'}</td>
                  <td>{emp.position || '—'}</td>
                  <td>
                    <div style={{ color: '#1F2937' }}>{emp.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{emp.phone || '—'}</div>
                  </td>
                  <td>{emp.schedule_name || 'Standard'}</td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                      <span className="badge-dot" />
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEmployeeDetail(emp)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>Create Employee Record</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
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

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Maya Patel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="maya@oxp.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Position / Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lead Engineer"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-control"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Working Schedule</label>
                    <select
                      className="form-control"
                      value={formData.schedule_id}
                      onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                    >
                      <option value="">Default (40 Hours / Week)</option>
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.days_per_week} days)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Work Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.work_location}
                      onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bank Account No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="HDFC0001234567"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  background: '#1E3A5F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#FFFFFF',
                }}>
                  {selectedEmployee.avatar_initials || selectedEmployee.name.slice(0, 2)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#1F2937' }}>{selectedEmployee.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {selectedEmployee.position} • {selectedEmployee.department_name || 'General'}
                  </div>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setSelectedEmployee(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '8px 24px',
              borderBottom: '1px solid #E2E8F0',
              background: '#F8F9FA',
            }}>
              {[
                { id: 'overview', label: 'Overview', icon: Briefcase },
                { id: 'contracts', label: `Contracts (${empDetails?.contracts?.length || 0})`, icon: FileText },
                { id: 'attendance', label: `Attendance (${empDetails?.attendance?.length || 0})`, icon: Clock },
                { id: 'timeoff', label: `Time Off (${empDetails?.timeoff?.length || 0})`, icon: Calendar },
                { id: 'allocations', label: 'Leave Quota', icon: CheckCircle2 },
                { id: 'payslips', label: `Payslips (${empDetails?.payslips?.length || 0})`, icon: Coins },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: active ? '#1E3A5F' : 'transparent',
                      color: active ? '#FFFFFF' : '#64748B',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="modal-body">
              {detailTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid-2">
                    <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Email</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>{selectedEmployee.email}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Phone</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>{selectedEmployee.phone || 'None recorded'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Work Location</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1F2937' }}>{selectedEmployee.work_location || 'Headquarters'}</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F8F9FA', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Bank Account</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#1F2937' }}>
                        {selectedEmployee.bank_account || 'Missing — Required for payroll'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'contracts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {empDetails?.contracts?.length === 0 ? (
                    <div style={{ color: '#64748B', textAlign: 'center', padding: '24px' }}>
                      No contracts found for this employee.
                    </div>
                  ) : (
                    empDetails?.contracts?.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: '#F8F9FA',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#1E3A5F' }}>{c.ref}</span>
                            <span className={`badge ${c.status === 'Running' ? 'badge-success' : 'badge-neutral'}`}>
                              {c.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                            Period: {c.start_date} to {c.end_date || 'Present (Open-ended)'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A5F' }}>
                            ₹{c.wage?.toLocaleString('en-IN')} / mo
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'attendance' && (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Worked (h)</th>
                        <th>Overtime (h)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empDetails?.attendance?.map((a) => (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td>{a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td>{a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                          <td>{a.worked_hours}</td>
                          <td>{a.overtime_hours > 0 ? `+${a.overtime_hours}` : '0'}</td>
                          <td>
                            <span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'timeoff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {empDetails?.timeoff?.length === 0 ? (
                    <div style={{ color: '#64748B', textAlign: 'center', padding: '24px' }}>
                      No time-off requests submitted.
                    </div>
                  ) : (
                    empDetails?.timeoff?.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: '#F8F9FA',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>{t.type_name} ({t.duration} days)</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {t.start_date} to {t.end_date} • {t.reason || 'No reason provided'}
                          </div>
                        </div>
                        <span className={`badge ${t.status === 'Approved' ? 'badge-success' : t.status === 'To Approve' ? 'badge-warning' : 'badge-danger'}`}>
                          {t.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === 'allocations' && (
                <div className="grid-2">
                  {empDetails?.allocations?.map((al) => {
                    const remaining = al.allocated - al.taken;
                    return (
                      <div
                        key={al.id}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          background: '#F8F9FA',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: '#1F2937' }}>{al.type_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748B' }}>
                          <span>Allocated: {al.allocated} {al.unit}</span>
                          <span>Taken: {al.taken} {al.unit}</span>
                        </div>
                        <div style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #E2E8F0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Available Balance:</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2E7D5B' }}>
                            {remaining} {al.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {detailTab === 'payslips' && (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Gross Salary</th>
                        <th>Deductions</th>
                        <th>Net Salary</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empDetails?.payslips?.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>Month {p.period_month}/{p.period_year}</td>
                          <td>₹{p.gross?.toLocaleString('en-IN')}</td>
                          <td style={{ color: p.deductions > 0 ? '#B42318' : '#64748B' }}>-₹{p.deductions?.toLocaleString('en-IN')}</td>
                          <td style={{ fontWeight: 700, color: '#2E7D5B' }}>₹{p.net?.toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-neutral'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => downloadPayslipPdf(p.id, `Payslip-${selectedEmployee.name}-${p.period_month}-${p.period_year}.pdf`)}
                            >
                              <Download size={13} />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
