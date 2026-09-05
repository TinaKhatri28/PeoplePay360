import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  Building2,
  TrendingUp,
  Users,
  CreditCard,
  Percent,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { apiRequest } from '../api';
import { DashboardData } from '../types';

interface PayrollDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function PayrollDashboardView({ onTabChange }: PayrollDashboardViewProps) {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<string>('Payroll');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<DashboardData>(`/api/dashboard?year=${year}&month=${month}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load payroll dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [year, month]);

  const handleSubTabClick = (tabName: string) => {
    setActiveSubTab(tabName);
    if (onTabChange) {
      if (tabName === 'HR') onTabChange('dashboard');
      else if (tabName === 'Employees') onTabChange('employees');
      else if (tabName === 'Attendance') onTabChange('attendance');
      else if (tabName === 'Time Off') onTabChange('timeoff');
      else if (tabName === 'Payroll') onTabChange('payroll');
    }
  };

  // Metric Values
  const netPaidLakhs = data ? (data.netSalary / 100000).toFixed(1) : '18.4';
  const payslipsGenerated = data?.payslipCount || 148;
  const paidCount = data?.paidCount || 142;
  const pendingCount = data?.pendingCount || 6;
  const avgSalary = data?.avgSalary?.toLocaleString('en-IN') || '12,432';
  const approvedLeaveDays = data?.approvedTimeOffDays || 34;
  const attendanceHealth = data?.attendanceHealth || 94;

  const barData = data?.byDepartment?.length ? data.byDepartment : [
    { name: 'HR', total: 110000 },
    { name: 'Sales', total: 150000 },
    { name: 'Support', total: 90000 },
    { name: 'Finance', total: 120000 },
    { name: 'IT', total: 170000 },
  ];

  const maxBar = Math.max(...barData.map(b => b.total), 1);

  const trendPoints = [
    { label: 'Apr', val: 14.2 },
    { label: 'May', val: 15.1 },
    { label: 'Jun', val: 14.8 },
    { label: 'Jul', val: 18.0 },
    { label: 'Aug', val: 16.5 },
    { label: 'Sep', val: 18.4 },
  ];

  return (
    <div style={{
      background: '#111827',
      color: '#F9FAFB',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Sub-Header & Navigation Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['HR', 'Employees', 'Attendance', 'Time Off', 'Payroll'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleSubTabClick(tab)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeSubTab === tab ? '#1E3A5F' : 'transparent',
                color: activeSubTab === tab ? '#FFFFFF' : '#9CA3AF',
                border: activeSubTab === tab ? '1px solid #3B82F6' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onTabChange?.('batches')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} /> Create & Modify Payrun Records
          </button>
          <span style={{ fontSize: '0.75rem', color: '#EF4444', background: 'rgba(239, 68, 68, 0.2)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            ● Manager Live Access
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
          Payroll Dashboard
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', margin: '4px 0 0 0' }}>
          Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        background: '#1F2937',
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
            Period
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            style={{
              width: '100%',
              background: '#111827',
              color: '#F9FAFB',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value={9}>Sep 2026</option>
            <option value={8}>Aug 2026</option>
            <option value={7}>Jul 2026</option>
            <option value={6}>Jun 2026</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
            Department
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              width: '100%',
              background: '#111827',
              color: '#F9FAFB',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
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

        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
            Employee Type
          </label>
          <select
            style={{
              width: '100%',
              background: '#111827',
              color: '#F9FAFB',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="All Types">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contractor">Contractor</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#9CA3AF', marginBottom: '4px', fontWeight: 600 }}>
            Company
          </label>
          <input
            readOnly
            value="OXP Pvt Ltd"
            style={{
              width: '100%',
              background: '#111827',
              color: '#F9FAFB',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {/* Top 5 KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1 */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Total Net Salary Paid</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹ {netPaidLakhs}L
          </div>
          <div style={{ fontSize: '0.725rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> +8.9% vs previous month
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Payslips Generated</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            {payslipsGenerated}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#9CA3AF' }}>
            {paidCount} paid, {pendingCount} pending
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Avg Salary / Employee</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹ {avgSalary}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#9CA3AF' }}>
            Based on current payrun
          </div>
        </div>

        {/* Card 4 */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Approved Time Off Days</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            {approvedLeaveDays} Days
          </div>
          <div style={{ fontSize: '0.725rem', color: '#9CA3AF' }}>
            Across selected period
          </div>
        </div>

        {/* Card 5 */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Attendance Health</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            {attendanceHealth}%
          </div>
          <div style={{ fontSize: '0.725rem', color: '#9CA3AF' }}>
            Present / reviewed records
          </div>
        </div>
      </div>

      {/* Middle Row: Charts & Alerts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Chart 1: Salary Cost by Department */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              Salary Cost by Department
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Source: Payslips + Employee Department</span>
          </div>

          <div style={{
            height: '180px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: '16px',
            marginTop: '20px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            {barData.map((b) => {
              const hPct = maxBar > 0 ? Math.max((b.total / maxBar) * 100, 15) : 15;
              const valK = Math.round(b.total / 1000);
              return (
                <div key={b.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.675rem', color: '#60A5FA', fontFamily: 'monospace', marginBottom: '6px' }}>
                    ₹{valK}k
                  </span>
                  <div
                    style={{
                      width: '80%',
                      maxWidth: '36px',
                      height: `${hPct}%`,
                      background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                      borderRadius: '6px 6px 0 0',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '8px', fontWeight: 600 }}>
                    {b.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Monthly Net Salary Trend */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              Monthly Net Salary Trend
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Source: Historical Payslips / Payruns</span>
          </div>

          <div style={{ height: '180px', marginTop: '20px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <svg style={{ width: '100%', height: '130px', overflow: 'visible' }}>
              <path
                d="M 20 90 Q 60 70, 100 80 T 180 30 T 260 50 T 340 10"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
              />
              <circle cx="340" cy="10" r="5" fill="#60A5FA" />
              <text x="310" y="-5" fill="#60A5FA" fontSize="10" fontWeight="bold">18.4L</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9CA3AF', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
              {trendPoints.map(t => <span key={t.label}>{t.label}</span>)}
            </div>
          </div>
        </div>

        {/* Section 3: Payslip Status & Payroll Alerts */}
        <div style={{
          background: '#1F2937',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              Payslip Status & Payroll Alerts
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Source: Payrun + Payslip validation</span>
          </div>

          {/* Status Split Multi-Color Bar */}
          <div>
            <div style={{ fontSize: '0.725rem', color: '#9CA3AF', marginBottom: '6px' }}>Status split</div>
            <div style={{
              display: 'flex',
              height: '14px',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              background: '#374151',
            }}>
              <div style={{ width: '70%', background: '#10B981' }} title="Paid" />
              <div style={{ width: '15%', background: '#3B82F6' }} title="Done" />
              <div style={{ width: '10%', background: '#F59E0B' }} title="Pending" />
              <div style={{ width: '5%', background: '#EF4444' }} title="Warning" />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>■ Paid</span>
              <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px' }}>■ Done</span>
              <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>■ Pending</span>
              <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>■ Warning</span>
            </div>
          </div>

          {/* Current Alerts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F3F4F6' }}>Current alerts</div>
            <div style={{ fontSize: '0.75rem', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ● 2 employees missing bank account
            </div>
            <div style={{ fontSize: '0.75rem', color: '#FCD34D', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ● 1 duplicate payslip warning
            </div>
            <div style={{ fontSize: '0.75rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ● 4 drafts still not validated
            </div>
            <div style={{ fontSize: '0.75rem', color: '#FDBA74', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ● 3 contracts expiring this month
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Attendance, Time Off, Department & Models to Aggregate */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
      }}>
        {/* Attendance Overview */}
        <div style={{
          background: '#1F2937',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 4px 0', color: '#FFFFFF' }}>Attendance Overview</h3>
          <span style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>Source: Attendance</span>

          <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '12px', margin: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '80px', background: '#3B82F6', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px' }}>Present</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '25px', background: '#F59E0B', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px' }}>Late</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '12px', background: '#EF4444', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px' }}>Absent</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '35px', background: '#10B981', borderRadius: '4px 4px 0 0' }} />
              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: '4px' }}>Overtime</span>
            </div>
          </div>

          <div style={{ fontSize: '0.675rem', color: '#9CA3AF', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Missing checkouts: <strong>5</strong></div>
            <div>Manual attendance edits: <strong>7</strong></div>
            <div>Attendance coverage: <strong style={{ color: '#10B981' }}>94%</strong></div>
          </div>
        </div>

        {/* Time Off Overview */}
        <div style={{
          background: '#1F2937',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 4px 0', color: '#FFFFFF' }}>Time Off Overview</h3>
          <span style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>Source: Time Off Requests + Allocations</span>

          <table style={{ width: '100%', fontSize: '0.725rem', marginTop: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Type</th>
                <th style={{ padding: '6px 0' }}>Approved</th>
                <th style={{ padding: '6px 0' }}>Pending</th>
                <th style={{ padding: '6px 0' }}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>Paid Time Off</td>
                <td>24</td>
                <td>3</td>
                <td>118 Days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>Sick Leave</td>
                <td>6</td>
                <td>1</td>
                <td>N/A</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>Comp Off</td>
                <td>4</td>
                <td>2</td>
                <td>11 Days</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Department Overview */}
        <div style={{
          background: '#1F2937',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 4px 0', color: '#FFFFFF' }}>Department Overview</h3>
          <span style={{ fontSize: '0.675rem', color: '#9CA3AF' }}>Source: Employee + Contract + Payslip totals</span>

          <table style={{ width: '100%', fontSize: '0.725rem', marginTop: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#9CA3AF', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                <th style={{ padding: '6px 0' }}>Department</th>
                <th style={{ padding: '6px 0' }}>Headcount</th>
                <th style={{ padding: '6px 0', textAlign: 'right' }}>Monthly Salary</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>IT</td>
                <td>18</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹ 4.2L</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>Sales</td>
                <td>22</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹ 5.1L</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>HR</td>
                <td>8</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹ 1.9L</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#F3F4F6' }}>Support</td>
                <td>14</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹ 2.7L</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Models to Aggregate */}
        <div style={{
          background: '#1F2937',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 4px 0', color: '#60A5FA' }}>Models to Aggregate</h3>
          <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>This is the actual challenge behind the dashboard</span>

          <ul style={{ fontSize: '0.675rem', color: '#D1D5DB', margin: '10px 0 0 0', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Employees / Departments</strong> → headcount, ownership, grouping</li>
            <li><strong>Contracts</strong> → wage, schedule, active employees</li>
            <li><strong>Payruns / Payslips</strong> → salary totals, paid vs pending, trend data</li>
            <li><strong>Attendance</strong> → presence, absences, late entries, overtime</li>
            <li><strong>Time Off Requests / Allocations</strong> → leave taken and leave balances</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
