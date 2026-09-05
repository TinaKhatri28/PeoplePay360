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
        <div style={{ color: 'var(--text-muted)' }}>Loading analytics...</div>
      </div>
    );
  }

  const maxTrend = data?.monthlyTrend?.length
    ? Math.max(...data.monthlyTrend.map((t) => t.total), 1)
    : 1;

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
        background: 'rgba(19, 26, 43, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={18} color="#818cf8" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Reporting Period:</span>
          <select
            className="form-control"
            style={{ width: '150px', padding: '6px 12px', fontSize: '0.85rem' }}
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
            style={{ width: '100px', padding: '6px 12px', fontSize: '0.85rem' }}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest Payrun:</span>
          <span className={`badge ${
            data?.payrunStatus === 'Paid' ? 'badge-success' :
            data?.payrunStatus === 'Validated' ? 'badge-info' :
            data?.payrunStatus === 'Computed' ? 'badge-warning' : 'badge-neutral'
          }`}>
            <span className="badge-dot" />
            {data?.payrunStatus || 'None'}
          </span>
          <button
            className="btn btn-outline-primary btn-sm"
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
          background: 'rgba(244, 63, 94, 0.15)',
          color: '#fca5a5',
          fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid-4">
        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Net Payroll Cost</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            ₹{data?.netSalary?.toLocaleString('en-IN') || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
            Total net disbursement this cycle
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Covered Employees</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {data?.payslipCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
            Payslips generated in payrun
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Average Net Wage</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            ₹{data?.avgSalary?.toLocaleString('en-IN') || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
            Per employee compensation
          </div>
        </div>

        <div className="card card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Attendance Rate</span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Percent size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {data?.attendanceRate || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '6px' }}>
            Punch reliability across company
          </div>
        </div>
      </div>

      {/* Visual Charts: Trend and Department Distribution */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Monthly Payroll Trend</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                Last 6 months net payout history
              </p>
            </div>
            <span className="badge badge-primary">Historical Data</span>
          </div>

          <div style={{
            height: '220px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {data?.monthlyTrend?.map((item, idx) => {
              const heightPct = maxTrend > 0 ? Math.max((item.total / maxTrend) * 100, 8) : 8;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <div style={{
                    fontSize: '0.675rem',
                    color: 'var(--text-subtle)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.total > 0 ? `₹${(item.total / 1000).toFixed(0)}k` : '₹0'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '42px',
                      height: `${heightPct}%`,
                      background: item.total > 0
                        ? 'linear-gradient(180deg, #6366f1 0%, #312e81 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 0.4s ease',
                      boxShadow: item.total > 0 ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none',
                    }}
                  />
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Cost Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Department Payroll Allocation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
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
              color: 'var(--text-subtle)',
              fontSize: '0.85rem',
            }}>
              No payrun computed for this month yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data?.byDepartment?.map((dept, idx) => {
                const pct = totalDeptCost > 0 ? Math.round((dept.total / totalDeptCost) * 100) : 0;
                const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={dept.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dept.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ₹{dept.total.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
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
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
            Attendance Breakdown ({months.find((m) => m.value === month)?.name} {year})
          </h3>
          <div className="grid-2" style={{ gap: '12px' }}>
            <div style={{
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Present Shifts</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{data?.attendance?.present || 0}</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(244, 63, 94, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600 }}>Absent Days</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{data?.attendance?.absent || 0}</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>Late Arrivals</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{data?.attendance?.late || 0}</div>
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>Overtime Shifts</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{data?.attendance?.overtime || 0}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>
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
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                    {l.approved} approved • {l.pending} to approve
                  </div>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#a5b4fc',
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
