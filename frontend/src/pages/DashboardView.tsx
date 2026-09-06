import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  CreditCard,
  Percent,
  Clock,
  Calendar,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Sliders,
  FileText,
  Download,
  CheckCircle2,
  CalendarOff,
  UserCheck,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest, downloadPayslipPdf } from '../api';
import { useAuth } from '../context/AuthContext';
import { DashboardData, Employee, Contract, WorkingSchedule, SalaryStructure, TimeOffAllocation, AttendanceRecord, Payslip } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, isHRManager, isPayrollUser } = useAuth();
  const isEmployeeOnly = !isHRManager && !isPayrollUser;

  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [department, setDepartment] = useState<string>('All Departments');
  const [status, setStatus] = useState<string>('All Statuses');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Employee-specific state
  const [myEmployeeProfile, setMyEmployeeProfile] = useState<Employee | null>(null);
  const [myContract, setMyContract] = useState<Contract | null>(null);
  const [mySchedule, setMySchedule] = useState<WorkingSchedule | null>(null);
  const [myStructure, setMyStructure] = useState<SalaryStructure | null>(null);
  const [myAllocations, setMyAllocations] = useState<TimeOffAllocation[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [punching, setPunching] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchEmployeeData = async () => {
    const targetEmpId = user?.employee_id || (user as any)?.employeeId;
    if (!targetEmpId) return;
    try {
      const [emp, contracts, schedules, structures, allocs, attLogs, slips, punchStatus] = await Promise.all([
        apiRequest<Employee>(`/api/employees/${targetEmpId}`).catch(() => null),
        apiRequest<Contract[]>(`/api/employees/${targetEmpId}/contracts`).catch(() => []),
        apiRequest<WorkingSchedule[]>('/api/schedules').catch(() => []),
        apiRequest<SalaryStructure[]>('/api/salary/structures').catch(() => []),
        apiRequest<TimeOffAllocation[]>(`/api/employees/${targetEmpId}/allocations`).catch(() => []),
        apiRequest<AttendanceRecord[]>(`/api/employees/${targetEmpId}/attendance`).catch(() => []),
        apiRequest<any[]>(`/api/employees/${targetEmpId}/payslips`).catch(() => []),
        apiRequest<{ checkedIn: boolean }>(`/api/attendance/me/status?employee_id=${targetEmpId}`).catch(() => null),
      ]);

      if (emp) setMyEmployeeProfile(emp);
      if (contracts && contracts.length > 0) {
        const active = contracts.find((c) => c.status === 'Running') || contracts[0];
        setMyContract(active);
        if (active.salary_structure_id && structures) {
          const matchedSt = structures.find((s) => String(s.id) === String(active.salary_structure_id));
          if (matchedSt) setMyStructure(matchedSt);
        }
      }
      if (emp?.schedule_id && schedules) {
        const matchedSch = schedules.find((s) => String(s.id) === String(emp.schedule_id));
        if (matchedSch) setMySchedule(matchedSch);
      }
      if (allocs) setMyAllocations(allocs);
      if (attLogs) setMyAttendance(attLogs);
      if (slips) setMyPayslips(slips);
      if (punchStatus) setCheckedIn(punchStatus.checkedIn);
    } catch (e) {
      console.error('Failed to load employee personal dashboard data:', e);
    }
  };

  const handlePunch = async () => {
    const targetEmpId = user?.employee_id || (user as any)?.employeeId;
    if (!targetEmpId) return;
    setPunching(true);
    try {
      const res = await apiRequest<{ action: 'check_in' | 'check_out' }>('/api/attendance/punch', {
        method: 'POST',
        body: { employee_id: String(targetEmpId) },
      });
      setCheckedIn(res.action === 'check_in');
      await fetchEmployeeData();
    } catch (err: any) {
      alert(err.message || 'Punch operation failed');
    } finally {
      setPunching(false);
    }
  };

  const handleDownloadSlip = async (slipId: string | number, periodMonth?: number, periodYear?: number) => {
    try {
      const filename = `Payslip-${user?.employee_name?.replace(/\s/g, '_') || 'Employee'}-${periodMonth || month}-${periodYear || year}.pdf`;
      await downloadPayslipPdf(slipId, filename);
    } catch (err: any) {
      alert(err.message || 'Failed to download payslip PDF');
    }
  };

  const fetchHRDashboard = async (isRetry = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        department: department,
        status: status,
      });
      const res = await apiRequest<DashboardData>(`/api/dashboard?${params.toString()}`);
      setData(res);
    } catch (err: any) {
      if (!isRetry) {
        setTimeout(() => fetchHRDashboard(true), 1800);
      } else {
        setError(err.message || 'Failed to load executive dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHRManager || isPayrollUser) {
      fetchHRDashboard();
    } else {
      setLoading(false);
    }
  }, [year, month, department, status, isHRManager, isPayrollUser]);

  useEffect(() => {
    fetchEmployeeData();
  }, [user]);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  // ==========================================
  // 1. REGULAR EMPLOYEE SELF-SERVICE DASHBOARD
  // ==========================================
  if (isEmployeeOnly) {
    const wage = Number(myContract?.wage || myEmployeeProfile?.contract?.wage || 30000);
    const totalAllocated = myAllocations.reduce((acc, a) => acc + (Number(a.allocated) || 0), 0);
    const totalTaken = myAllocations.reduce((acc, a) => acc + (Number(a.taken) || 0), 0);
    const totalRemaining = totalAllocated > 0 ? totalAllocated - totalTaken : 18;
    const presentCount = myAttendance.filter((a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Overtime').length;
    const attendanceRate = myAttendance.length > 0 ? Math.min(100, Math.round((presentCount / myAttendance.length) * 100)) : 100;
    const weeklyHours = mySchedule?.weekly_hours || mySchedule?.total_hours || 40;
    const daysPerWeek = mySchedule?.days_per_week || 5;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Employee Welcome & Quick Punch Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #090D16 0%, #111827 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
              color: '#090D16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {user?.employee_name ? user.employee_name.slice(0, 2).toUpperCase() : 'EM'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                  Welcome, {user?.employee_name || 'Employee'}
                </h2>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}>
                  {myEmployeeProfile?.position || myEmployeeProfile?.department_name || 'Team Member'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '3px', margin: 0 }}>
                Personal Employee Portal • Manage your salary, working shifts, leaves, and digital payslips
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: checkedIn ? '#22C55E' : '#EF4444',
                boxShadow: checkedIn ? '0 0 8px #22C55E' : '0 0 8px #EF4444',
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>
                {checkedIn ? 'Clocked In' : 'Clocked Out'}
              </span>
            </div>

            <button
              type="button"
              className={checkedIn ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'}
              onClick={handlePunch}
              disabled={punching}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', padding: '8px 14px' }}
            >
              <Clock size={14} />
              <span>{punching ? 'Updating...' : checkedIn ? 'Clock Out Shift' : 'Clock In Shift'}</span>
            </button>
          </div>
        </div>

        {/* 4 Personal Metric Cards */}
        <div className="grid-4">
          {/* 1. Monthly Take-Home Wage */}
          <div className="card card-interactive">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                My Monthly Wage
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: '#000000',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CreditCard size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', fontFamily: 'var(--font-mono)' }}>
              ₹{wage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} />
              <span>Active Contract ({myContract?.ref || 'Running'})</span>
            </div>
          </div>

          {/* 2. My Leave Balance */}
          <div className="card card-interactive">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Leave Balance
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CalendarOff size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#16A34A', letterSpacing: '-0.03em' }}>
              {totalRemaining} <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 500 }}>days rem</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
              {totalTaken} days used of {totalAllocated || 20} allocated
            </div>
          </div>

          {/* 3. My Attendance Health */}
          <div className="card card-interactive">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Attendance Rate
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: '#000000',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Percent size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              {attendanceRate}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
              {presentCount} shifts logged present
            </div>
          </div>

          {/* 4. My Work Schedule */}
          <div className="card card-interactive">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Shift
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
              {weeklyHours}h <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontWeight: 500 }}>/ week</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
              {daysPerWeek} Working Days (Mon - Fri)
            </div>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid-2">
          {/* Left: My Compensation & Working Schedule Details */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>My Salary & Schedule Terms</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Assigned salary structure, allowances, deductions, and shift timetable
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Contract & Structure Info */}
              <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>SALARY STRUCTURE</span>
                  <span className="badge badge-primary">{myStructure?.name || 'Standard Structure'}</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  ₹{wage.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 500 }}>gross base</span>
                </div>
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', fontWeight: 700 }}>
                    Basic Wage (100%)
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', fontWeight: 700 }}>
                    HRA & Transport Allowances
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', fontWeight: 700 }}>
                    PF & Unpaid Leave Deductions
                  </span>
                </div>
              </div>

              {/* Working Schedule Timetable */}
              <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>WORK SHIFT TIMETABLE</span>
                  <span className="badge badge-info">{mySchedule?.name || 'Full-Time Schedule'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Standard Shift:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>09:00 AM – 06:00 PM</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Weekly Hours:</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{weeklyHours} Hours ({daysPerWeek} days)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('timeoff')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CalendarOff size={14} />
                <span>Request Time Off</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate('attendance')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Clock size={14} />
                <span>Attendance Logs</span>
              </button>
            </div>
          </div>

          {/* Right: My Recent Digital Payslips */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>My Digital Payslips</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Official salary slips & PDF download statements
                </p>
              </div>
              <span className="badge badge-primary">{myPayslips.length} Payslips</span>
            </div>

            {myPayslips.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: '#F8FAFC',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FileText size={24} color="#94A3B8" />
                <span style={{ fontSize: '0.85rem' }}>No payslips generated for your profile yet.</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Your payslips will appear here once the monthly payrun is computed.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myPayslips.slice(0, 5).map((slip) => (
                  <div
                    key={slip.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #E2E8F0',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {months.find((m) => m.value === slip.period_month)?.name || 'Cycle'} {slip.period_year || 2026}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Gross: ₹{Number(slip.gross || wage).toLocaleString('en-IN')} • Deductions: -₹{Number(slip.deductions || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Take-Home</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16A34A', fontFamily: 'var(--font-mono)' }}>
                          ₹{Number(slip.net || wage).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadSlip(slip.id, slip.period_month, slip.period_year)}
                        title="Download PDF Payslip"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '0.75rem' }}
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leave Allocations Summary */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                MY LEAVE QUOTA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {myAllocations.map((al) => {
                  const rem = Number(al.allocated || 0) - Number(al.taken || 0);
                  return (
                    <div key={al.id} style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-subtle)' }}>{al.type_name}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                        {rem} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>rem</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. EXECUTIVE HR & PAYROLL DASHBOARD
  // ==========================================
  const totalDeptCost = data?.byDepartment?.length
    ? data.byDepartment.reduce((acc, d) => acc + d.total, 0)
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filter and Period Selector Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 24px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <Calendar size={18} color="#000000" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Reporting Period:</span>
          <select
            className="form-control"
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.825rem', fontWeight: 600 }}
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            className="form-control"
            style={{ width: '90px', padding: '6px 10px', fontSize: '0.825rem', fontWeight: 600 }}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginLeft: '6px' }}>Department:</span>
          <select
            className="form-control"
            style={{ width: '160px', padding: '6px 10px', fontSize: '0.825rem', fontWeight: 600 }}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="All Departments">All Departments</option>
            <option value="Finance">Finance</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="IT">IT</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payrun Status:</span>
          <span className={`badge ${
            data?.payrunStatus === 'Paid' ? 'badge-success' :
            data?.payrunStatus === 'Validated' ? 'badge-info' :
            data?.payrunStatus === 'Computed' ? 'badge-warning' : 'badge-neutral'
          }`}>
            <span className="badge-dot" />
            {data?.payrunStatus || 'None'}
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('payroll')}
          >
            <span>Open Studio</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          color: '#DC2626',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchHRDashboard()}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid-4">
        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Net Payroll Cost
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#000000',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            ₹{data?.netSalary?.toLocaleString('en-IN') || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
            Total net disbursement this cycle
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Covered Employees
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {data?.payslipCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
            Payslips generated in payrun
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Net Wage
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#000000',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            ₹{data?.avgSalary?.toLocaleString('en-IN') || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
            Per employee compensation
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Attendance Rate
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Percent size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {data?.attendanceRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
            Punch reliability across company
          </div>
        </div>
      </div>

      {/* Visual Charts: Trend and Department Distribution */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Monthly Payroll Trend</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Last 6 months net payout history
              </p>
            </div>
            <span className="badge badge-info">Historical Data</span>
          </div>

          <div style={{ height: '220px', width: '100%', paddingTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Net Payout']}
                  contentStyle={{
                    background: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    color: '#0A0A0A',
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="total" fill="#000000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Cost Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Department Payroll Allocation</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Net salary breakdown by team
              </p>
            </div>
            <span className="badge badge-info">Cost Centers</span>
          </div>

          {data?.byDepartment?.length === 0 ? (
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}>
              No payrun computed for this month yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data?.byDepartment?.map((dept, idx) => {
                const pct = totalDeptCost > 0 ? Math.round((dept.total / totalDeptCost) * 100) : 0;
                const colors = ['#000000', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ₹{dept.total.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
            Attendance Breakdown ({months.find((m) => m.value === month)?.name} {year})
          </h3>
          <div className="grid-2" style={{ gap: '12px' }}>
            <div style={{
              padding: '14px',
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>Present Shifts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{data?.attendance?.present || 0}</div>
            </div>

            <div style={{
              padding: '14px',
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>Absent Days</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{data?.attendance?.absent || 0}</div>
            </div>

            <div style={{
              padding: '14px',
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700 }}>Late Arrivals</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{data?.attendance?.late || 0}</div>
            </div>

            <div style={{
              padding: '14px',
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Overtime Shifts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{data?.attendance?.overtime || 0}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '16px' }}>
            Company Leave Pool Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.leave?.map((l) => (
              <div
                key={l.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{l.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {l.approved} approved • {l.pending} to approve
                  </div>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#000000',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {l.remaining} rem
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
