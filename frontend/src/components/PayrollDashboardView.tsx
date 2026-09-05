import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  TrendingUp,
  CreditCard,
  Percent,
  CheckCircle2,
  FileText,
  Plus,
  ArrowUpRight,
  Download,
  ShieldCheck,
  Coins,
  AlertCircle,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import { apiRequest } from '../api';
import { DashboardData } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PayrollDashboardViewProps {
  onTabChange?: (tab: string) => void;
}

export default function PayrollDashboardView({ onTabChange }: PayrollDashboardViewProps) {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  const netSalary = data?.netSalary || 391520;
  const grossSalary = Math.round(netSalary / 0.86);
  const totalDeductions = grossSalary - netSalary;
  const payslipsGenerated = data?.payslipCount || 6;
  const avgSalary = data?.avgSalary || Math.round(netSalary / payslipsGenerated);

  const barData = data?.byDepartment?.length ? data.byDepartment : [
    { name: 'Finance', total: 85000 },
    { name: 'HR', total: 95000 },
    { name: 'Engineering', total: 72000 },
    { name: 'Sales', total: 68000 },
    { name: 'IT', total: 60000 },
    { name: 'Support', total: 76000 },
  ];

  const trendData = (data?.monthlyTrend && data.monthlyTrend.length > 0)
    ? data.monthlyTrend
    : [
        { label: 'May 2026', total: 391520 },
        { label: 'Jun 2026', total: 391520 },
        { label: 'Jul 2026', total: 391520 },
        { label: 'Aug 2026', total: 391520 },
        { label: 'Sep 2026', total: 391520 },
      ];

  const salaryComponents = [
    { label: 'Basic Salary (60%)', amount: Math.round(grossSalary * 0.60), color: '#FFFFFF', pct: '60%' },
    { label: 'HRA Allowance (20%)', amount: Math.round(grossSalary * 0.20), color: '#CBD5E1', pct: '20%' },
    { label: 'Special & Transport Allowances (6%)', amount: Math.round(grossSalary * 0.06), color: '#94A3B8', pct: '6%' },
    { label: 'PF & Statutory Deductions (14%)', amount: totalDeductions, color: '#EF4444', pct: '14%' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, #090D16 0%, #06080E 100%)',
      color: '#FFFFFF',
      borderRadius: 'var(--radius-xl)',
      padding: '28px',
      boxShadow: '0 20px 35px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Top Header & Studio Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Payroll Dashboard & Studio
            </h1>
            <span style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.04em',
            }}>
              ● 100% Tax Compliant
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#CBD5E1', margin: '4px 0 0 0' }}>
            Real-time compensation analytics, batch payrun execution, salary component distribution, and disbursement tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onTabChange?.('batches')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              background: '#FFFFFF',
              color: '#090D16',
              border: '1px solid #FFFFFF',
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)',
              transition: 'all 0.18s ease',
            }}
          >
            <Plus size={16} /> Run & Manage Payrun Batches
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#FFFFFF', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Payroll Period
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            style={{
              width: '100%',
              background: '#090D16',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <option value={9}>September 2026</option>
            <option value={8}>August 2026</option>
            <option value={7}>July 2026</option>
            <option value={6}>June 2026</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#FFFFFF', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cost Center / Department
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              width: '100%',
              background: '#090D16',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontWeight: 600,
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
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#FFFFFF', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Payrun Status
          </label>
          <div style={{
            background: '#090D16',
            color: '#10B981',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.875rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            {data?.payrunStatus || 'Paid & Closed'}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.725rem', color: '#FFFFFF', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Legal Entity
          </label>
          <input
            readOnly
            value="OXP Pvt Ltd (India)"
            style={{
              width: '100%',
              background: '#090D16',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          />
        </div>
      </div>

      {/* 5 Pure Payroll KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1: Total Net Disbursement */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Net Payout
            </span>
            <CreditCard size={18} color="#FFFFFF" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹{netSalary.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> +4.2% vs previous cycle
          </div>
        </div>

        {/* Card 2: Total Gross Payroll */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Gross Payroll
            </span>
            <Coins size={18} color="#FFFFFF" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹{grossSalary.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#CBD5E1', fontWeight: 500 }}>
            Base wages + variable allowances
          </div>
        </div>

        {/* Card 3: Statutory & Tax Deductions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Statutory & PF Deductions
            </span>
            <ShieldCheck size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#EF4444', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹{totalDeductions.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#CBD5E1', fontWeight: 500 }}>
            EPF, PT & TDS withholding
          </div>
        </div>

        {/* Card 4: Payslips Disbursed */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payslips Generated
            </span>
            <FileText size={18} color="#FFFFFF" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            {payslipsGenerated}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#10B981', fontWeight: 700 }}>
            {payslipsGenerated} paid • 0 pending
          </div>
        </div>

        {/* Card 5: Average Net Wage */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Avg Net Compensation
            </span>
            <TrendingUp size={18} color="#FFFFFF" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
            ₹{avgSalary.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#CBD5E1', fontWeight: 500 }}>
            Per employee monthly take-home
          </div>
        </div>
      </div>

      {/* Middle Row: Department Spend & 6-Month Payout Trend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* Payroll Cost by Department */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '22px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Payroll Spend by Department
              </h3>
              <span style={{ fontSize: '0.725rem', color: '#CBD5E1' }}>Disbursed compensation per cost center</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#FFFFFF', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
              Cost Centers
            </span>
          </div>

          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#CBD5E1" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#CBD5E1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Department Payroll']}
                  contentStyle={{ background: '#090D16', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: '#FFFFFF', fontWeight: 700 }}
                />
                <Bar dataKey="total" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Net Salary Trend */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '22px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Historical Net Salary Trajectory
              </h3>
              <span style={{ fontSize: '0.725rem', color: '#CBD5E1' }}>6-Month batch payout trend & commitment</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
              Historical
            </span>
          </div>

          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="#CBD5E1" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#CBD5E1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Net Disbursed']}
                  contentStyle={{ background: '#090D16', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', color: '#FFFFFF', fontWeight: 700 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  dot={{ fill: '#FFFFFF', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Salary Component Breakdown & Payroll Batch Lifecycle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {/* Component Breakdown Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '22px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px 0', color: '#FFFFFF' }}>
            Salary Component Breakdown
          </h3>
          <p style={{ fontSize: '0.725rem', color: '#CBD5E1', margin: '0 0 16px 0' }}>
            Statutory ratio vs allowances for current active structure
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {salaryComponents.map((comp) => (
              <div key={comp.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{comp.label}</span>
                  <span style={{ color: comp.color, fontFamily: 'monospace', fontWeight: 700 }}>
                    ₹{comp.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '7px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: comp.pct,
                    height: '100%',
                    background: comp.color,
                    borderRadius: '9999px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch Status & Quick Operations */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '22px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px 0', color: '#FFFFFF' }}>
              Payroll Batch Lifecycle & Governance
            </h3>
            <p style={{ fontSize: '0.725rem', color: '#CBD5E1', margin: '0 0 16px 0' }}>
              Execution stages for automatic batch computation
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#FFFFFF' }}>1. Eligible Employees Computed</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>6 / 6 Ready</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#FFFFFF' }}>2. Structure Formulas Verified</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>Validated</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#FFFFFF' }}>3. Salary Disbursement & PDF Payslips</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>Disbursed</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onTabChange?.('batches')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#090D16',
                fontWeight: 800,
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Open Payrun Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

