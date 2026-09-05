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
  FileCheck,
  ArrowUpRight,
  ShieldCheck,
  Download
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
  PieChart,
  Pie,
  Cell
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
        <div style={{ color: '#5A6A85', fontWeight: 600 }}>Loading NexaVerse Analytics...</div>
      </div>
    );
  }

  // Formatting helpers
  const totalCost = data?.netSalary || 84250;
  const totalEmployees = data?.payslipCount || 142;
  const attendanceRate = data?.attendanceRate || 98;

  // Pie chart department data
  const pieData = (data?.byDepartment || [
    { name: 'Engineering', total: 42000 },
    { name: 'Product', total: 24000 },
    { name: 'Operations', total: 18000 },
  ]).map(d => ({ name: d.name, value: d.total }));

  const PIE_COLORS = ['#0B132B', '#FFAE19', '#3A4B6E', '#10B981', '#CBD5E1'];

  const trendData = (data?.monthlyTrend && data.monthlyTrend.length > 0)
    ? data.monthlyTrend
    : [
        { label: 'Jan', total: 68000 },
        { label: 'Feb', total: 72000 },
        { label: 'Mar', total: 79000 },
        { label: 'Apr', total: 81000 },
        { label: 'May', total: 84000 },
        { label: 'Jun', total: 87000 },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Filter & Period Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px 22px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E6EC',
        boxShadow: '0 2px 6px rgba(11, 19, 43, 0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 174, 25, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Calendar size={18} color="#FFAE19" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5A6A85', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reporting Period
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <select
                className="form-control"
                style={{ width: '140px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}
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
                style={{ width: '95px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}
                value={year}
                onChange={(e) => setYear(+e.target.value)}
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#5A6A85', fontWeight: 700 }}>Payrun Cycle</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: data?.payrunStatus === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 174, 25, 0.14)',
              color: data?.payrunStatus === 'Paid' ? '#059669' : '#D97706',
              fontSize: '0.78rem',
              fontWeight: 800,
              marginTop: '2px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: data?.payrunStatus === 'Paid' ? '#10B981' : '#FFAE19' }} />
              {data?.payrunStatus || 'Active Cycle'}
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('payroll')}
            style={{ borderRadius: '10px', padding: '8px 16px', fontWeight: 800 }}
          >
            <span>Payroll Studio</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 4 NEXAVERSE KPI METRIC CARDS (Exact Layout & Colors from reference image) ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '18px',
      }}>
        
        {/* CARD 1: Solid Deep Midnight Navy Card (NexaVerse Signature) */}
        <div style={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 20px',
          boxShadow: '0 8px 24px rgba(11, 19, 43, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle Bauhaus circle in background */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 174, 25, 0.12)',
          }} />

          <div>
            <div style={{ fontSize: '0.78rem', color: '#8A99AD', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Current MRR / Total Pay
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              ${(totalCost / 1000).toFixed(1)}k
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
            <span>↑ +12.4%</span>
            <span style={{ color: '#8A99AD', fontWeight: 600 }}>vs previous cycle</span>
          </div>
        </div>

        {/* CARD 2: Solid Vibrant Warm Gold Card (NexaVerse Signature) */}
        <div style={{
          backgroundColor: '#FFAE19',
          color: '#0B132B',
          borderRadius: '16px',
          padding: '24px 20px',
          boxShadow: '0 8px 24px rgba(255, 174, 25, 0.28)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle geometric circle */}
          <div style={{
            position: 'absolute',
            bottom: '-25px',
            right: '-25px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(11, 19, 43, 0.08)',
          }} />

          <div>
            <div style={{ fontSize: '0.78rem', color: '#0B132B', opacity: 0.85, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Active Workforce
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0B132B', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {totalEmployees.toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: '#0B132B', fontWeight: 800 }}>
            <span>✓ 100% verified</span>
            <span style={{ opacity: 0.75 }}>active profiles</span>
          </div>
        </div>

        {/* CARD 3: Clean White Card with crisp border */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 20px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#5A6A85', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Active Attendance Rate
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0B132B', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {attendanceRate}%
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: '#10B981', fontWeight: 800 }}>
            <span>● 4,512 logged</span>
            <span style={{ color: '#5A6A85', fontWeight: 600 }}>on-time shifts</span>
          </div>
        </div>

        {/* CARD 4: Clean White Card with crisp border */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 20px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#5A6A85', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Tax & Audit Score
            </div>
            <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0B132B', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              100%
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.75rem', color: '#FFAE19', fontWeight: 800 }}>
            <span>★ Statutory Ready</span>
            <span style={{ color: '#5A6A85', fontWeight: 600 }}>0 compliance errors</span>
          </div>
        </div>
      </div>

      {/* ─── CHARTS & ANALYTICS SECTION (NexaVerse Style) ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 0.8fr',
        gap: '20px',
      }}>
        
        {/* Trend Bar Chart Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0B132B', margin: 0 }}>
                Disbursement Trend & Monthly Outlay
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#5A6A85', margin: '3px 0 0', fontWeight: 600 }}>
                Historical salary payouts across monthly payrun cycles
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#0B132B' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#0B132B' }} /> Net Pay
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#FFAE19' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#FFAE19' }} /> Allowances
              </span>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F5" />
                <XAxis dataKey="label" tick={{ fill: '#5A6A85', fontSize: 12, fontWeight: 700 }} stroke="#E2E6EC" />
                <YAxis tick={{ fill: '#5A6A85', fontSize: 12 }} stroke="#E2E6EC" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Payout']}
                  contentStyle={{ backgroundColor: '#0B132B', borderRadius: '8px', color: '#FFFFFF', border: 'none', fontWeight: 700 }}
                />
                <Bar dataKey="total" fill="#0B132B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution Card (NexaVerse Style) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0B132B', margin: 0 }}>
              Department Cost Allocation
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#5A6A85', margin: '3px 0 0', fontWeight: 600 }}>
              Share of gross payroll expenses by team
            </p>
          </div>

          <div style={{ height: '170px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0B132B' }}>
                ${Math.round(totalCost / 1000)}k
              </div>
              <div style={{ fontSize: '0.68rem', color: '#5A6A85', fontWeight: 700 }}>Total</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', justifyContent: 'center' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 700, color: '#0B132B' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── LOWER SECTION: RECENT PAYRUNS & SYSTEM AUDIT LOG ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 0.8fr',
        gap: '20px',
      }}>
        {/* Recent Transactions / Payrun Table */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E6EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0B132B', margin: 0 }}>
                Recent Payrun Disbursements
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#5A6A85', margin: '2px 0 0', fontWeight: 600 }}>
                Latest employee salary disbursements and tax batches
              </p>
            </div>
            <button
              onClick={() => onNavigate('payroll')}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFAE19',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E2E6EC', color: '#5A6A85', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Employee</th>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Structure</th>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Net Pay</th>
                <th style={{ padding: '12px 20px', fontWeight: 800 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Arjun Kapoor', role: 'VP Engineering', structure: 'Tier 4 Executive', net: '$8,450.00', status: 'Paid' },
                { name: 'Rohan Mehta', role: 'Lead Architect', structure: 'Tier 3 Senior Tech', net: '$6,200.00', status: 'Paid' },
                { name: 'Eleanor Vance', role: 'Senior Analyst', structure: 'Tier 2 Operations', net: '$4,800.00', status: 'Processing' },
                { name: 'Sophia Chen', role: 'Product Designer', structure: 'Tier 2 Creative', net: '$4,650.00', status: 'Paid' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F0F2F5' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#0B132B' }}>{row.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#5A6A85' }}>{row.role}</div>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#5A6A85', fontWeight: 600 }}>
                    {row.structure}
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 900, color: '#0B132B' }}>
                    {row.net}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      backgroundColor: row.status === 'Paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 174, 25, 0.15)',
                      color: row.status === 'Paid' ? '#059669' : '#D97706',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: row.status === 'Paid' ? '#10B981' : '#FFAE19' }} />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions & System Health */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '22px',
          border: '1px solid #E2E6EC',
          boxShadow: '0 2px 8px rgba(11, 19, 43, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={18} color="#FFAE19" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0B132B', margin: 0 }}>
                Operations Studio Quick Actions
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => onNavigate('attendance')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E2E6EC',
                  color: '#0B132B',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 174, 25, 0.12)';
                  e.currentTarget.style.borderColor = '#FFAE19';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#E2E6EC';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#0B132B" />
                  <span>Verify Shift Attendance</span>
                </div>
                <ChevronRight size={15} color="#5A6A85" />
              </button>

              <button
                onClick={() => onNavigate('employees')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E2E6EC',
                  color: '#0B132B',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 174, 25, 0.12)';
                  e.currentTarget.style.borderColor = '#FFAE19';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#E2E6EC';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="#0B132B" />
                  <span>Onboard New Employee</span>
                </div>
                <ChevronRight size={15} color="#5A6A85" />
              </button>

              <button
                onClick={() => onNavigate('contracts')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E2E6EC',
                  color: '#0B132B',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 174, 25, 0.12)';
                  e.currentTarget.style.borderColor = '#FFAE19';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8F9FA';
                  e.currentTarget.style.borderColor = '#E2E6EC';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={16} color="#0B132B" />
                  <span>Update Contract Rules</span>
                </div>
                <ChevronRight size={15} color="#5A6A85" />
              </button>
            </div>
          </div>

          <div style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: '#0B132B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <ShieldCheck size={20} color="#FFAE19" />
            <div style={{ fontSize: '0.74rem' }}>
              <div style={{ fontWeight: 800, color: '#FFAE19' }}>ISO 27001 & SOC2 Certified</div>
              <div style={{ color: '#8A99AD' }}>Encrypted HR & Payroll Gateway</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
