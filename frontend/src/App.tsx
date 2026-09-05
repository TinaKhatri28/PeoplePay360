import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './pages/DashboardView';
import EmployeesView from './pages/EmployeesView';
import ContractsView from './pages/ContractsView';
import AttendanceView from './pages/AttendanceView';
import TimeOffView from './pages/TimeOffView';
import PayrollView from './pages/PayrollView';
import SalaryStructuresView from './pages/SalaryStructuresView';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: '#a5b4fc',
        fontFamily: 'var(--font-sans)',
        fontSize: '1.1rem',
        fontWeight: 600,
        gap: '12px',
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Initializing PeoplePay360 Workspace...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} />

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'contracts' && <ContractsView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'timeoff' && <TimeOffView />}
          {activeTab === 'payroll' && <PayrollView />}
          {activeTab === 'salary' && <SalaryStructuresView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
