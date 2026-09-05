import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap, Users, Clock, CreditCard, ChevronRight, Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onEnterLogin: () => void;
}

export default function LandingPage({ onEnterLogin }: LandingPageProps): React.JSX.Element {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#050505',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        fontStyle: 'italic',
        overflowX: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Dynamic Background Noise / Grid Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 215, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 215, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Yellow Glowing Ambient Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.18) 0%, rgba(255, 215, 0, 0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 230, 0, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(100px)',
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
            padding: '2rem 0',
            borderBottom: '1px solid rgba(255, 215, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FFE600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(255, 230, 0, 0.4), inset 0 2px 0 #FFFFFF',
              }}
            >
              <ShieldCheck size={26} color="#000000" />
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                PeoplePay<span style={{ color: '#FFE600' }}>360</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.65rem', color: '#FFE600', letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: 700 }}>
                Enterprise HR & Payroll OS
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, fontStyle: 'italic', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFE600')} onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}>
              Features
            </a>
            <a href="#security" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, fontStyle: 'italic', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFE600')} onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}>
              Security
            </a>
            <a href="#stats" style={{ color: '#E5E7EB', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, fontStyle: 'italic', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#FFE600')} onMouseLeave={(e) => (e.currentTarget.style.color = '#E5E7EB')}>
              Metrics
            </a>
          </nav>

          {/* Top 3D Header Login Button */}
          <button
            onClick={onEnterLogin}
            style={{
              position: 'relative',
              backgroundColor: '#FFE600',
              color: '#000000',
              border: '2px solid #000000',
              borderRadius: '10px',
              padding: '0.6rem 1.4rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              fontStyle: 'italic',
              cursor: 'pointer',
              boxShadow: '0px 5px 0px #B39200, 0px 8px 15px rgba(255, 230, 0, 0.3)',
              transform: 'translateY(0px)',
              transition: 'all 0.12s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0px 7px 0px #B39200, 0px 12px 20px rgba(255, 230, 0, 0.4)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = '0px 1px 0px #B39200, 0px 4px 8px rgba(0,0,0,0.5)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0px 7px 0px #B39200, 0px 12px 20px rgba(255, 230, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0px 5px 0px #B39200, 0px 8px 15px rgba(255, 230, 0, 0.3)';
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={16} />
          </button>
        </header>

        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '5rem 1rem 4rem', position: 'relative' }}>
          
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: 'rgba(255, 230, 0, 0.1)',
              border: '1px solid rgba(255, 230, 0, 0.4)',
              padding: '0.45rem 1.25rem',
              borderRadius: '999px',
              color: '#FFE600',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontStyle: 'italic',
              marginBottom: '2rem',
              boxShadow: '0 0 20px rgba(255, 230, 0, 0.15)',
            }}
          >
            <Sparkles size={16} color="#FFE600" />
            <span>NEXT-GEN HR & PAYROLL OPERATING SYSTEM</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: ' clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 auto 1.5rem',
              maxWidth: '900px',
              color: '#FFFFFF',
            }}
          >
            Automate Payroll.<br />
            <span
              style={{
                color: '#FFE600',
                textShadow: '0 0 35px rgba(255, 230, 0, 0.4)',
              }}
            >
              Empower Workforce.
            </span>{' '}
            Zero Errors.
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.2rem',
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#D1D5DB',
              maxWidth: '720px',
              margin: '0 auto 3rem',
              lineHeight: 1.6,
            }}
          >
            The ultimate high-performance workspace for real-time employee tracking, smart attendance verification, automated tax compliance, and instant 1-click payslip generation.
          </p>

          {/* PROMINENT 3D BUTTON AREA */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              marginTop: '1rem',
            }}
          >
            {/* Massive Extruded 3D Button */}
            <button
              onClick={onEnterLogin}
              style={{
                position: 'relative',
                backgroundColor: '#FFE600',
                color: '#000000',
                border: '3px solid #000000',
                borderRadius: '16px',
                padding: '1.25rem 3.5rem',
                fontSize: '1.35rem',
                fontWeight: 900,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                // 3D Shadow Layers
                boxShadow: `
                  0px 10px 0px #B39200,
                  0px 12px 0px #000000,
                  0px 20px 35px rgba(255, 230, 0, 0.45)
                `,
                transform: 'translateY(0px)',
                transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `
                  0px 13px 0px #B39200,
                  0px 15px 0px #000000,
                  0px 25px 45px rgba(255, 230, 0, 0.6)
                `;
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(8px)';
                e.currentTarget.style.boxShadow = `
                  0px 2px 0px #B39200,
                  0px 4px 0px #000000,
                  0px 8px 15px rgba(0, 0, 0, 0.6)
                `;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `
                  0px 13px 0px #B39200,
                  0px 15px 0px #000000,
                  0px 25px 45px rgba(255, 230, 0, 0.6)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = `
                  0px 10px 0px #B39200,
                  0px 12px 0px #000000,
                  0px 20px 35px rgba(255, 230, 0, 0.45)
                `;
              }}
            >
              <span>GET STARTED NOW</span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={22} color="#FFE600" />
              </div>
            </button>

            {/* Click callout instruction */}
            <p style={{ fontSize: '0.85rem', color: '#9CA3AF', fontStyle: 'italic', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="#FFE600" />
              <span>Click the 3D button above to access the secure login portal</span>
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section
          id="stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            padding: '2.5rem',
            backgroundColor: '#0D0D0F',
            borderRadius: '20px',
            border: '1px solid rgba(255, 230, 0, 0.2)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            marginBottom: '6rem',
          }}
        >
          {[
            { value: '99.99%', label: 'Payrun Accuracy Rate', icon: <CheckCircle2 size={24} color="#FFE600" /> },
            { value: '10x', label: 'Faster Salary Calculations', icon: <Zap size={24} color="#FFE600" /> },
            { value: '50,000+', label: 'Active Employee Profiles', icon: <Users size={24} color="#FFE600" /> },
            { value: '100%', label: 'Tax & Labor Compliance', icon: <Award size={24} color="#FFE600" /> },
          ].map((stat, idx) => (
            <div key={idx} style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#FFE600', fontStyle: 'italic', marginBottom: '0.2rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600, fontStyle: 'italic' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* Core Features Cards */}
        <section id="features" style={{ paddingBottom: '6rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, fontStyle: 'italic', color: '#FFFFFF', marginBottom: '0.75rem' }}>
              Designed for <span style={{ color: '#FFE600' }}>Precision & Control</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#9CA3AF', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto' }}>
              Everything your organization needs to manage workforce operations seamlessly in one unified platform.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {[
              {
                icon: <CreditCard size={32} color="#000000" />,
                title: 'Automated Payrun Processing',
                desc: 'Calculate complex allowances, tax brackets, and overtime deductions in seconds with instant PDF payslip distribution.',
              },
              {
                icon: <Clock size={32} color="#000000" />,
                title: 'Real-Time Attendance Engine',
                desc: 'Track check-ins, check-outs, break times, and shift schedules with automated late penalties and overtime logs.',
              },
              {
                icon: <Users size={32} color="#000000" />,
                title: 'Smart Contract & Salary Structures',
                desc: 'Configure flexible salary components, basic pays, housing allowances, transport bonuses, and compliance rules.',
              },
              {
                icon: <ShieldCheck size={32} color="#000000" />,
                title: 'Role-Based Access Governance',
                desc: 'Granular permissions for HR Managers, Payroll Staff, and Employees to ensure complete data privacy and security.',
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: '#0D0D0F',
                  border: hoveredCard === idx ? '2px solid #FFE600' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '2.25rem 1.75rem',
                  transition: 'all 0.25s ease',
                  transform: hoveredCard === idx ? 'translateY(-6px)' : 'translateY(0px)',
                  boxShadow: hoveredCard === idx ? '0 15px 35px rgba(255, 230, 0, 0.15)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#FFE600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 6px 15px rgba(255, 230, 0, 0.3)',
                  }}
                >
                  {feat.icon}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontStyle: 'italic', color: '#FFFFFF', marginBottom: '0.75rem' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#9CA3AF', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Bottom Banner */}
        <section
          style={{
            backgroundColor: '#FFE600',
            borderRadius: '24px',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#000000',
            border: '3px solid #000000',
            boxShadow: '0px 14px 0px #000000, 0px 25px 40px rgba(255, 230, 0, 0.3)',
            marginBottom: '6rem',
          }}
        >
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontStyle: 'italic', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Ready to Transform Your Payroll Operations?
          </h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, fontStyle: 'italic', marginBottom: '2.5rem', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
            Join top HR teams using PeoplePay360 for accurate, seamless, and automated workforce management.
          </p>

          <button
            onClick={onEnterLogin}
            style={{
              backgroundColor: '#000000',
              color: '#FFE600',
              border: '2px solid #FFFFFF',
              borderRadius: '12px',
              padding: '1.1rem 2.8rem',
              fontSize: '1.1rem',
              fontWeight: 800,
              fontStyle: 'italic',
              cursor: 'pointer',
              boxShadow: '0px 8px 0px #333333, 0px 12px 20px rgba(0,0,0,0.4)',
              transform: 'translateY(0px)',
              transition: 'all 0.12s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0px 10px 0px #333333, 0px 16px 25px rgba(0,0,0,0.5)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(6px)';
              e.currentTarget.style.boxShadow = '0px 2px 0px #333333, 0px 5px 10px rgba(0,0,0,0.5)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0px 10px 0px #333333, 0px 16px 25px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)';
              e.currentTarget.style.boxShadow = '0px 8px 0px #333333, 0px 12px 20px rgba(0,0,0,0.4)';
            }}
          >
            <span>Proceed to Workspace Sign In</span>
            <ChevronRight size={20} />
          </button>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '2.5rem 0',
            borderTop: '1px solid rgba(255, 230, 0, 0.15)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: '#9CA3AF',
            fontStyle: 'italic',
            gap: '1rem',
          }}
        >
          <div>
            © {new Date().getFullYear()} <span style={{ color: '#FFE600', fontWeight: 700 }}>PeoplePay360</span>. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ color: '#FFE600' }}>• Yellow-Black-White Edition</span>
            <span>• 3D Interactive UI</span>
            <span>• Italic Typography</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
