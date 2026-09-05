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
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout, login } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'timeoff', label: 'Time Off & Leaves', icon: CalendarOff },
    { id: 'payroll', label: 'Payroll Studio', icon: Coins, highlight: true },
    { id: 'salary', label: 'Salary & Schedules', icon: Sliders },
    { id: 'users', label: 'User Governance', icon: UserCheck },
  ];

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
          <div style={{ fontSize: '0.675rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
            ENTERPRISE HR & PAYROLL
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '0.675rem',
          fontWeight: 700,
          color: '#94A3B8',
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
                background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#CBD5E1',
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
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#CBD5E1';
                }
              }}
            >
              <Icon size={18} color={isActive ? '#93C5FD' : 'currentColor'} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#2E7D5B',
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
        padding: '12px 14px',
        margin: '0 12px 12px',
        background: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          fontSize: '0.675rem',
          fontWeight: 700,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <Sparkles size={12} color="#93C5FD" />
          <span>Quick Switch Persona</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {DEMO_USERS.map((demo) => {
            const isCurrent = user?.email === demo.email;
            return (
              <button
                key={demo.email}
                onClick={() => login(demo.email, demo.password)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: isCurrent ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  border: isCurrent ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid transparent',
                  color: isCurrent ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  fontWeight: isCurrent ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                title={`Switch to ${demo.role}`}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {demo.badge}
                </span>
                {isCurrent && <UserCheck size={12} color="#93C5FD" />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#3F5F7F',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
              color: '#94A3B8',
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
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#B42318')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
