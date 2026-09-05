import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Map, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api';

export default function Header({ activeTab }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState(null);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);

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
    users: { title: 'User & Role Governance', desc: 'Provision user accounts, assign system roles, and audit access permissions' },
  };

  const current = titles[activeTab] || titles.dashboard;

  const blueprintSteps = [
    { num: '1', title: 'Login & Auth', desc: 'JWT + 4 Security Roles (Employee, HR Mgr, Payroll User, Admin)' },
    { num: '2', title: 'Employee Master', desc: 'Master record with linked contracts, attendance, leaves & payslips' },
    { num: '3', title: 'Running Contract', desc: 'Only 1 active running contract per employee (auto-expires older)' },
    { num: '4', title: 'Attendance & Leaves', desc: 'Real-time punch clock, shift hours, overtime & leave allocations' },
    { num: '5', title: 'Salary Rules Engine', desc: 'Basic, HRA 20%, Transport, Overtime formula, Unpaid leave & PF' },
    { num: '6', title: 'Payrun Batching', desc: 'Scope period → Select eligible active contracts → Create Draft' },
    { num: '7', title: 'Compute & Audit', desc: 'Run rule engine → Validate bank/contract flags → Mark Paid' },
    { num: '8', title: 'Payslip & PDF', desc: 'Line-item breakdown + real-time PDF generation & dispatch' },
    { num: '9', title: 'Executive Dashboard', desc: 'Updates net salary cost, attendance rate, leave pool & trend charts' },
  ];

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
      {/* Title & Context */}
      <div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E3A5F' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
          {current.desc}
        </p>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Blueprint Flow Guide Button */}
        <button
          onClick={() => setShowBlueprintModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(30, 58, 95, 0.08)',
            border: '1px solid rgba(30, 58, 95, 0.25)',
            color: '#1E3A5F',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.775rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30, 58, 95, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(30, 58, 95, 0.08)')}
        >
          <Map size={14} color="#1E3A5F" />
          <span>Blueprint Flow</span>
        </button>

        {/* Live System Time */}
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

        {/* Punch In / Out Status */}
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

        {/* Active Role Tag */}
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

      {/* Blueprint Workflow Modal */}
      {showBlueprintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Map size={20} color="#1E3A5F" />
                <h3 style={{ fontSize: '1.2rem', color: '#1F2937' }}>PeoplePay360 Complete Blueprint Architecture</h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                onClick={() => setShowBlueprintModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                This application is engineered according to the official PeoplePay360 modular monolith blueprint.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}>
                {blueprintSteps.map((step) => (
                  <div
                    key={step.num}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#F8F9FA',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#1E3A5F',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {step.num}
                      </span>
                      <strong style={{ fontSize: '0.85rem', color: '#1F2937' }}>{step.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Central Formula Box */}
              <div style={{
                padding: '16px',
                background: 'rgba(30, 58, 95, 0.06)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(30, 58, 95, 0.2)',
                fontSize: '0.825rem',
                color: '#1E3A5F',
              }}>
                <strong>Master Blueprint Chain:</strong>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.775rem',
                  marginTop: '6px',
                  fontWeight: 600,
                }}>
                  Employee (Master Record) ➔ Running Contract ➔ Working Schedule ➔ Attendance & Time Off ➔ Salary Engine ➔ Payrun Batch ➔ Compute ➔ Validate Audit ➔ Payslip PDF ➔ Dashboard
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowBlueprintModal(false)}
              >
                Close Blueprint Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
