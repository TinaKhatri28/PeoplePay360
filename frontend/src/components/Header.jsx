import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

export default function Header({ activeTab }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.employee_id) {
      apiRequest('/api/attendance/me/status')
        .then((data) => setPunchStatus(data))
        .catch(() => setPunchStatus(null));
    }
  }, [user]);

  const titles = {
    dashboard: { title: 'Executive HR Dashboard', desc: 'Real-time overview of workforce, payroll commitments, and attendance' },
    employees: { title: 'Employee Directory', desc: 'Manage workforce profiles, department allocations, and contracts' },
    contracts: { title: 'Employment Contracts', desc: 'Active agreements, wage structures, and automatic expiration enforcement' },
    attendance: { title: 'Attendance & Time Tracker', desc: 'Live punch clock, daily check-ins, worked hours, and manual overrides' },
    timeoff: { title: 'Time Off & Leaves', desc: 'Leave quota allocations, pending approval requests, and policy rules' },
    payroll: { title: 'Payroll Studio', desc: 'Full batch lifecycle: Eligible calculation → Compute → Validate → Mark Paid → PDF Payslips' },
    salary: { title: 'Salary Structures & Schedules', desc: 'Configurable compensation formulas, fixed allowances, and shift hours' },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header style={{
      height: '74px',
      padding: '0 32px',
      background: 'rgba(9, 13, 22, 0.7)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Title & Context */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
          {current.desc}
        </p>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live System Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: '#cbd5e1',
        }}>
          <Clock size={14} color="#818cf8" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {/* Punch In / Out Status */}
        {user?.employee_id && punchStatus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: punchStatus.checkedIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${punchStatus.checkedIn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: punchStatus.checkedIn ? '#34d399' : '#fb7185',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: punchStatus.checkedIn ? '#10b981' : '#f43f5e',
            }} />
            <span>{punchStatus.checkedIn ? 'Clocked In' : 'Clocked Out'}</span>
          </div>
        )}

        {/* Active Role Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#a5b4fc',
        }}>
          <ShieldCheck size={14} color="#818cf8" />
          <span>{user?.roles?.[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
