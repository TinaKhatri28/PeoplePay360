import React, { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    primary: '#000000',
    secondary: '#334155',
    silver: '#94A3B8',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0A0A0A',
    muted: '#64748B',
    success: '#16A34A',
    error: '#DC2626',
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
      {/* Background Ambient Silver Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-8rem',
          left: '-8rem',
          width: '26rem',
          height: '26rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(203, 213, 225, 0.4)',
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
          backgroundColor: 'rgba(0, 0, 0, 0.06)',
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
            fontWeight: 700,
            fontStyle: 'italic',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            zIndex: 20,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(30, 58, 95, 0.05)';
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

        {/* Quick Demo Sign-In Personas */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.675rem', fontWeight: 700, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Quick Persona Sign-In:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setEmail('admin@oxp.com'); setPassword('admin123'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: email === 'admin@oxp.com' ? '1px solid #1E3A5F' : '1px solid #E2E8F0',
                background: email === 'admin@oxp.com' ? 'rgba(30, 58, 95, 0.08)' : '#FFFFFF',
                color: email === 'admin@oxp.com' ? '#1E3A5F' : '#64748B',
                cursor: 'pointer',
              }}
            >
              👑 Admin (Sara)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('smitha5@gmail.com'); setPassword('smitha123'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: email === 'smitha5@gmail.com' ? '1px solid #2E7D5B' : '1px solid #E2E8F0',
                background: email === 'smitha5@gmail.com' ? 'rgba(46, 125, 91, 0.08)' : '#FFFFFF',
                color: email === 'smitha5@gmail.com' ? '#2E7D5B' : '#64748B',
                cursor: 'pointer',
              }}
            >
              💼 Employee (Smitha)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('john@oxp.com'); setPassword('employee123'); }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                border: email === 'john@oxp.com' ? '1px solid #D97706' : '1px solid #E2E8F0',
                background: email === 'john@oxp.com' ? 'rgba(217, 119, 6, 0.08)' : '#FFFFFF',
                color: email === 'john@oxp.com' ? '#D97706' : '#64748B',
                cursor: 'pointer',
              }}
            >
              💼 Employee (John)
            </button>
          </div>
        </div>

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
                onClick={(e) => { e.preventDefault(); alert('Please contact your system administrator or HR department to reset your password.'); }}
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

          {/* 3D Obsidian Black & Silver Button */}
          <div style={{ paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                position: 'relative',
                width: '100%',
                padding: '0.85rem 1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #334155',
                background: `linear-gradient(180deg, #1E293B 0%, #000000 100%)`,
                boxShadow: `
                  inset 0 1px 1px rgba(255, 255, 255, 0.3),
                  inset 0 -2px 4px rgba(0, 0, 0, 0.8),
                  0 10px 20px -5px rgba(0, 0, 0, 0.35),
                  0 4px 6px -2px rgba(0, 0, 0, 0.2)
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