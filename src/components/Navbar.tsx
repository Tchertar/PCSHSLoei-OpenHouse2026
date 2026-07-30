import React, { useState } from 'react';
import { AdminUser, Attendee } from '../types';
import { Calendar, ChevronDown, HelpCircle, LogIn, LogOut, Map, Menu, Shield, UserCheck, X, Trophy } from 'lucide-react';

interface NavbarProps {
  currentAttendee: Attendee | null;
  currentAdmin: AdminUser | null;
  onOpenLogin: () => void;
  onOpenUserLogin?: () => void;
  onOpenProfile: () => void;
  onOpenAdminDashboard: () => void;
  onLogout: () => void;
  onRegisterClick: () => void;
}

const GoogleLogoSVG = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  currentAttendee,
  currentAdmin,
  onOpenLogin,
  onOpenUserLogin,
  onOpenProfile,
  onOpenAdminDashboard,
  onLogout,
  onRegisterClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'กิจกรรม&การแข่งขัน', href: '#activities', icon: Trophy },
    { name: 'แผนผังงาน', href: '#map', icon: Map },
    { name: 'กำหนดการ', href: '#schedule', icon: Calendar },
    { name: 'คำถามที่พบบ่อย (FAQ)', href: '#faq', icon: HelpCircle },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* GROUP 1: BRAND LOGO & TITLE (NO FRAME AROUND LOGO, FLOATING ANIMATION) */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3.5 group cursor-pointer shrink-0"
          >
            {/* Frameless Animated Logo */}
            <div className="relative w-12 h-12 flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-110 group-hover:-rotate-3">
              <img
                src="https://lh3.googleusercontent.com/d/1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE"
                alt="PCSHS Loei Open House 2026 Logo"
                className="w-full h-full object-contain filter drop-shadow-md select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://drive.google.com/thumbnail?id=1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE&sz=w500';
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 font-extrabold text-base sm:text-lg leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                PCSHS LOEI OPEN HOUSE 2026
              </span>
              <span className="text-xs text-orange-600 font-semibold">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
              </span>
            </div>
          </a>

          {/* GROUP 2: CENTER NAVIGATION LINKS */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 bg-slate-50/80 p-1.5 rounded-full border border-slate-200/80 shadow-inner">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-white px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all hover:shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-orange-500" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* GROUP 3: AUTH & ACTIONS (SIGN IN WITH GOOGLE OAUTH 2.0) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdminDashboard}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow cursor-pointer transition-transform hover:scale-105"
                >
                  <Shield className="w-4 h-4 text-amber-300" />
                  <span>จัดการระบบ ({currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-red-500/10 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-slate-200 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow cursor-pointer transition-transform hover:scale-105"
                >
                  <UserCheck className="w-4 h-4 text-emerald-100" />
                  <span>บัตรประจำตัว ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-red-500/10 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-slate-200 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onRegisterClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-white" />
                  <span>ลงทะเบียนเข้าร่วมงาน</span>
                </button>

                <button
                  onClick={onOpenLogin}
                  title="เข้าสู่ระบบ"
                  className="flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-blue-500/25 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/30"
                >
                  <LogIn className="w-4 h-4 text-blue-100" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2.5 rounded-xl text-base font-medium"
                >
                  <Icon className="w-5 h-5 text-orange-500" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            {currentAdmin ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>จัดการระบบ ({currentAdmin.role})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ดูบัตรประจำตัว ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegisterClick();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>ลงทะเบียนเข้าร่วมงาน</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-blue-100" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

