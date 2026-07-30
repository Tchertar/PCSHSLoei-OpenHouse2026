import React, { useState } from 'react';
import { AdminUser, Attendee } from '../types';
import { Calendar, HelpCircle, LogIn, LogOut, Map, Menu, Shield, UserCheck, X, Trophy } from 'lucide-react';

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

export const Navbar: React.FC<NavbarProps> = ({
  currentAttendee,
  currentAdmin,
  onOpenLogin,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          
          {/* GROUP 1: BRAND LOGO & TITLE */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer shrink-0 whitespace-nowrap"
          >
            {/* Frameless Animated Logo */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-300 ease-out transform group-hover:scale-110 group-hover:-rotate-3 shrink-0">
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
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-slate-900 font-extrabold text-sm sm:text-base lg:text-lg leading-tight tracking-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">
                PCSHS LOEI OPEN HOUSE 2026
              </span>
              <span className="text-[11px] sm:text-xs text-orange-600 font-semibold whitespace-nowrap">
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
              </span>
            </div>
          </a>

          {/* GROUP 2: CENTER NAVIGATION LINKS (SINGLE LINE ONLY, NO BREAK) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 bg-slate-50/80 p-1.5 rounded-full border border-slate-200/80 shadow-inner whitespace-nowrap shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-white px-3 xl:px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all hover:shadow-sm whitespace-nowrap shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* GROUP 3: AUTH & ACTIONS (SINGLE LINE ONLY) */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-2.5 whitespace-nowrap shrink-0">
            {currentAdmin ? (
              <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                <button
                  onClick={onOpenAdminDashboard}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl shadow cursor-pointer transition-transform hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <Shield className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="whitespace-nowrap">จัดการระบบ ({currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-red-500/10 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-slate-200 hover:border-red-200 whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">ออกจากระบบ</span>
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl shadow cursor-pointer transition-transform hover:scale-105 whitespace-nowrap shrink-0"
                >
                  <UserCheck className="w-4 h-4 text-emerald-100 shrink-0" />
                  <span className="whitespace-nowrap">บัตรประจำตัว ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-red-500/10 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-slate-200 hover:border-red-200 whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
                <button
                  onClick={onRegisterClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-3.5 lg:px-4.5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserCheck className="w-4 h-4 text-white shrink-0" />
                  <span className="whitespace-nowrap">ลงทะเบียนเข้าร่วมงาน</span>
                </button>

                <button
                  onClick={onOpenLogin}
                  title="เข้าสู่ระบบ"
                  className="flex items-center gap-1.5 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 px-3.5 lg:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-blue-500/25 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/30 whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-4 h-4 text-blue-100 shrink-0" />
                  <span className="whitespace-nowrap">เข้าสู่ระบบ</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer shrink-0"
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
                  className="flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2.5 rounded-xl text-base font-medium whitespace-nowrap"
                >
                  <Icon className="w-5 h-5 text-orange-500 shrink-0" />
                  <span className="whitespace-nowrap">{link.name}</span>
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
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">จัดการระบบ ({currentAdmin.role})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="whitespace-nowrap">ออกจากระบบ</span>
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">ดูบัตรประจำตัว ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm border border-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="whitespace-nowrap">ออกจากระบบ</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegisterClick();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base rounded-xl shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">ลงทะเบียนเข้าร่วมงาน</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 text-blue-100 shrink-0" />
                  <span className="whitespace-nowrap">เข้าสู่ระบบ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
