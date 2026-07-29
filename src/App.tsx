import React, { useEffect, useState } from 'react';
import { ActivityItem, AdminUser, Attendee, AuditLog, ScheduleItem } from './types';
import {
  INITIAL_ACTIVITIES,
  INITIAL_ADMINS,
  INITIAL_ATTENDEES,
  INITIAL_AUDIT_LOGS,
  FAQ_LIST,
  NEWS_LIST,
  SCHEDULE_LIST,
} from './data/initialData';

import { BackgroundSky } from './components/BackgroundSky';
import { ClickEffectCanvas } from './components/ClickEffectCanvas';
import { Navbar } from './components/Navbar';
import { Banner } from './components/Banner';
import { CountdownTimer } from './components/CountdownTimer';
import { ActivitiesSection } from './components/ActivitiesSection';
import { MapSection } from './components/MapSection';
import { NewsSection } from './components/NewsSection';
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
  saveAllAttendeesToFirestore,
  subscribeAdmins,
  saveAllAdminsToFirestore,
  subscribeActivities,
  saveAllActivitiesToFirestore,
  subscribeAuditLogs,
  saveAuditLogToFirestore,
  saveAllAuditLogsToFirestore,
  subscribeSchedules,
  saveAllSchedulesToFirestore,
} from './lib/firebase';

import { Sparkles, ArrowRight, UserCheck, CheckCircle2, Shield } from 'lucide-react';

export default function App() {
  // Application Global State with Firebase Firestore & LocalStorage Backup
  const [attendees, setAttendees] = useState<Attendee[]>(() => {
    const saved = localStorage.getItem('pcshs_attendees');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDEES;
  });

  // Subscribe to real-time Firebase Firestore database
  useEffect(() => {
    const unsubAttendees = subscribeAttendees((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setAttendees(firestoreData);
      } else {
        saveAllAttendeesToFirestore(INITIAL_ATTENDEES);
      }
    });

    const unsubAdmins = subscribeAdmins((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setAdmins(firestoreData);
      } else {
        saveAllAdminsToFirestore(INITIAL_ADMINS);
      }
    });

    const unsubActivities = subscribeActivities((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setActivities(firestoreData);
      } else {
        saveAllActivitiesToFirestore(INITIAL_ACTIVITIES);
      }
    });

    const unsubAuditLogs = subscribeAuditLogs((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setAuditLogs(firestoreData);
      } else {
        saveAllAuditLogsToFirestore(INITIAL_AUDIT_LOGS);
      }
    });

    const unsubSchedules = subscribeSchedules((firestoreData) => {
      if (firestoreData && firestoreData.length > 0) {
        setSchedules(firestoreData);
      } else {
        saveAllSchedulesToFirestore(SCHEDULE_LIST);
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

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('pcshs_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('pcshs_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('pcshs_schedules');
    return saved ? JSON.parse(saved) : SCHEDULE_LIST;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('pcshs_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

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
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
          onLogout={handleLogout}
          onRegisterClick={() => setIsRegisterOpen(true)}
        />

        {/* Hero Full-width Banner */}
        <Banner onRegisterClick={() => setIsRegisterOpen(true)} />

        {/* Live Event Countdown Timer */}
        <CountdownTimer />

        {/* Prominent Center Registration Section */}
        <section className="my-8 px-4 text-center max-w-4xl mx-auto z-10">
          <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />

            <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>เปิดระบบลงทะเบียนเข้าร่วมงานออนไลน์แล้ววันนี้</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
              มหกรรมเปิดบ้านวิทยาศาสตร์ PCSHS Loei Open House 2026
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              จุดประกายความคิด บ่มเพาะนักวิทยาศาสตร์รุ่นเยาว์ ร่วมชมนิทรรศการนวัตกรรม และลงทะเบียนแข่งขันฟรี พร้อมรับเกียรติบัตรเข้าร่วมงาน
            </p>

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
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Standard Registration Button */}
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-2xl hover:shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-3 group border border-orange-400/40 animate-pulse-glow"
                >
                  <Sparkles className="w-6 h-6 text-amber-200" />
                  <span>ลงทะเบียนเข้าร่วมงาน (สร้างบัญชีผู้ใช้)</span>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic Activities Section */}
        <ActivitiesSection activities={activities} />

        {/* Venue Map Section */}
        <MapSection />

        {/* News & Announcements Section */}
        <NewsSection news={NEWS_LIST} />

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
