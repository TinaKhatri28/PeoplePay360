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
  UserCheck,
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: true },
    { id: 'employees', label: 'Employees', icon: Users, allowed: isHRManager || isPayrollStaff },
    { id: 'contracts', label: 'Contracts', icon: FileText, allowed: isHRManager || isPayrollStaff },
    { id: 'attendance', label: 'Attendance', icon: Clock, allowed: true },
    { id: 'timeoff', label: 'Time Off & Leaves', icon: CalendarOff, allowed: true },
    { id: 'payroll', label: 'Payroll Studio', icon: Coins, highlight: true, allowed: isHRManager || isPayrollStaff },
    { id: 'salary', label: 'Salary & Schedules', icon: Sliders, allowed: isHRManager || isPayrollStaff },
    { id: 'users', label: 'User Governance', icon: UserCheck, allowed: isHRManager },
  ];

  const navItems = rawNavItems.filter(item => item.allowed !== false);

  return (
    <aside style={{
      width: '268px',
      minWidth: '268px',
      background: 'linear-gradient(180deg, #090D16 0%, #06080E 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.12)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
      userSelect: 'none',
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '22px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #CBD5E1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#090D16',
          fontWeight: 900,
          fontSize: '1.35rem',
          boxShadow: '0 4px 14px rgba(255, 255, 255, 0.3), inset 0 1px 1px #FFFFFF',
          border: '1px solid #FFFFFF',
          letterSpacing: '-0.03em',
          flexShrink: 0,
        }}>
          P
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '1.18rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: 1.2,
          }}>
            PeoplePay <span style={{ color: '#FFFFFF', fontWeight: 900 }}>360</span>
          </div>
          <div style={{
            fontSize: '0.675rem',
            color: '#FFFFFF',
            fontWeight: 700,
            letterSpacing: '0.08em',
            marginTop: '3px',
            textTransform: 'uppercase',
            opacity: 0.9,
          }}>
            Enterprise HR & Payroll
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '20px 14px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px 10px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 0 8px #FFFFFF',
          }} />
          <span style={{
            fontSize: '0.725rem',
            fontWeight: 800,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Workforce & Operations
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)'
                  : 'transparent',
                color: '#FFFFFF',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                border: isActive
                  ? '1px solid rgba(255, 255, 255, 0.35)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'left',
                width: '100%',
                boxShadow: isActive
                  ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0px)';
                }
              }}
            >
              {/* Active Left Glow Bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '4px',
                  height: '20px',
                  borderRadius: '4px',
                  background: '#FFFFFF',
                  boxShadow: '0 0 12px #FFFFFF',
                }} />
              )}

              <Icon
                size={18}
                color="#FFFFFF"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' : 'none',
                  transition: 'all 0.18s ease',
                  opacity: isActive ? 1 : 0.9,
                }}
              />
              <span style={{ flex: 1, letterSpacing: '-0.01em', color: '#FFFFFF' }}>{item.label}</span>

              {item.highlight && (
                <span style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.45)',
                  letterSpacing: '0.04em',
                }}>
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    display: 'inline-block',
                  }} />
                  LIVE
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Governance / Profile Bottom Section */}
      <div style={{
        padding: '16px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '10px 12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)',
                border: '1.5px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              }}>
                {user?.employee_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              {/* Online Indicator */}
              <span style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #090D16',
                boxShadow: '0 0 6px #10B981',
              }} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em',
              }}>
                {user?.employee_name || user?.email?.split('@')[0] || 'admin'}
              </div>
              <div style={{
                fontSize: '0.675rem',
                color: '#FFFFFF',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '1px',
              }}>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}>
                  {user?.roles?.[0] || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}


