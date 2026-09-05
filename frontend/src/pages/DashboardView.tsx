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
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api';
import { DashboardData } from '../types';
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
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DashboardData>(`/api/dashboard?year=${year}&month=${month}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [year, month]);

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

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading analytics...</div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="#000000" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Reporting Period:</span>
          <select
            className="form-control"
            style={{ width: '150px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600 }}
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
            style={{ width: '100px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600 }}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Latest Payrun:</span>
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
          gap: '10px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          color: '#DC2626',
          fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
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
