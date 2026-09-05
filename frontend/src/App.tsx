import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';

// Lazy-loaded modules for high performance and code-splitting
const DashboardView = lazy(() => import('./pages/DashboardView'));
const EmployeesView = lazy(() => import('./pages/EmployeesView'));
const ContractsView = lazy(() => import('./pages/ContractsView'));
const AttendanceView = lazy(() => import('./pages/AttendanceView'));
const TimeOffView = lazy(() => import('./pages/TimeOffView'));
const PayrollView = lazy(() => import('./pages/PayrollView'));
const SalaryStructuresView = lazy(() => import('./pages/SalaryStructuresView'));
const UsersView = lazy(() => import('./pages/UsersView'));

function TabLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '350px',
      gap: '10px',
      color: '#64748B',
      fontWeight: 600,
      fontSize: '0.9rem',
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        borderTopColor: '#000000',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span>Loading module...</span>
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        color: '#000000',
        fontFamily: 'var(--font-sans)',
        fontSize: '1.1rem',
        fontWeight: 700,
        gap: '12px',
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '3px solid rgba(0, 0, 0, 0.1)',
          borderTopColor: '#000000',
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
    if (!showLogin) {
      return <LandingPage onEnterLogin={() => setShowLogin(true)} />;
    }
    return <LoginView onBackToLanding={() => setShowLogin(false)} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} />

        <main style={{ flex: 1, padding: '28px 32px 60px', overflowY: 'auto' }}>
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
            {activeTab === 'employees' && <EmployeesView onNavigate={setActiveTab} />}
            {activeTab === 'contracts' && <ContractsView onNavigate={setActiveTab} />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'timeoff' && <TimeOffView />}
            {activeTab === 'payroll' && <PayrollView />}
            {activeTab === 'salary' && <SalaryStructuresView />}
            {activeTab === 'users' && <UsersView />}
          </Suspense>
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

