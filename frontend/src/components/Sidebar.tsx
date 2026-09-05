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
    { id: 'dashboard', label: isEmployeeOnly ? 'My Dashboard' : 'Dashboard Overview', icon: LayoutDashboard, allowed: true },
    { id: 'employees', label: 'Employees', icon: Users, allowed: isHRManager || isPayrollStaff },
    { id: 'contracts', label: 'Contracts', icon: FileText, allowed: isHRManager || isPayrollStaff },
    { id: 'attendance', label: isEmployeeOnly ? 'My Attendance' : 'Attendance', icon: Clock, allowed: true },
    { id: 'timeoff', label: isEmployeeOnly ? 'My Leaves & Quotas' : 'Time Off & Leaves', icon: CalendarOff, allowed: true },
    { id: 'payroll', label: isPayrollStaff ? 'Payroll Dashboard' : 'Payroll Studio', icon: Coins, highlight: true, allowed: isHRManager || isPayrollStaff },
    { id: 'salary', label: 'Salary Structures', icon: Sliders, allowed: isHRManager || isPayrollStaff },
    { id: 'users', label: 'User Governance', icon: UserCheck, allowed: isHRManager },
  ];

  const navItems = rawNavItems.filter(item => item.allowed);

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: '#0B132B',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        {/* Geometric Bauhaus Logo Emblem */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FFAE19 0%, #E59C14 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(255, 174, 25, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {/* Geometric Inner Shapes */}
          <div style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#0B132B',
            top: '4px',
            left: '4px',
          }} />
          <div style={{
            position: 'absolute',
            width: '18px',
            height: '18px',
            backgroundColor: '#FFFFFF',
            bottom: '4px',
            right: '4px',
            borderRadius: '0 8px 0 8px',
          }} />
        </div>

        <div>
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            PeoplePay<span style={{ color: '#FFAE19' }}>360</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#8A99AD', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Enterprise HR & Payroll
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '18px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{
          fontSize: '0.675rem',
          fontWeight: 800,
          color: 'rgba(255, 255, 255, 0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '8px 12px 6px',
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
                padding: '11px 14px',
                borderRadius: '10px',
                background: isActive ? '#FFAE19' : 'transparent',
                color: isActive ? '#0B132B' : 'rgba(255, 255, 255, 0.75)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
                boxShadow: isActive ? '0 4px 15px rgba(255, 174, 25, 0.3)' : 'none',
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
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                }
              }}
            >
              <Icon size={18} color={isActive ? '#0B132B' : 'rgba(255, 255, 255, 0.65)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && (
                <span style={{
                  background: isActive ? '#0B132B' : '#10B981',
                  color: isActive ? '#FFAE19' : '#FFFFFF',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                }}>
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#FFAE19',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '0.82rem',
            color: '#0B132B',
            flexShrink: 0,
          }}>
            {user?.employee_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.employee_name || user?.email?.split('@')[0]}
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: '#FFAE19',
              fontWeight: 700,
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
            color: 'rgba(255, 255, 255, 0.45)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFAE19')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
