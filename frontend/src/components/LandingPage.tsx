import React, { useState, useEffect, FormEvent } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  CreditCard,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Zap,
  Building,
  TrendingUp,
  FileText,
  FileCheck,
  Star,
  Check,
  ChevronLeft
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

interface LandingPageProps {
  onEnterLogin?: () => void;
}

export default function LandingPage({ onEnterLogin }: LandingPageProps): React.JSX.Element {
  const { login } = useAuth();
  const [loginEmail, setLoginEmail] = useState('admin@oxp.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid corporate credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setAuthError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate demo user');
    } finally {
      setSubmitting(false);
    }
  };
  // White, Black & Silver Platinum Palette
  const palette = {
    cream: '#FFFFFF',
    greige: '#F8FAFC',
    rosewood: '#000000',
    rosewoodDark: '#334155',
    rosewoodLight: '#F1F5F9',
    charcoal: '#0A0A0A',
    silver: '#94A3B8',
    silverLight: '#E2E8F0',
    white: '#FFFFFF',
  };

  // Cycling Typewriter text in Hero (HROne signature feature)
  const cyclingPhrases = [
    'Complex HR Ops',
    '1-Click Payroll Runs',
    'Biometric Attendance',
    'Contract Allocations',
    'Tax & Compliance',
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = cyclingPhrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(fullText.substring(0, displayedText.length + 1));
        if (displayedText === fullText) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setDisplayedText(fullText.substring(0, displayedText.length - 1));
        if (displayedText === '') {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % cyclingPhrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex]);

  // Interactive Platform Tabs
  const [activeTab, setActiveTab] = useState<number>(0);
  const platformTabs = [
    {
      id: 0,
      title: 'Workforce',
      icon: <Users size={18} />,
      heading: 'Manage the entire employee lifecycle seamlessly',
      desc: 'From digital onboarding to contract management and offboarding — manage employee data effortlessly in one secure repository.',
      screen: {
        title: 'Employee Directory & Onboarding',
        badge: '42 active onboarding',
        metric1: { label: 'Active Employees', value: '4,601' },
        metric2: { label: 'Retention Rate', value: '98.4%' },
        person: { name: 'Rohan Mehta', role: 'Lead Architect', progress: '85%', tag: 'Day 12' },
        tasks: ['Identity verification complete', 'PF & Tax documents approved', 'Direct bank payout configured'],
      },
    },
    {
      id: 1,
      title: 'Payroll',
      icon: <CreditCard size={18} />,
      heading: 'Automated 1-click payruns with 100% accuracy',
      desc: 'Instant salary calculations incorporating custom allowances, variable performance bonuses, statutory tax brackets, and automated payslip generation.',
      screen: {
        title: 'Payrun Disbursement Engine',
        badge: 'Live Auto-Disbursement',
        metric1: { label: 'Total Net Payout', value: '$248,500' },
        metric2: { label: 'Audit Status', value: '100% Valid' },
        person: { name: 'Eleanor Vance', role: 'Senior Analyst', progress: '100%', tag: 'Paid Out' },
        tasks: ['Gross earnings calculated', 'Tax & PF deductions locked', 'Direct PDF payslips emailed'],
      },
    },
    {
      id: 2,
      title: 'Attendance',
      icon: <Clock size={18} />,
      heading: 'Real-time biometric shift & attendance tracking',
      desc: 'Eliminate buddy punching and time theft with biometric synchronization, geofenced mobile check-ins, automated overtime logging, and penalty formulas.',
      screen: {
        title: 'Live Shift Verification',
        badge: '99.4% On-Time Today',
        metric1: { label: 'Present Today', value: '4,512' },
        metric2: { label: 'Avg Shift Time', value: '8h 24m' },
        person: { name: 'Sophia Chen', role: 'Operations Lead', progress: '94%', tag: 'Checked In' },
        tasks: ['Biometric check-in logged', 'Geofence location verified', 'Shift hours synced to payroll'],
      },
    },
    {
      id: 3,
      title: 'Salary Rules',
      icon: <TrendingUp size={18} />,
      heading: 'Dynamic compensation structures & bonus rules',
      desc: 'Customize salary components, basic pays, HRA, special allowances, medical coverage, and automated deduction formulas per department tier.',
      screen: {
        title: 'Salary Tier Customizer',
        badge: 'Tier 4 Executive Matrix',
        metric1: { label: 'Active Formulas', value: '18 Rules' },
        metric2: { label: 'Tax Accuracy', value: '99.99%' },
        person: { name: 'Arjun Kapoor', role: 'VP Engineering', progress: '100%', tag: 'Tier 4 Rule' },
        tasks: ['Base salary component active', 'Quarterly incentive calculated', 'Statutory compliance passed'],
      },
    },
  ];

  // Testimonials Carousel
  const [testiIndex, setTestiIndex] = useState(0);
  const testimonials = [
    {
      quote:
        'PeoplePay360 cut our monthly payroll cycle from 4 days to less than 15 minutes. The accuracy and biometric attendance sync have completely transformed our operations.',
      name: 'Rajesh Sharma',
      designation: 'Chief Human Resources Officer',
      company: 'OmniTech Global',
      metric: '92% time saved on payroll',
    },
    {
      quote:
        'The cleanest, most intuitive HRMS software we have ever deployed. Our employees love the transparent self-service payslips and attendance history.',
      name: 'Priya Narang',
      designation: 'VP of People Operations',
      company: 'Crestline Logistics',
      metric: '100% error-free compliance',
    },
    {
      quote:
        'Managing salary structures and contractual rules across 1,200+ employees was painful until we adopted PeoplePay360. Truly world-class.',
      name: 'Vikram Malhotra',
      designation: 'Head of Payroll & Compliance',
      company: 'Zenith Retail Brands',
      metric: '1,200+ employees automated',
    },
  ];

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = [
    {
      q: 'How does PeoplePay360 automate payroll calculations and tax deductions?',
      a: 'PeoplePay360 automatically aggregates verified attendance, overtime records, contractual salary tiers, and statutory deduction formulas to compute net pays in real-time. PDF payslips are generated instantly and dispatched to employees upon one-click approval.',
    },
    {
      q: 'Can we manage multiple salary structures and allowances for different employee tiers?',
      a: 'Yes! You can configure unlimited salary structures including basic pay, housing allowances, transport bonuses, performance incentives, and custom deduction formulas tailored to different departments and seniority levels.',
    },
    {
      q: 'Is our corporate data secure and compliant with enterprise standards?',
      a: 'PeoplePay360 utilizes enterprise-grade 256-bit encryption, role-based access governance, and comprehensive audit logs to ensure total confidentiality and regulatory compliance.',
    },
    {
      q: 'How easily can our team transition to PeoplePay360?',
      a: 'Our seamless data onboarding wizard lets you import existing employee profiles, contracts, and salary structures in minutes with zero disruption to active pay cycles.',
    },
  ];

  // Demo Form State
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [companySize, setCompanySize] = useState('51-200');

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterLogin();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: palette.cream,
        color: palette.charcoal,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        fontStyle: 'italic',
        overflowX: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        .marquee-track {
          display: flex;
          gap: 48px;
          width: max-content;
          animation: marquee 24s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${palette.rosewood}15 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ─── NAVIGATION BAR (HROne Style) ─── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: `${palette.cream}F2`,
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${palette.rosewood}20`,
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: palette.rosewood,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${palette.rosewood}35`,
              }}
            >
              <ShieldCheck size={24} color={palette.cream} />
            </div>
            <div>
              <span style={{ fontSize: '1.55rem', fontWeight: 900, color: palette.charcoal, letterSpacing: '-0.03em' }}>
                PeoplePay<span style={{ color: palette.rosewood }}>360</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.62rem', color: palette.rosewood, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
                Enterprise HR & Payroll OS
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>
            <a href="#platform" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
              Platform
            </a>
            <a href="#features" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
              Features
            </a>
            <a href="#metrics" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
              Metrics
            </a>
            <a href="#faq" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
              FAQ
            </a>
          </nav>

          {/* 3D Sign In Button */}
          <button
            onClick={onEnterLogin}
            style={{
              backgroundColor: palette.rosewood,
              color: palette.cream,
              border: `2px solid ${palette.charcoal}`,
              borderRadius: '9px',
              padding: '0.65rem 1.4rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              fontStyle: 'italic',
              cursor: 'pointer',
              boxShadow: `0px 4px 0px ${palette.rosewoodDark}, 0px 6px 12px ${palette.rosewood}35`,
              transform: 'translateY(0)',
              transition: 'all 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0px 6px 0px ${palette.rosewoodDark}, 0px 8px 16px ${palette.rosewood}45`;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = `0px 1px 0px ${palette.rosewoodDark}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0px 4px 0px ${palette.rosewoodDark}, 0px 6px 12px ${palette.rosewood}35`;
            }}
          >
            <span>Sign In to Workspace</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* ─── MAIN HERO SECTION (HROne 2-Column Split: Copy + Direct Interactive Form Card) ─── */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '4.5rem 2rem 3.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
        >
          {/* LEFT: Copy + Cycling Text + Trust Ratings */}
          <div>
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                backgroundColor: `${palette.rosewood}15`,
                border: `1px solid ${palette.rosewood}40`,
                padding: '0.45rem 1.15rem',
                borderRadius: '999px',
                color: palette.rosewood,
                fontSize: '0.8rem',
                fontWeight: 800,
                marginBottom: '1.75rem',
              }}
            >
              <Sparkles size={15} color={palette.rosewood} />
              <span>India's #1 Enterprise HRMS & Payroll OS &nbsp;·&nbsp; 50k+ Employees</span>
            </div>

            {/* Headline with Cycling Typewriter Text */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw, 3.8rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                color: palette.charcoal,
                marginBottom: '1.5rem',
              }}
            >
              The Simplest HR<br />
              Software to Automate<br />
              <span
                style={{
                  color: palette.rosewood,
                  borderBottom: `3px solid ${palette.rosewood}`,
                  display: 'inline-block',
                }}
              >
                {displayedText}
                <span
                  style={{
                    display: 'inline-block',
                    width: '3px',
                    height: '0.9em',
                    backgroundColor: palette.rosewood,
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    animation: 'blink 0.8s infinite',
                  }}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.65,
                color: palette.charcoal,
                opacity: 0.85,
                maxWidth: '540px',
                marginBottom: '1.25rem',
              }}
            >
              From hire to retire — PeoplePay360 delivers seamless payroll automation, biometric attendance verification, flexible salary structures, and instant PDF payslips.
            </p>

            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: palette.rosewood, marginBottom: '2.5rem' }}>
              Built for high-growth enterprises &nbsp;·&nbsp; AI-Powered & 100% Tax Compliant
            </p>

            {/* Trust Ratings (Gartner & G2 style) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.75rem',
                paddingTop: '1.25rem',
                borderTop: `1px solid ${palette.rosewood}25`,
              }}
            >
              {/* Gartner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#002856',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                  }}
                >
                  G
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: palette.charcoal }}>4.9</span>
                    <span style={{ fontSize: '0.75rem', color: palette.rosewood, fontWeight: 700 }}>/5</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800 }}>
                    ★★★★★ <span style={{ color: palette.charcoal, opacity: 0.7 }}>· Gartner 850+ reviews</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '36px', backgroundColor: `${palette.rosewood}30` }} />

              {/* G2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#FF492C',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                  }}
                >
                  G2
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: palette.charcoal }}>4.8</span>
                    <span style={{ fontSize: '0.75rem', color: palette.rosewood, fontWeight: 700 }}>/5</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800 }}>
                    ★★★★★ <span style={{ color: palette.charcoal, opacity: 0.7 }}>· G2 2,400+ reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Direct Embedded Corporate Login Card */}
          <div>
            <div
              style={{
                backgroundColor: palette.white,
                borderRadius: '20px',
                border: `2px solid ${palette.rosewood}40`,
                boxShadow: `0 20px 50px ${palette.charcoal}18`,
                padding: '2.25rem 2rem',
                position: 'relative',
              }}
            >
              {/* Login Header */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={22} color={palette.rosewood} />
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: palette.charcoal, margin: 0 }}>
                    Sign In to Workspace
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: palette.charcoal, opacity: 0.8, margin: 0 }}>
                  Enter your corporate credentials or select a 1-click persona.
                </p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div
                  style={{
                    marginBottom: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(180, 35, 24, 0.08)',
                    border: '1px solid rgba(180, 35, 24, 0.25)',
                    color: '#B42318',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{authError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: palette.charcoal, marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Corporate Work Email *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} color={palette.rosewood} style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', opacity: 0.8 }} />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="admin@oxp.com"
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem 0.7rem 2.4rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${palette.greige}`,
                        backgroundColor: palette.cream,
                        color: palette.charcoal,
                        fontSize: '0.88rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontStyle: 'italic',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 800, color: palette.charcoal, textTransform: 'uppercase', margin: 0 }}>
                      Password *
                    </label>
                    <span style={{ fontSize: '0.72rem', color: palette.rosewood, fontWeight: 700 }}>
                      Demo: admin123
                    </span>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color={palette.rosewood} style={{ position: 'absolute', left: '0.85rem', pointerEvents: 'none', opacity: 0.8 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.7rem 2.4rem 0.7rem 2.4rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${palette.greige}`,
                        backgroundColor: palette.cream,
                        color: palette.charcoal,
                        fontSize: '0.88rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontStyle: 'italic',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: palette.charcoal,
                        opacity: 0.7,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: palette.charcoal, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: palette.rosewood }}
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#2E7D5B', fontWeight: 800 }}>
                    ● 256-bit Secure
                  </span>
                </div>

                {/* 3D Extruded CTA Sign In Button */}
                <div style={{ paddingTop: '0.25rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      backgroundColor: palette.rosewood,
                      color: palette.cream,
                      border: `2px solid ${palette.charcoal}`,
                      borderRadius: '12px',
                      padding: '0.9rem',
                      fontSize: '1rem',
                      fontWeight: 900,
                      fontStyle: 'italic',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      cursor: submitting ? 'wait' : 'pointer',
                      // 3D Shadow
                      boxShadow: `0px 8px 0px ${palette.rosewoodDark}, 0px 10px 0px ${palette.charcoal}, 0px 18px 25px ${palette.rosewood}40`,
                      transform: 'translateY(0)',
                      transition: 'all 0.12s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0px 10px 0px ${palette.rosewoodDark}, 0px 12px 0px ${palette.charcoal}, 0px 22px 30px ${palette.rosewood}55`;
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(6px)';
                      e.currentTarget.style.boxShadow = `0px 2px 0px ${palette.rosewoodDark}, 0px 4px 0px ${palette.charcoal}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0px 8px 0px ${palette.rosewoodDark}, 0px 10px 0px ${palette.charcoal}, 0px 18px 25px ${palette.rosewood}40`;
                    }}
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>

              {/* 1-Click Demo Personas */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${palette.rosewood}25` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: 800, color: palette.rosewood, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                  <Sparkles size={12} color={palette.rosewood} />
                  <span>1-Click Instant Demo Personas</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                  {DEMO_USERS.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleQuickDemoLogin(demo.email, demo.password)}
                      style={{
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: palette.cream,
                        border: `1px solid ${palette.rosewood}30`,
                        color: palette.charcoal,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = palette.rosewood;
                        e.currentTarget.style.color = palette.cream;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = palette.cream;
                        e.currentTarget.style.color = palette.charcoal;
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>{demo.role}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.75 }}>{demo.email}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CLIENT LOGOS MARQUEE STRIP (HROne Style) ─── */}
      <section
        style={{
          backgroundColor: palette.greige,
          borderTop: `1px solid ${palette.rosewood}25`,
          borderBottom: `1px solid ${palette.rosewood}25`,
          padding: '2.5rem 0',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <p style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: palette.rosewood, marginBottom: '1.5rem' }}>
          Trusted by 2,500+ Leading Enterprises Across India & Global Teams
        </p>
        <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div className="marquee-track">
            {[
              'Haier',
              'Nippon Steel',
              'Kyocera',
              'CARS24',
              'Haldiram\'s',
              'Timex',
              'Clarks',
              'Sula Vineyards',
              'The Man Company',
              'Healthians',
              'Magicpin',
              'Vatika',
              // duplicates for seamless loop
              'Haier',
              'Nippon Steel',
              'Kyocera',
              'CARS24',
              'Haldiram\'s',
              'Timex',
              'Clarks',
              'Sula Vineyards',
              'The Man Company',
              'Healthians',
              'Magicpin',
              'Vatika',
            ].map((brand, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: palette.charcoal,
                  opacity: 0.6,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE PLATFORM TABS (HROne Signature Component) ─── */}
      <section id="platform" style={{ padding: '6rem 2rem', maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: palette.rosewood, marginBottom: '0.6rem' }}>
            Unified Architecture
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3rem)', fontWeight: 900, color: palette.charcoal, margin: 0 }}>
            Everything HR. <span style={{ color: palette.rosewood }}>One Platform.</span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: palette.charcoal, opacity: 0.8, maxWidth: '560px', margin: '0.75rem auto 0' }}>
            Every module deeply synchronized in a unified operating system with zero data silos.
          </p>
        </div>

        {/* 3-Column Interactive Layout: Tab List | Real App Browser Preview | Feature Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr 280px',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          {/* LEFT: Tab buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {platformTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: activeTab === tab.id ? palette.rosewood : palette.white,
                  color: activeTab === tab.id ? palette.cream : palette.charcoal,
                  border: activeTab === tab.id ? `2px solid ${palette.charcoal}` : `1px solid ${palette.rosewood}25`,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: activeTab === tab.id ? `0 4px 15px ${palette.rosewood}35` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{tab.title}</span>
              </button>
            ))}
          </div>

          {/* CENTER: Realistic Browser Mockup Frame */}
          <div
            style={{
              backgroundColor: palette.white,
              borderRadius: '20px',
              border: `2px solid ${palette.rosewood}35`,
              boxShadow: `0 20px 50px ${palette.charcoal}20`,
              overflow: 'hidden',
            }}
          >
            {/* Top Browser Bar */}
            <div
              style={{
                backgroundColor: palette.greige,
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderBottom: `1px solid ${palette.rosewood}20`,
              }}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
              <div
                style={{
                  marginLeft: '0.5rem',
                  backgroundColor: palette.white,
                  borderRadius: '6px',
                  padding: '0.2rem 0.8rem',
                  fontSize: '0.72rem',
                  color: palette.charcoal,
                  fontWeight: 700,
                  flex: 1,
                }}
              >
                app.peoplepay360.com/{platformTabs[activeTab].title.toLowerCase()}
              </div>
            </div>

            {/* Simulated Live UI Screen */}
            <div style={{ padding: '1.75rem', backgroundColor: palette.cream }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: palette.charcoal }}>
                  {platformTabs[activeTab].screen.title}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: `${palette.rosewood}18`,
                    color: palette.rosewood,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                  }}
                >
                  {platformTabs[activeTab].screen.badge}
                </span>
              </div>

              {/* Main Card */}
              <div
                style={{
                  backgroundColor: palette.white,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  border: `1px solid ${palette.rosewood}20`,
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: palette.charcoal }}>
                      {platformTabs[activeTab].screen.person.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: palette.rosewood, fontWeight: 700 }}>
                      {platformTabs[activeTab].screen.person.role}
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: '#2E7D5B18',
                      color: '#2E7D5B',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                    }}
                  >
                    {platformTabs[activeTab].screen.person.tag}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                    <span>Processing Completion</span>
                    <span style={{ color: palette.rosewood }}>{platformTabs[activeTab].screen.person.progress}</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', backgroundColor: palette.greige, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: platformTabs[activeTab].screen.person.progress,
                        backgroundColor: palette.rosewood,
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {platformTabs[activeTab].screen.tasks.map((task, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: palette.charcoal }}>
                      <CheckCircle2 size={14} color="#2E7D5B" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ backgroundColor: palette.white, padding: '0.9rem', borderRadius: '10px', border: `1px solid ${palette.rosewood}20` }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: palette.charcoal }}>
                    {platformTabs[activeTab].screen.metric1.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: palette.rosewood, fontWeight: 700 }}>
                    {platformTabs[activeTab].screen.metric1.label}
                  </div>
                </div>
                <div style={{ backgroundColor: palette.white, padding: '0.9rem', borderRadius: '10px', border: `1px solid ${palette.rosewood}20` }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#2E7D5B' }}>
                    {platformTabs[activeTab].screen.metric2.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: palette.rosewood, fontWeight: 700 }}>
                    {platformTabs[activeTab].screen.metric2.label}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Module Information */}
          <div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: palette.charcoal, lineHeight: 1.25, marginBottom: '1rem' }}>
              {platformTabs[activeTab].heading}
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: palette.charcoal, opacity: 0.85, marginBottom: '1.5rem' }}>
              {platformTabs[activeTab].desc}
            </p>
            <button
              onClick={onEnterLogin}
              style={{
                backgroundColor: 'transparent',
                color: palette.rosewood,
                border: `2px solid ${palette.rosewood}`,
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                fontStyle: 'italic',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>Explore {platformTabs[activeTab].title}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── STATS BY THE NUMBERS (HROne 4-Cell Grid) ─── */}
      <section id="metrics" style={{ padding: '3rem 2rem 5rem', maxWidth: '1240px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            backgroundColor: palette.white,
            borderRadius: '20px',
            border: `2px solid ${palette.rosewood}35`,
            overflow: 'hidden',
            boxShadow: `0 15px 40px ${palette.charcoal}12`,
          }}
        >
          {[
            { num: '99.99%', label: 'Payrun Accuracy Rate', sub: 'Zero payroll calculation errors' },
            { num: '10x', label: 'Faster Pay Disbursement', sub: 'Automated 1-click batch runs' },
            { num: '50,000+', label: 'Active Employees Managed', sub: 'Across 2,500+ enterprises' },
            { num: '100%', label: 'Tax & Labor Compliance', sub: 'Fully certified audit protection' },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                borderRight: idx < 3 ? `1px solid ${palette.rosewood}20` : 'none',
              }}
            >
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: palette.rosewood, letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
                {stat.num}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: palette.charcoal, marginBottom: '0.2rem' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: palette.charcoal, opacity: 0.7 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CUSTOMER TESTIMONIAL SLIDER (HROne Style) ─── */}
      <section style={{ backgroundColor: palette.greige, padding: '5.5rem 2rem', borderTop: `1px solid ${palette.rosewood}20`, borderBottom: `1px solid ${palette.rosewood}20` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', marginBottom: '1.25rem', fontSize: '1.2rem' }}>
            ★★★★★
          </div>

          <blockquote style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.85rem)', fontWeight: 800, color: palette.charcoal, lineHeight: 1.45, margin: '0 0 2rem 0' }}>
            "{testimonials[testiIndex].quote}"
          </blockquote>

          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: palette.rosewood }}>
              {testimonials[testiIndex].name}
            </div>
            <div style={{ fontSize: '0.85rem', color: palette.charcoal, opacity: 0.8, marginTop: '0.2rem' }}>
              {testimonials[testiIndex].designation} &nbsp;·&nbsp; <strong>{testimonials[testiIndex].company}</strong>
            </div>
          </div>

          {/* Prev/Next Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={() => setTestiIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: palette.white,
                border: `1.5px solid ${palette.rosewood}35`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: palette.charcoal,
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setTestiIndex((prev) => (prev + 1) % testimonials.length)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: palette.rosewood,
                border: `1.5px solid ${palette.charcoal}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: palette.cream,
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── ACCORDION FAQ SECTION (HROne Style) ─── */}
      <section id="faq" style={{ padding: '6rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: palette.rosewood, marginBottom: '0.5rem' }}>
            Got Questions?
          </p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: palette.charcoal, margin: 0 }}>
            Frequently Asked <span style={{ color: palette.rosewood }}>Questions</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: palette.white,
                borderRadius: '14px',
                border: `1.5px solid ${openFaq === idx ? palette.rosewood : `${palette.rosewood}25`}`,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontStyle: 'italic',
                }}
              >
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: palette.charcoal }}>
                  {faq.q}
                </span>
                <ChevronDown
                  size={20}
                  color={palette.rosewood}
                  style={{
                    transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </button>

              {openFaq === idx && (
                <div style={{ padding: '0 1.5rem 1.35rem', fontSize: '0.92rem', lineHeight: 1.65, color: palette.charcoal, opacity: 0.85 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM 3D CTA BANNER (HROne Style) ─── */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 6rem', padding: '0 2rem' }}>
        <div
          style={{
            backgroundColor: palette.rosewood,
            borderRadius: '24px',
            padding: '4.5rem 2rem',
            textAlign: 'center',
            color: palette.cream,
            border: `3px solid ${palette.charcoal}`,
            boxShadow: `0px 14px 0px ${palette.charcoal}, 0px 25px 50px ${palette.rosewood}50`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Ready to Streamline Your HR & Payroll Operations?
          </h2>
          <p style={{ fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 2.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Join 2,500+ enterprises using PeoplePay360 for accurate, error-free payruns and real-time attendance management.
          </p>

          <button
            onClick={onEnterLogin}
            style={{
              backgroundColor: palette.cream,
              color: palette.rosewood,
              border: `2px solid ${palette.charcoal}`,
              borderRadius: '12px',
              padding: '1.15rem 3rem',
              fontSize: '1.15rem',
              fontWeight: 900,
              fontStyle: 'italic',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              cursor: 'pointer',
              // 3D Shadow
              boxShadow: `0px 8px 0px ${palette.rosewoodDark}, 0px 10px 0px ${palette.charcoal}, 0px 16px 25px rgba(0,0,0,0.4)`,
              transform: 'translateY(0)',
              transition: 'all 0.12s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0px 10px 0px ${palette.rosewoodDark}, 0px 12px 0px ${palette.charcoal}, 0px 20px 30px rgba(0,0,0,0.5)`;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(6px)';
              e.currentTarget.style.boxShadow = `0px 2px 0px ${palette.rosewoodDark}, 0px 4px 0px ${palette.charcoal}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0px 8px 0px ${palette.rosewoodDark}, 0px 10px 0px ${palette.charcoal}, 0px 16px 25px rgba(0,0,0,0.4)`;
            }}
          >
            <span>Proceed to Workspace Sign In</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          borderTop: `1px solid ${palette.rosewood}25`,
          backgroundColor: palette.white,
          padding: '2.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: palette.charcoal,
            opacity: 0.85,
            gap: '1rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} <span style={{ color: palette.rosewood, fontWeight: 900 }}>PeoplePay360 Inc</span>. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 700 }}>
            <span>• White, Black & Silver Edition</span>
            <span>• 3D Interactive UI</span>
            <span>• Italic Typography</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
