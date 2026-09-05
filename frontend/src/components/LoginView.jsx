import React, { useState } from 'react';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setLoading(true);
    try {
      await login(demo.email, demo.password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-app)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 'var(--radius-xl)',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #1E3A5F 0%, #3F5F7F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '1.75rem',
          }}>
            P
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.03em' }}>
            PeoplePay<span style={{ color: '#1E3A5F' }}>360</span>
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '6px' }}>
            Enterprise HRMS, Attendance & Automated Payroll
          </p>
        </div>

        {/* Demo Fast Login Section */}
        <div style={{
          background: '#F8F9FA',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#1E3A5F',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Sparkles size={14} color="#1E3A5F" />
            <span>Select Demo Persona for Instant Evaluation</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#1F2937',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1E3A5F';
                  e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.background = '#FFFFFF';
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{demo.role}</div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {demo.email}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1E3A5F',
                }}>
                  <span>Log In</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: '#64748B',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          <span>Or sign in with credentials</span>
          <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(180, 35, 24, 0.08)',
            border: '1px solid rgba(180, 35, 24, 0.25)',
            color: '#B42318',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@oxp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
