import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

interface HeaderProps {
  activeTab: string;
}

export default function Header({ activeTab }: HeaderProps) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState<{ checkedIn: boolean; record: any } | null>(null);

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
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    }}>
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E3A5F' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
          {current.desc}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8F9FA',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid #E2E8F0',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          color: '#1F2937',
          fontWeight: 600,
        }}>
          <Clock size={14} color="#1E3A5F" />
          <span>{time.toLocaleTimeString()}</span>
        </div>

        {user?.employee_id && punchStatus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: punchStatus.checkedIn ? 'rgba(46, 125, 91, 0.1)' : 'rgba(180, 35, 24, 0.08)',
            border: `1px solid ${punchStatus.checkedIn ? 'rgba(46, 125, 91, 0.3)' : 'rgba(180, 35, 24, 0.3)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: punchStatus.checkedIn ? '#2E7D5B' : '#B42318',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: punchStatus.checkedIn ? '#2E7D5B' : '#B42318',
            }} />
            <span>{punchStatus.checkedIn ? 'Clocked In' : 'Clocked Out'}</span>
          </div>
        )}

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
