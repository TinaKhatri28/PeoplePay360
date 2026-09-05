import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, X, Play, Square, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

interface HeaderProps {
  activeTab: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState<{
    checkedIn: boolean;
    userName?: string;
    checkInTime?: string | null;
    elapsedMinutes?: number;
    elapsedFormatted?: string;
    todayWorkedHours?: number;
    record?: any;
  } | null>(null);

  const [showWidget, setShowWidget] = useState(false);
  const [punching, setPunching] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const fetchStatus = () => {
    if (user?.employee_id) {
      apiRequest('/api/attendance/me/status')
        .then((data: any) => {
          setPunchStatus(data);
        })
        .catch(() => setPunchStatus(null));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll status every 30s to keep elapsed time accurate
    const interval = setInterval(fetchStatus, 30000);
    const handleUpdated = () => fetchStatus();
    window.addEventListener('attendance-updated', handleUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('attendance-updated', handleUpdated);
    };
  }, [user]);

  const handleQuickPunch = async (action: 'in' | 'out') => {
    setPunching(true);
    setWidgetError(null);
    try {
      if (action === 'in') {
        await apiRequest('/api/attendance/check-in', {
          method: 'POST',
          body: { employee_id: user?.employee_id },
        });
      } else {
        await apiRequest('/api/attendance/check-out', {
          method: 'POST',
          body: { employee_id: user?.employee_id },
        });
      }
      fetchStatus();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err: any) {
      setWidgetError(err.message || 'Action failed');
    } finally {
      setPunching(false);
    }
  };

  const formatPunchTime = (timeStr?: string | null) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  // Calculate live elapsed time
  const getLiveElapsed = () => {
    if (!punchStatus?.checkedIn || !punchStatus.checkInTime) {
      return punchStatus?.elapsedFormatted || '0h00';
    }
    try {
      const diffMs = Date.now() - new Date(punchStatus.checkInTime).getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      const hours = Math.floor(mins / 60);
      const m = mins % 60;
      return `${hours}h${String(m).padStart(2, '0')}`;
    } catch {
      return punchStatus?.elapsedFormatted || '0h00';
    }
  };

  const titles: Record<string, { title: string; desc: string }> = {
    dashboard: { title: 'Executive HR Dashboard', desc: 'Real-time overview of workforce, payroll commitments, and attendance' },
    employees: { title: 'Employee Directory', desc: 'Manage workforce profiles, department allocations, and contracts' },
    contracts: { title: 'Employment Contracts', desc: 'Active agreements, wage structures, and automatic expiration enforcement' },
    attendance: { title: 'Attendance & Time Tracker', desc: 'Live punch clock, daily check-ins, worked hours, and manual overrides' },
    timeoff: { title: 'Time Off & Leaves', desc: 'Leave quota allocations, pending approval requests, and policy rules' },
    payroll: { title: 'Payroll Studio', desc: 'Full batch lifecycle: Eligible calculation → Compute → Validate → Mark Paid → PDF Payslips' },
    salary: { title: 'Salary Structures & Schedules', desc: 'Configurable compensation formulas, fixed allowances, and shift hours' },
    users: { title: 'User & Role Governance', desc: 'Provision user accounts, assign system roles, and audit access permissions' },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header style={{
      height: '74px',
      padding: '0 32px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E6EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: '0 1px 3px rgba(11, 19, 43, 0.03)',
    }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B132B', margin: 0, letterSpacing: '-0.02em' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: '#5A6A85', marginTop: '2px', margin: 0, fontWeight: 600 }}>
          {current.desc}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
        {/* System Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F4F5F7',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid #E2E6EC',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: '#0B132B',
          fontWeight: 700,
        }}>
          <Clock size={14} color="#0B132B" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Interactive Attendance Status Indicator */}
        {user?.employee_id && (
          <div
            onClick={() => setShowWidget(!showWidget)}
            title="Click to open Attendance Widget"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: punchStatus?.checkedIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${punchStatus?.checkedIn ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              fontSize: '0.75rem',
              fontWeight: 800,
              color: punchStatus?.checkedIn ? '#059669' : '#DC2626',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: showWidget ? '0 0 0 2px rgba(11, 19, 43, 0.15)' : 'none',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: punchStatus?.checkedIn ? '#10B981' : '#EF4444',
              boxShadow: punchStatus?.checkedIn ? '0 0 8px #10B981' : 'none',
            }} />
            <span>{punchStatus?.checkedIn ? 'Clocked In' : 'Clocked Out'}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: '2px' }}>▼</span>
          </div>
        )}

        {/* Attendance Widget Popover Modal */}
        {showWidget && (
          <div style={{
            position: 'absolute',
            top: '52px',
            right: '0',
            width: '360px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E6EC',
            boxShadow: '0 20px 35px -5px rgba(11, 19, 43, 0.15)',
            padding: '22px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            {/* Widget Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #F0F2F5',
              paddingBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: punchStatus?.checkedIn ? '#10B981' : '#EF4444',
                }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0B132B' }}>
                  Attendance Widget
                </h4>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#FFAE19',
                  color: '#0B132B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                }}>
                  {((user as any)?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={() => setShowWidget(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Welcome back</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1F2937' }}>
                {(user as any)?.name || user?.email || 'User'}!
              </div>
            </div>

            {widgetError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(180, 35, 24, 0.08)',
                color: '#B42318',
                fontSize: '0.75rem',
              }}>
                {widgetError}
              </div>
            )}

            {/* Time / Duration Rows (Excalidraw Screenshot 2) */}
            <div style={{
              background: '#F8F9FA',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: '#1F2937', fontWeight: 600 }}>
                  {punchStatus?.checkedIn && punchStatus.checkInTime
                    ? `${formatPunchTime(punchStatus.checkInTime)} — Now`
                    : 'Shift not active'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: punchStatus?.checkedIn ? '#2E7D5B' : '#64748B' }}>
                  {getLiveElapsed()}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '8px',
              }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Today</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#1E3A5F' }}>
                  {punchStatus?.checkedIn ? getLiveElapsed() : `${Number(punchStatus?.todayWorkedHours || 0).toFixed(2)}h`}
                </span>
              </div>
            </div>

            {/* Big Action CTA Button */}
            {!punchStatus?.checkedIn ? (
              <button
                onClick={() => handleQuickPunch('in')}
                disabled={punching}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#1E3A5F',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
                  transition: 'background 0.15s ease',
                }}
              >
                <Play size={16} />
                <span>{punching ? 'Recording...' : 'Check In'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleQuickPunch('out')}
                disabled={punching}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#3B82F6',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'background 0.15s ease',
                }}
              >
                <Square size={16} />
                <span>{punching ? 'Recording...' : 'Check Out'}</span>
              </button>
            )}

            {/* Footnote Note (Excalidraw Screenshot 2) */}
            <div style={{
              fontSize: '0.7rem',
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              Employees can mark attendance from the quick widget and review records from the Attendance module.
            </div>
          </div>
        )}

        {/* Role Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(30, 58, 95, 0.08)',
          border: '1px solid rgba(30, 58, 95, 0.2)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#1E3A5F',
        }}>
          <ShieldCheck size={14} color="#1E3A5F" />
          <span>{user?.roles?.[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
