import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap, Users, Clock, CreditCard, ChevronRight, Award, Lock, Sparkles, CheckCircle2, FileText, TrendingUp, Check } from 'lucide-react';

interface LandingPageProps {
  onEnterLogin: () => void;
}

export default function LandingPage({ onEnterLogin }: LandingPageProps): React.JSX.Element {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Exact Color Palette from design reference:
  // Alabaster Cream: #F1ECE6
  // Warm Greige: #DDD5CD
  // Vintage Rosewood: #7D4047
  // Charcoal Espresso: #2E2E2E

  const palette = {
    cream: '#F1ECE6',
    greige: '#DDD5CD',
    rosewood: '#7D4047',
    rosewoodDark: '#562A30',
    charcoal: '#2E2E2E',
    white: '#FFFFFF',
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
      {/* Floating animation styles */}
      <style>{`
        @keyframes floatSlow1 {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes floatSlow2 {
          0%, 100% { transform: translateY(0px) rotate(4deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes floatSlow3 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(-4deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }
      `}</style>

      {/* Subtle Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(${palette.rosewood}18 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Main Container */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Navigation Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.75rem 0',
            borderBottom: `1px solid ${palette.rosewood}25`,
            backgroundColor: `${palette.cream}CC`,
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: palette.rosewood,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${palette.rosewood}40, inset 0 2px 0 rgba(255,255,255,0.3)`,
              }}
            >
              <ShieldCheck size={26} color={palette.cream} />
            </div>
            <div>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: palette.charcoal, letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                PeoplePay<span style={{ color: palette.rosewood }}>360</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: palette.rosewood, letterSpacing: '0.22em', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 800 }}>
                Enterprise HR & Payroll OS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <a href="#hero" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.92rem', fontWeight: 700, fontStyle: 'italic' }}>
              Home
            </a>
            <a href="#features" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.92rem', fontWeight: 700, fontStyle: 'italic' }}>
              Features
            </a>
            <a href="#metrics" style={{ color: palette.charcoal, textDecoration: 'none', fontSize: '0.92rem', fontWeight: 700, fontStyle: 'italic' }}>
              Metrics
            </a>
          </nav>

          {/* Top 3D Header Sign In Button */}
          <button
            onClick={onEnterLogin}
            style={{
              position: 'relative',
              backgroundColor: palette.rosewood,
              color: palette.cream,
              border: `2px solid ${palette.charcoal}`,
              borderRadius: '10px',
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              fontStyle: 'italic',
              cursor: 'pointer',
              boxShadow: `0px 4px 0px ${palette.rosewoodDark}, 0px 7px 14px ${palette.rosewood}35`,
              transform: 'translateY(0px)',
              transition: 'all 0.12s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0px 6px 0px ${palette.rosewoodDark}, 0px 10px 18px ${palette.rosewood}45`;
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(3px)';
              e.currentTarget.style.boxShadow = `0px 1px 0px ${palette.rosewoodDark}, 0px 3px 6px rgba(0,0,0,0.3)`;
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = `0px 4px 0px ${palette.rosewoodDark}, 0px 7px 14px ${palette.rosewood}35`;
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>
        </header>

        {/* HERO SECTION MATCHING WIREFRAME DIAGRAM */}
        <section id="hero" style={{ padding: '4rem 0 3rem', position: 'relative' }}>
          
          {/* Scattered 6 Floating Images/Cards around Central Title Canvas */}
          <div
            style={{
              position: 'relative',
              minHeight: '480px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            {/* FLOATING IMAGE 1 (Top Left): Attendance Preview Card */}
            <div
              style={{
                position: 'absolute',
                top: '5%',
                left: '0%',
                width: '210px',
                borderRadius: '14px',
                backgroundColor: palette.white,
                border: `2px solid ${palette.rosewood}30`,
                boxShadow: `0 15px 30px ${palette.charcoal}20`,
                padding: '0.6rem',
                animation: 'floatSlow1 6s ease-in-out infinite',
                zIndex: 4,
              }}
            >
              <img
                src="/hero_attendance.jpg"
                alt="Daily Attendance Verification"
                style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '10px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', padding: '0 0.2rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2E7D5B' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: palette.charcoal, fontStyle: 'italic' }}>
                  Biometric Attendance
                </span>
              </div>
            </div>

            {/* FLOATING IMAGE 2 (Top Mid-Left): Live Payrun Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-5%',
                left: '26%',
                borderRadius: '14px',
                backgroundColor: palette.rosewood,
                color: palette.cream,
                border: `2px solid ${palette.charcoal}`,
                boxShadow: `0 12px 25px ${palette.rosewood}50`,
                padding: '0.75rem 1.1rem',
                animation: 'floatSlow2 5.5s ease-in-out infinite',
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <div style={{ backgroundColor: palette.cream, padding: '0.35rem', borderRadius: '8px' }}>
                <CreditCard size={18} color={palette.rosewood} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', opacity: 0.9, textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 700 }}>
                  Payrun Approved
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 900, fontStyle: 'italic' }}>
                  $48,250.00 Disbursed
                </div>
              </div>
            </div>

            {/* FLOATING IMAGE 3 (Top Right): Salary Breakdown Preview Card */}
            <div
              style={{
                position: 'absolute',
                top: '6%',
                right: '0%',
                width: '220px',
                borderRadius: '14px',
                backgroundColor: palette.white,
                border: `2px solid ${palette.rosewood}30`,
                boxShadow: `0 15px 30px ${palette.charcoal}20`,
                padding: '0.6rem',
                animation: 'floatSlow3 7s ease-in-out infinite',
                zIndex: 4,
              }}
            >
              <img
                src="/hero_payroll.jpg"
                alt="Salary Breakdown UI"
                style={{ width: '100%', height: '115px', objectFit: 'cover', borderRadius: '10px' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', padding: '0 0.2rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: palette.rosewood, fontStyle: 'italic' }}>
                  Salary Calculator
                </span>
                <span style={{ fontSize: '0.68rem', backgroundColor: palette.greige, padding: '0.15rem 0.4rem', borderRadius: '6px', fontWeight: 700 }}>
                  Tax Ready
                </span>
              </div>
            </div>

            {/* FLOATING IMAGE 4 (Mid Left): Verified Payslip Badge */}
            <div
              style={{
                position: 'absolute',
                top: '52%',
                left: '2%',
                borderRadius: '14px',
                backgroundColor: palette.greige,
                border: `1px solid ${palette.rosewood}40`,
                boxShadow: `0 10px 20px ${palette.charcoal}15`,
                padding: '0.75rem 1rem',
                animation: 'floatSlow2 6.5s ease-in-out infinite',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <FileText size={20} color={palette.rosewood} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: palette.charcoal, fontStyle: 'italic' }}>
                  PDF Payslips Generated
                </div>
                <div style={{ fontSize: '0.68rem', color: palette.rosewood, fontWeight: 700, fontStyle: 'italic' }}>
                  100% Tax Compliant
                </div>
              </div>
            </div>

            {/* FLOATING IMAGE 5 (Mid Right): Active Employee Badge */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '2%',
                borderRadius: '14px',
                backgroundColor: palette.white,
                border: `2px solid ${palette.rosewood}30`,
                boxShadow: `0 10px 22px ${palette.charcoal}15`,
                padding: '0.75rem 1rem',
                animation: 'floatSlow1 5.8s ease-in-out infinite',
                zIndex: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: palette.rosewood,
                  color: palette.cream,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                }}
              >
                AK
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: palette.charcoal, fontStyle: 'italic' }}>
                  Active Employee Profile
                </div>
                <div style={{ fontSize: '0.68rem', color: '#2E7D5B', fontWeight: 700, fontStyle: 'italic' }}>
                  ✓ Shift Checked In
                </div>
              </div>
            </div>

            {/* FLOATING IMAGE 6 (Bottom Center): Security Stamp Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '-2%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '999px',
                backgroundColor: palette.charcoal,
                color: palette.cream,
                border: `2px solid ${palette.rosewood}`,
                boxShadow: `0 8px 20px ${palette.charcoal}40`,
                padding: '0.45rem 1.25rem',
                animation: 'floatSlow3 6.2s ease-in-out infinite',
                zIndex: 6,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontStyle: 'italic',
              }}
            >
              <CheckCircle2 size={15} color={palette.cream} />
              <span>ROLE-BASED HR SECURITY GOVERNANCE</span>
            </div>

            {/* CENTRAL TITLE BOX (Matching wireframe Title center position) */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                maxWidth: '680px',
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                backgroundColor: `${palette.cream}F0`,
                borderRadius: '24px',
                border: `2px solid ${palette.rosewood}35`,
                boxShadow: `0 20px 50px ${palette.charcoal}20`,
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: `${palette.rosewood}15`,
                  border: `1px solid ${palette.rosewood}40`,
                  padding: '0.35rem 1rem',
                  borderRadius: '999px',
                  color: palette.rosewood,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  marginBottom: '1.25rem',
                }}
              >
                <Sparkles size={14} color={palette.rosewood} />
                <span>INTELLIGENT HR & PAYROLL PLATFORM</span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  color: palette.charcoal,
                  margin: '0 0 1rem 0',
                }}
              >
                Automate Payroll.<br />
                <span style={{ color: palette.rosewood, textShadow: `0 2px 10px ${palette.rosewood}25` }}>
                  Empower Employees.
                </span><br />
                Zero Errors.
              </h1>
            </div>
          </div>

          {/* SUPPORTING TEXT & 3D BUTTON (Matching wireframe supporting text bottom section) */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '3.5rem',
              maxWidth: '750px',
              margin: '3.5rem auto 0',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Supporting Text */}
            <p
              style={{
                fontSize: '1.15rem',
                fontWeight: 500,
                fontStyle: 'italic',
                color: palette.charcoal,
                opacity: 0.88,
                lineHeight: 1.6,
                marginBottom: '2.25rem',
              }}
            >
              Streamline enterprise contract allocations, biometric attendance logging, flexible salary structures, and instant 1-click payslip generation in a unified workspace.
            </p>

            {/* PROMINENT VINTAGE ROSEWOOD 3D BUTTON */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={onEnterLogin}
                style={{
                  position: 'relative',
                  backgroundColor: palette.rosewood,
                  color: palette.cream,
                  border: `3px solid ${palette.charcoal}`,
                  borderRadius: '16px',
                  padding: '1.15rem 3.25rem',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  // Extruded 3D Shadow Layers in Rosewood & Charcoal
                  boxShadow: `
                    0px 10px 0px ${palette.rosewoodDark},
                    0px 12px 0px ${palette.charcoal},
                    0px 20px 35px ${palette.rosewood}50
                  `,
                  transform: 'translateY(0px)',
                  transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `
                    0px 13px 0px ${palette.rosewoodDark},
                    0px 15px 0px ${palette.charcoal},
                    0px 25px 45px ${palette.rosewood}65
                  `;
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(8px)';
                  e.currentTarget.style.boxShadow = `
                    0px 2px 0px ${palette.rosewoodDark},
                    0px 4px 0px ${palette.charcoal},
                    0px 8px 15px rgba(0,0,0,0.5)
                  `;
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = `
                    0px 10px 0px ${palette.rosewoodDark},
                    0px 12px 0px ${palette.charcoal},
                    0px 20px 35px ${palette.rosewood}50
                  `;
                }}
              >
                <span>GET STARTED NOW</span>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: palette.cream,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight size={20} color={palette.rosewood} />
                </div>
              </button>

              <div style={{ fontSize: '0.82rem', color: palette.charcoal, opacity: 0.7, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} color={palette.rosewood} />
                <span>Click the 3D button above to enter the secure login workspace</span>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Bar */}
        <section
          id="metrics"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            padding: '2.25rem',
            backgroundColor: palette.greige,
            borderRadius: '20px',
            border: `2px solid ${palette.rosewood}30`,
            boxShadow: `0 15px 40px ${palette.charcoal}12`,
            margin: '4rem 0 5rem',
          }}
        >
          {[
            { value: '99.99%', label: 'Payrun Accuracy Rate', icon: <CheckCircle2 size={22} color={palette.rosewood} /> },
            { value: '10x', label: 'Faster Payroll Processing', icon: <Zap size={22} color={palette.rosewood} /> },
            { value: '50,000+', label: 'Active Employee Profiles', icon: <Users size={22} color={palette.rosewood} /> },
            { value: '100%', label: 'Compliance & Audit Ready', icon: <Award size={22} color={palette.rosewood} /> },
          ].map((stat, idx) => (
            <div key={idx} style={{ textAlign: 'center', padding: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: palette.rosewood, fontStyle: 'italic', marginBottom: '0.15rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: palette.charcoal, fontWeight: 700, fontStyle: 'italic' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Features Grid */}
        <section id="features" style={{ paddingBottom: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 900, fontStyle: 'italic', color: palette.charcoal, marginBottom: '0.5rem' }}>
              Enterprise <span style={{ color: palette.rosewood }}>HRMS Features</span>
            </h2>
            <p style={{ fontSize: '1rem', color: palette.charcoal, opacity: 0.75, fontStyle: 'italic', maxWidth: '580px', margin: '0 auto' }}>
              Designed to optimize workforce operations, attendance logging, and salary distribution.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {[
              {
                icon: <CreditCard size={28} color={palette.cream} />,
                title: 'Automated Payrun Engine',
                desc: 'Calculate complex base pays, housing bonuses, overtime allowances, and tax brackets with 1-click payslip generation.',
              },
              {
                icon: <Clock size={28} color={palette.cream} />,
                title: 'Real-Time Attendance Verification',
                desc: 'Monitor check-ins, check-outs, break durations, shift hours, and late penalties with biometric tracking logs.',
              },
              {
                icon: <Users size={28} color={palette.cream} />,
                title: 'Contract & Salary Structures',
                desc: 'Flexible salary component rules, employee contract management, and automated deduction formulas.',
              },
              {
                icon: <ShieldCheck size={28} color={palette.cream} />,
                title: 'Role Governance & Audit Trails',
                desc: 'Role-based access permissions for HR Managers, Payroll Staff, and Employees to guarantee total data privacy.',
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: palette.white,
                  border: hoveredCard === idx ? `2px solid ${palette.rosewood}` : `1px solid ${palette.rosewood}25`,
                  borderRadius: '16px',
                  padding: '2rem 1.6rem',
                  transition: 'all 0.25s ease',
                  transform: hoveredCard === idx ? 'translateY(-5px)' : 'translateY(0px)',
                  boxShadow: hoveredCard === idx ? `0 15px 30px ${palette.rosewood}20` : `0 4px 15px ${palette.charcoal}08`,
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    backgroundColor: palette.rosewood,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    boxShadow: `0 6px 14px ${palette.rosewood}35`,
                  }}
                >
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontStyle: 'italic', color: palette.charcoal, marginBottom: '0.6rem' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: palette.charcoal, opacity: 0.8, fontStyle: 'italic', lineHeight: 1.55, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '2rem 0',
            borderTop: `1px solid ${palette.rosewood}25`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: palette.charcoal,
            opacity: 0.85,
            fontStyle: 'italic',
            gap: '1rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} <span style={{ color: palette.rosewood, fontWeight: 800 }}>PeoplePay360</span>. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>• Alabaster & Vintage Rosewood Theme</span>
            <span>• 3D Button UI</span>
            <span>• Italic Typography</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
