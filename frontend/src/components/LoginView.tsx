import React, { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

interface LoginViewProps {
  onBackToLanding?: () => void;
}

export default function LoginView({ onBackToLanding }: LoginViewProps): React.JSX.Element {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@oxp.com');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const colors = {
    primary: '#0B132B',
    accent: '#FFAE19',
    secondary: '#3A4B6E',
    bg: '#F4F5F7',
    card: '#FFFFFF',
    text: '#0B132B',
    muted: '#5A6A85',
    success: '#10B981',
    error: '#EF4444',
    border: '#E2E6EC',
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid corporate credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Geometric Bauhaus Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-8rem',
          left: '-8rem',
          width: '26rem',
          height: '26rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 174, 25, 0.12)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-8rem',
          right: '-8rem',
          width: '26rem',
          height: '26rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(11, 19, 43, 0.1)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Left Back to Landing Button */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: `1px solid ${colors.border}`,
            color: colors.primary,
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(11, 19, 43, 0.06)',
            zIndex: 20,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 174, 25, 0.15)';
            e.currentTarget.style.transform = 'translateX(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.transform = 'translateX(0px)';
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Landing Page</span>
        </button>
      )}

      {/* Main Login Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          backgroundColor: colors.card,
          borderRadius: '1.25rem',
          border: `1px solid ${colors.border}`,
          padding: '2.5rem 2.25rem',
          boxShadow: '0 20px 40px -15px rgba(11, 19, 43, 0.12)',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: colors.primary,
              boxShadow: '0 8px 18px rgba(11, 19, 43, 0.25)',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={28} color={colors.accent} />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: colors.primary,
              margin: 0,
              letterSpacing: '-0.03em',
            }}
          >
            PeoplePay<span style={{ color: colors.accent }}>360</span>
          </h1>
          <p style={{ fontSize: '0.82rem', color: colors.muted, marginTop: '0.35rem', margin: 0, fontWeight: 600 }}>
            Enterprise HRMS & Payroll Automation OS
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: colors.error,
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: colors.text,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.4rem',
              }}
            >
              Corporate Work Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={18}
                color={colors.muted}
                style={{ position: 'absolute', left: '0.875rem', pointerEvents: 'none' }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@oxp.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.875rem 0.75rem 2.6rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  fontSize: '0.875rem',
                  color: colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Password
              </label>
              <span style={{ fontSize: '0.74rem', color: colors.accent, fontWeight: 700 }}>
                Demo: admin123
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={18}
                color={colors.muted}
                style={{ position: 'absolute', left: '0.875rem', pointerEvents: 'none' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                  borderRadius: '0.75rem',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.bg,
                  fontSize: '0.875rem',
                  color: colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: colors.primary }}
              />
              <label htmlFor="remember" style={{ fontSize: '0.78rem', color: colors.muted, cursor: 'pointer', fontWeight: 600 }}>
                Keep me signed in
              </label>
            </div>
            <span style={{ fontSize: '0.72rem', color: colors.success, fontWeight: 800 }}>
              ● Encrypted
            </span>
          </div>

          {/* 3D Extruded Button */}
          <div style={{ paddingTop: '0.35rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                position: 'relative',
                width: '100%',
                padding: '0.9rem 1.5rem',
                borderRadius: '0.75rem',
                border: `2px solid ${colors.primary}`,
                background: colors.accent,
                color: colors.primary,
                boxShadow: `0 6px 0 ${colors.primary}, 0 12px 20px rgba(255, 174, 25, 0.35)`,
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: submitting ? 'wait' : 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transform: 'translateY(0)',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 0 ${colors.primary}, 0 16px 24px rgba(255, 174, 25, 0.45)`;
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(4px)';
                e.currentTarget.style.boxShadow = `0 2px 0 ${colors.primary}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 6px 0 ${colors.primary}, 0 12px 20px rgba(255, 174, 25, 0.35)`;
              }}
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </form>

        {/* Demo Quick Logins */}
        <div style={{ marginTop: '1.6rem', paddingTop: '1.25rem', borderTop: `1px solid ${colors.border}` }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: colors.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Sparkles size={13} color={colors.accent} />
            <span>1-Click Instant Demo Personas</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleDemoLogin(demo.email, demo.password)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.backgroundColor = 'rgba(255, 174, 25, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.backgroundColor = colors.bg;
                }}
              >
                <div style={{ fontWeight: 800, color: colors.primary }}>{demo.role}</div>
                <div style={{ fontSize: '0.68rem', color: colors.muted }}>{demo.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.4rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: colors.muted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: colors.success,
                display: 'inline-block',
              }}
            />
            <span>API Gateway Connected</span>
          </div>
          <span>v2.4.0 Engine</span>
        </div>
      </div>
    </div>
  );
}