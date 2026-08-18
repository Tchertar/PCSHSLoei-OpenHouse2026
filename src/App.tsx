import React, { useEffect, useState } from 'react';
import { ActivityItem, AdminUser, Attendee, AuditLog, ScheduleItem } from './types';
import {
  FAQ_LIST,
  SCHEDULE_LIST,
} from './data/initialData';

import { BackgroundSky } from './components/BackgroundSky';
import { ClickEffectCanvas } from './components/ClickEffectCanvas';
import { Navbar } from './components/Navbar';
import { Banner } from './components/Banner';
import { CountdownTimer } from './components/CountdownTimer';
import { ActivitiesSection } from './components/ActivitiesSection';
import { MapSection } from './components/MapSection';
import { ScheduleSection } from './components/ScheduleSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { PdpaBanner } from './components/PdpaBanner';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { RegistrationModal } from './components/RegistrationModal';
import { ProfileTicketModal } from './components/ProfileTicketModal';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GoogleAccountChooserModal } from './components/GoogleAccountChooserModal';
import { GoogleOAuthGuideModal } from './components/GoogleOAuthGuideModal';
import { GoogleUserProfile, logoutGoogleUser } from './lib/googleAuth';

import {
  subscribeAttendees,
  saveAttendeeToFirestore,
  subscribeAdmins,
  saveAdminToFirestore,
  saveAllAdminsToFirestore,
  subscribeActivities,
  subscribeAuditLogs,
  saveAuditLogToFirestore,
  subscribeSchedules,
} from './lib/firebase';

import { OrgRegistrationNoticeModal } from './components/OrgRegistrationNoticeModal';
import { Sparkles, ArrowRight, UserCheck, CheckCircle2, Shield, Building2, Lock, LogIn } from 'lucide-react';

const DEFAULT_SYSTEM_ADMINS: AdminUser[] = [
  {
    id: 'adm-super',
    username: 'admin',
    name: 'Super Admin System',
    email: 'superadmin@pcshsloei.ac.th',
    role: 'super_admin',
    password: 'admin123',
    createdAt: '2026-07-01 08:00:00',
  },
  {
    id: 'adm-01',
    username: 'admin01',
    name: 'ครูสมชาย วิชาการ (Admin 01)',
    email: 'admin01@pcshsloei.ac.th',
    role: 'admin',
    password: '12345678',
    createdAt: '2026-07-02 09:30:00',
  },
  {
    id: 'adm-02',
    username: 'admin02',
    name: 'ครูพิมลวรรณ ไอที (Admin 02)',
    email: 'admin02@pcshsloei.ac.th',
    role: 'admin',
    password: '12345678',
    createdAt: '2026-07-02 10:15:00',
  },
  {
    id: 'adm-03',
    username: 'admin03',
    name: 'ครูธีรเดช กิจกรรม (Admin 03)',
    email: 'admin03@pcshsloei.ac.th',
    role: 'admin',
    password: '12345678',
    createdAt: '2026-07-03 11:00:00',
  },
];

export default function App() {
  // Application Global State with Firebase Firestore Realtime Data
  const [attendees, setAttendees] = useState<Attendee[]>(() => {
    const saved = localStorage.getItem('pcshs_attendees');
    return saved ? JSON.parse(saved) : [];
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('pcshs_admins');
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('pcshs_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('pcshs_schedules');
    return saved ? JSON.parse(saved) : SCHEDULE_LIST;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('pcshs_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Subscribe to real-time Firebase Firestore database
  useEffect(() => {
    const unsubAttendees = subscribeAttendees((firestoreData) => {
      setAttendees(firestoreData || []);
    });

    const unsubAdmins = subscribeAdmins((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setAdmins(firestoreData);
      } else {
        setAdmins(DEFAULT_SYSTEM_ADMINS);
        saveAllAdminsToFirestore(DEFAULT_SYSTEM_ADMINS);
      }
    });

    const unsubActivities = subscribeActivities((firestoreData) => {
      setActivities(firestoreData || []);
    });

    const unsubAuditLogs = subscribeAuditLogs((firestoreData) => {
      setAuditLogs(firestoreData || []);
    });

    const unsubSchedules = subscribeSchedules((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setSchedules(firestoreData);
      } else {
        setSchedules(SCHEDULE_LIST);
      }
    });

    return () => {
      unsubAttendees();
      unsubAdmins();
      unsubActivities();
      unsubAuditLogs();
      unsubSchedules();
    };
  }, []);

  // Session State
  const [currentAttendee, setCurrentAttendee] = useState<Attendee | null>(() => {
    const saved = localStorage.getItem('pcshs_current_attendee');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('pcshs_current_admin');
    return saved ? JSON.parse(saved) : null;
  });

  // Modal Controls State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginInitialTab, setLoginInitialTab] = useState<'admin' | 'user'>('user');
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  const isRegistrationOpen = false;

  const handleGeneralRegisterClick = () => {
    alert('ระบบปิดรับการลงทะเบียนออนไลน์เรียบร้อยแล้ว\n\nหากท่านได้ลงทะเบียนไว้แล้ว สามารถกดปุ่ม "เข้าสู่ระบบ" เพื่อดูบัตรประจำตัวผู้เข้าร่วมงานได้');
  };

  const handleOpenUserLogin = () => {
    setLoginInitialTab('user');
    setIsLoginOpen(true);
  };

  const handleOpenAdminLogin = () => {
    setLoginInitialTab('admin');
    setIsLoginOpen(true);
  };

  // Google OAuth States
  const [isAccountChooserOpen, setIsAccountChooserOpen] = useState(false);
  const [isOAuthGuideOpen, setIsOAuthGuideOpen] = useState(false);
  const [selectedGoogleUser, setSelectedGoogleUser] = useState<GoogleUserProfile | null>(null);

  // Sync states to LocalStorage
  useEffect(() => {
    localStorage.setItem('pcshs_attendees', JSON.stringify(attendees));
  }, [attendees]);

  useEffect(() => {
    localStorage.setItem('pcshs_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('pcshs_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('pcshs_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('pcshs_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (currentAttendee) {
      localStorage.setItem('pcshs_current_attendee', JSON.stringify(currentAttendee));
    } else {
      localStorage.removeItem('pcshs_current_attendee');
    }
  }, [currentAttendee]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('pcshs_current_admin', JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem('pcshs_current_admin');
    }
  }, [currentAdmin]);

  // Helper to add audit logs
  const addAuditLog = (action: string, details: string) => {
    const actorName = currentAdmin ? `${currentAdmin.username} (${currentAdmin.role})` : 'ผู้ใช้ทั่วไป';
    const newLog: AuditLog = {
      id: `log-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: actorName,
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  // Handlers
  const handleRegisterSuccess = (newAttendee: Attendee, isExisting?: boolean) => {
    if (!isExisting) {
      setAttendees((prev) => {
        if (prev.some((a) => a.id === newAttendee.id || a.email === newAttendee.email)) return prev;
        return [newAttendee, ...prev];
      });
      addAuditLog('ลงทะเบียนใหม่', `ผู้เข้าร่วมใหม่ ${newAttendee.participantCode} (${newAttendee.firstName} ${newAttendee.lastName})`);
      saveAttendeeToFirestore(newAttendee);
    } else {
      addAuditLog('เข้าสู่ระบบอัตโนมัติ', `ผู้เข้าร่วม ${newAttendee.participantCode} (${newAttendee.email}) เข้าสู่ระบบผ่านปุ่มลงทะเบียนซ้ำ`);
    }

    setCurrentAttendee(newAttendee);
    setIsRegisterOpen(false);
    setIsProfileOpen(true);
  };

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setIsLoginOpen(false);
    setIsAdminDashboardOpen(true);
    addAuditLog('เข้าสู่ระบบ Admin', `แอดมิน ${admin.username} เข้าสู่ระบบสำเร็จ`);
  };

  const handleAttendeeLoginSuccess = (attendee: Attendee) => {
    setCurrentAttendee(attendee);
    setIsLoginOpen(false);
    setIsProfileOpen(true);
  };

  const handleSelectGoogleAccount = (googleUser: GoogleUserProfile) => {
    setIsAccountChooserOpen(false);

    // Check if user exists in database/attendees list by email or googleId
    const matchedUser = attendees.find(
      (a) => a.email.toLowerCase() === googleUser.email.toLowerCase() || (a.googleId && a.googleId === googleUser.googleId)
    );

    if (matchedUser) {
      // Existing user -> Log in immediately
      const updatedUser: Attendee = {
        ...matchedUser,
        photoUrl: googleUser.photoUrl || matchedUser.photoUrl,
        googleId: googleUser.googleId || matchedUser.googleId,
      };
      setCurrentAttendee(updatedUser);
      saveAttendeeToFirestore(updatedUser);
      addAuditLog('เข้าสู่ระบบ Google OAuth', `ผู้ใช้งาน ${googleUser.email} เข้าสู่ระบบสำเร็จด้วย Google Account`);
      alert(`👋 ยินดีต้อนรับกลับคุณ ${updatedUser.firstName} ${updatedUser.lastName}!\n\nเข้าสู่ระบบสำเร็จด้วย Google Account (${googleUser.email})`);
      setIsProfileOpen(true);
    } else {
      // New user -> Open registration modal populated with Google Info
      setSelectedGoogleUser(googleUser);
      setIsRegisterOpen(true);
    }
  };

  const handleLogout = () => {
    if (currentAdmin) {
      addAuditLog('ออกจากระบบ', `แอดมิน ${currentAdmin.username} ออกจากระบบ`);
    }
    logoutGoogleUser();
    setCurrentAttendee(null);
    setCurrentAdmin(null);
    setIsAdminDashboardOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen relative font-['Prompt',sans-serif] bg-slate-50 text-slate-900 flex flex-col justify-between overflow-x-clip">
      {/* Click Burst Particles & Ripples Effect */}
      <ClickEffectCanvas />

      {/* Dynamic Animated Sky & Clouds Background */}
      <BackgroundSky />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar
          currentAttendee={currentAttendee}
          currentAdmin={currentAdmin}
          onOpenLogin={(tab) => {
            if (tab) setLoginInitialTab(tab);
            setIsLoginOpen(true);
          }}
          onOpenUserLogin={handleOpenUserLogin}
          onOpenAdminLogin={handleOpenAdminLogin}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
          onLogout={handleLogout}
        />

        {/* Hero Full-width Banner */}
        <Banner
          onRegisterClick={handleGeneralRegisterClick}
          onOpenOrgModal={() => setIsOrgModalOpen(true)}
        />

        {/* Live Event Countdown Timer */}
        <CountdownTimer />

        {/* Prominent Center Registration Section */}
        <section className="my-8 px-4 text-center max-w-4xl mx-auto z-10">
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />

            <span className="inline-flex items-center gap-2 bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>ปิดรับการลงทะเบียนออนไลน์ทุกช่องทางแล้ว</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight flex flex-col items-center justify-center gap-1 sm:gap-2">
              <span>PCSHS Loei Open House 2026</span>
              <span>มหกรรมเปิดบ้านวิทยาศาสตร์</span>
            </h1>

            <div className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed flex flex-col items-center justify-center gap-1 font-medium">
              <span>Academic - Challenge - Innovation Expo</span>
              <span>สำหรับผู้ที่มีข้อมูลในระบบแล้ว สามารถเข้าสู่ระบบเพื่อดูบัตรประจำตัวและ QR Code เข้างาน</span>
            </div>

            {currentAttendee ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl transition-all transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-6 h-6" />
                  <span>ดูบัตรประจำตัวผู้เข้าร่วม ({currentAttendee.firstName})</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
                {/* Prominent Login Button for Registered Attendees */}
                <button
                  onClick={handleOpenUserLogin}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border border-blue-400/40"
                >
                  <LogIn className="w-5 h-5 text-blue-200" />
                  <span>เข้าสู่ระบบเพื่อดูบัตรประจำตัว</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Closed Standard Registration Button */}
                <button
                  disabled={true}
                  title="ระบบปิดรับการลงทะเบียนออนไลน์แล้ว"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-100 text-slate-400 font-bold text-sm sm:text-base rounded-2xl shadow-none cursor-not-allowed border border-slate-200 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>ปิดรับการลงทะเบียนบุคคลทั่วไปแล้ว</span>
                </button>

                {/* Closed Organization Registration Button */}
                <button
                  disabled={true}
                  title="ระบบปิดรับการลงทะเบียนหน่วยงานแล้ว"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-100 text-slate-400 font-bold text-sm sm:text-base rounded-2xl shadow-none cursor-not-allowed border border-slate-200 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>ปิดรับการลงทะเบียนหน่วยงานแล้ว</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Activities Section */}
        <ActivitiesSection activities={activities} currentAttendee={currentAttendee} />

        {/* Venue Map Section */}
        <MapSection />

        {/* Daily Schedule Program Section */}
        <ScheduleSection schedule={schedules} />

        {/* FAQ Accordions Section */}
        <FaqSection faqs={FAQ_LIST} />

        {/* Footer */}
        <Footer onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      </div>

      {/* PDPA Banner Popup */}
      <PdpaBanner onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />

      {/* Full Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        existingAttendees={attendees}
        onRegisterSuccess={handleRegisterSuccess}
      />

      {/* Organization Registration Notice Modal */}
      <OrgRegistrationNoticeModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
      />

      {/* Google Account Chooser Popup Modal */}
      <GoogleAccountChooserModal
        isOpen={isAccountChooserOpen}
        onClose={() => setIsAccountChooserOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
        onOpenGuideModal={() => setIsOAuthGuideOpen(true)}
      />

      {/* Google OAuth Setup Guide Modal */}
      <GoogleOAuthGuideModal
        isOpen={isOAuthGuideOpen}
        onClose={() => setIsOAuthGuideOpen(false)}
      />

      {/* Profile & Pass Ticket Modal */}
      <ProfileTicketModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        attendee={currentAttendee}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        adminsList={admins}
        attendeesList={attendees}
        initialTab={loginInitialTab}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onAttendeeLoginSuccess={handleAttendeeLoginSuccess}
      />

      {/* Admin Dashboard */}
      {currentAdmin && (
        <AdminDashboard
          currentAdmin={currentAdmin}
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          attendees={attendees}
          setAttendees={setAttendees}
          admins={admins}
          setAdmins={setAdmins}
          activities={activities}
          setActivities={setActivities}
          schedules={schedules}
          setSchedules={setSchedules}
          auditLogs={auditLogs}
          addAuditLog={addAuditLog}
        />
      )}
    </div>
  );
}
