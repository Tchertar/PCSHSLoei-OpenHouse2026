import React, { useState } from 'react';
import { AdminUser, Attendee } from '../types';
import { Calendar, ChevronDown, HelpCircle, LogIn, LogOut, Map, Menu, Bell, Shield, UserCheck, Utensils, X, Trophy } from 'lucide-react';

interface NavbarProps {
  currentAttendee: Attendee | null;
  currentAdmin: AdminUser | null;
  onOpenLogin: () => void;
  onOpenProfile: () => void;
  onOpenAdminDashboard: () => void;
  onOpenEmailNotify: () => void;
  onLogout: () => void;
  onRegisterClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAttendee,
  currentAdmin,
  onOpenLogin,
  onOpenProfile,
  onOpenAdminDashboard,
  onOpenEmailNotify,
  onLogout,
  onRegisterClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'กิจกรรม&การแข่งขัน', href: '#activities', icon: Trophy },
    { name: 'แผนผังงาน', href: '#map', icon: Map },
    { name: 'ประกาศข่าวสาร', href: '#news', icon: Calendar },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo & Event Name */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 p-1 ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform">
              <img
                src="https://lh3.googleusercontent.com/d/1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE"
                alt="PCSHS Loei Open House 2026 Logo"
                className="w-full h-full object-contain"
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

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <Icon className="w-4 h-4 text-orange-500" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Email Trigger status button */}
            <button
              onClick={onOpenEmailNotify}
              title="ระบบแจ้งเตือนอีเมลอัตโนมัติ 1 วันก่อนงาน"
              className="p-2 text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full" />
            </button>

            {currentAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdminDashboard}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg shadow cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-amber-300" />
                  <span>จัดการระบบ ({currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-2 text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg shadow cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-100" />
                  <span>บัตรผู้เข้าร่วมงาน ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-2 text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-200 cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>ระบบ Admin</span>
                </button>

                <button
                  onClick={onRegisterClick}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm px-4 py-2 rounded-lg shadow-md hover:shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  ลงทะเบียนเข้าร่วม
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
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
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 py-2.5 rounded-lg text-base font-medium"
                >
                  <Icon className="w-5 h-5 text-orange-500" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenEmailNotify();
              }}
              className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium text-sm border border-slate-200"
            >
              <Bell className="w-4 h-4 text-orange-500" />
              <span>ระบบแจ้งเตือนทางอีเมล 1 วันล่วงหน้า</span>
            </button>

            {currentAdmin ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>จัดการระบบ ({currentAdmin.role})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm border border-red-200"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : currentAttendee ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ดูบัตรประจำตัว ({currentAttendee.firstName})</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm border border-red-200"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRegisterClick();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base rounded-lg shadow-lg"
                >
                  ลงทะเบียนด้วย Google Account
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 font-medium text-sm rounded-lg border border-slate-200"
                >
                  ระบบ Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
