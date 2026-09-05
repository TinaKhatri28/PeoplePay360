import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HRMSLogin(): React.JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // Handle enterprise authentication
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#F8F9FA] p-4 overflow-hidden text-[#1F2937] font-sans antialiased">
      {/* Subtle Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3F5F7F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1E3A5F]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-8 md:p-10 shadow-[0_20px_40px_-15px_rgba(30,58,95,0.08)] z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F9FA] border border-[#E2E8F0] shadow-inner mb-4">
            <ShieldCheck className="h-6 w-6 text-[#1E3A5F]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E3A5F]">HRMS Portal</h1>
          <p className="text-xs text-[#64748B] mt-1">Sign in with your enterprise credentials</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 uppercase tracking-wider">
              Corporate Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-[#64748B]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="employee@company.com"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] pl-10 pr-4 py-2.5 text-sm text-[#1F2937] placeholder-[#64748B]/70 outline-none transition duration-150 focus:border-[#3F5F7F] focus:bg-[#FFFFFF] focus:ring-3 focus:ring-[#3F5F7F]/15"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-[#3F5F7F] hover:text-[#1E3A5F] transition">
                Forgot?
              </a>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-[#64748B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] pl-10 pr-10 py-2.5 text-sm text-[#1F2937] placeholder-[#64748B]/70 outline-none transition duration-150 focus:border-[#3F5F7F] focus:bg-[#FFFFFF] focus:ring-3 focus:ring-[#3F5F7F]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#64748B] hover:text-[#1F2937] transition focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#E2E8F0] accent-[#1E3A5F] cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 text-xs text-[#64748B] cursor-pointer select-none">
              Keep me signed in for 24 hours
            </label>
          </div>

          {/* 3D Crystal Deep Navy Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-xl border border-white/20 py-3 px-6 transition-all duration-150 active:translate-y-0.5 cursor-pointer bg-gradient-to-b from-[#3F5F7F]/95 to-[#1E3A5F] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(10,20,35,0.5),0_10px_20px_-5px_rgba(30,58,95,0.35),0_4px_6px_-2px_rgba(30,58,95,0.2)] hover:from-[#4B7095] hover:to-[#1E3A5F] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(10,20,35,0.6),0_14px_26px_-4px_rgba(30,58,95,0.45)]"
            >
              {/* Specular Light Bar */}
              <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent pointer-events-none" />

              {/* Shimmer Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Label */}
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        </form>

        {/* System Status Footer */}
        <div className="mt-8 border-t border-[#E2E8F0] pt-4 flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2E7D5B] inline-block" />
            <span>Systems Nominal</span>
          </div>
          <span>v2.4.0 Secure Access</span>
        </div>
      </div>
    </div>
  );
}