import React, { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export default function LoginView(): React.JSX.Element {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@oxp.com');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const colors = {
    primary: '#1E3A5F',
    secondary: '#3F5F7F',
    bg: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1F2937',
    muted: '#64748B',
    success: '#2E7D5B',
    error: '#B42318',
    border: '#E2E8F0',
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
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-8rem',
          left: '-8rem',
          width: '26rem',
          height: '26rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(63, 95, 127, 0.12)',
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
          backgroundColor: 'rgba(30, 58, 95, 0.12)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

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
          boxShadow: '0 20px 40px -15px rgba(30, 58, 95, 0.12)',
          zIndex: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: 'rgba(30, 58, 95, 0.08)',
              border: `1px solid rgba(30, 58, 95, 0.2)`,
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={28} color={colors.primary} />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: colors.primary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            PeoplePay<span style={{ color: colors.secondary }}>360</span>
          </h1>
          <p style={{ fontSize: '0.8125rem', color: colors.muted, marginTop: '0.35rem', margin: 0 }}>
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
              backgroundColor: 'rgba(180, 35, 24, 0.08)',
              border: `1px solid rgba(180, 35, 24, 0.25)`,
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
                fontSize: '0.7rem',
                fontWeight: 700,
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
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => { e.preventDefault(); alert('For demo login, please click one of the quick persona buttons below.'); }}
                style={{
                  fontSize: '0.75rem',
                  color: colors.secondary,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Forgot?
              </a>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: colors.primary }}
            />
            <label htmlFor="remember" style={{ fontSize: '0.78rem', color: colors.muted, cursor: 'pointer' }}>
              Keep me signed in for 24 hours
            </label>
          </div>

          {/* 3D Crystal Deep Navy Button */}
          <div style={{ paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                position: 'relative',
                width: '100%',
                padding: '0.85rem 1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: `linear-gradient(180deg, #3F5F7F 0%, #1E3A5F 100%)`,
                boxShadow: `
                  inset 0 1px 1px rgba(255, 255, 255, 0.7),
                  inset 0 -2px 4px rgba(10, 20, 35, 0.5),
                  0 10px 20px -5px rgba(30, 58, 95, 0.35),
                  0 4px 6px -2px rgba(30, 58, 95, 0.2)
                `,
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0px)')}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
                  pointerEvents: 'none',
                }}
              />
              <span style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)' }}>
                {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Demo Quick Logins */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: `1px solid ${colors.border}` }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: colors.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Sparkles size={13} color={colors.primary} />
            <span>1-Click Demo Personas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleDemoLogin(demo.email, demo.password)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
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
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.backgroundColor = colors.bg;
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: colors.primary }}>{demo.role}</div>
                  <div style={{ fontSize: '0.7rem', color: colors.muted }}>{demo.email}</div>
                </div>
                <UserCheck size={14} color={colors.secondary} />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.5rem',
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
          <span>v2.4.0 TS Engine</span>
        </div>
      </div>
    </div>
  );
}