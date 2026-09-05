import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  CalendarOff,
  Coins,
  Sliders,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('HR Payroll Admin') || userRoles.includes('Admin');
  const isHRManager = isAdmin || userRoles.includes('HR Manager');
  const isPayrollStaff = isAdmin || userRoles.includes('HR Payroll User');
  const isEmployeeOnly = !isHRManager && !isPayrollStaff;

  const rawNavItems = [
    { id: 'dashboard', label: isEmployeeOnly ? 'My Dashboard' : 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users, allowed: isHRManager || isPayrollStaff },
    { id: 'contracts', label: 'Contracts', icon: FileText, allowed: isHRManager || isPayrollStaff },
    { id: 'attendance', label: isEmployeeOnly ? 'My Attendance' : 'Attendance', icon: Clock, allowed: true },
    { id: 'timeoff', label: isEmployeeOnly ? 'My Leaves & Quotas' : 'Time Off & Leaves', icon: CalendarOff, allowed: true },
    { id: 'payroll', label: isPayrollStaff ? 'Payroll Dashboard' : 'Payroll Details', icon: Coins, highlight: true, allowed: isHRManager || isPayrollStaff },
    { id: 'salary', label: 'Salary & Schedules', icon: Sliders, allowed: isHRManager || isPayrollStaff },
    { id: 'users', label: 'User Governance', icon: UserCheck, allowed: isHRManager },
  ];

  const navItems = rawNavItems.filter(item => item.allowed);

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #3F5F7F 0%, #1E3A5F 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '1.25rem',
        }}>
          P
        </div>
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            PeoplePay<span style={{ color: '#93C5FD' }}>360</span>
          </div>
          <div style={{ fontSize: '0.675rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.04em' }}>
            ENTERPRISE HR & PAYROLL
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '0.675rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '8px 12px 4px',
        }}>
          Workforce & Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
          <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              <Icon size={18} color={isActive ? '#93C5FD' : 'rgba(255,255,255,0.6)'} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--color-success)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                }}>
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--color-secondary)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#fff',
            flexShrink: 0,
          }}>
            {user?.employee_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.employee_name || user?.email?.split('@')[0]}
            </div>
            <div style={{
              fontSize: '0.675rem',
              color: 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.roles?.[0] || 'Employee'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFAAAA')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
