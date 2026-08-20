import React, { useEffect, useState } from 'react';
import { ActivityItem, AdminUser, Attendee, AuditLog, ScheduleItem } from './types';
import {
  FAQ_LIST,
  SCHEDULE_LIST,
} from './data/initialData';

import { Science3DBackground } from './components/Science3DBackground';
import { ClickEffectCanvas } from './components/ClickEffectCanvas';
import { Navbar } from './components/Navbar';
import { Banner } from './components/Banner';
import { ActivityLocationsTable } from './components/ActivityLocationsTable';
import { VerificationStepsSection } from './components/VerificationStepsSection';
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

      {/* 3D Minimal Science Background with Depth of Field & Floating Elements */}
      <Science3DBackground />

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

        {/* Hero Full-width Banner with Locked Countdown */}
        <Banner />

        {/* Activity Locations Summary Table (from official PDF) */}
        <ActivityLocationsTable />

        {/* Verification Steps Section (ขั้นตอนการยืนยันตัวตนเพื่อเข้าร่วมงาน) */}
        <VerificationStepsSection
          currentAttendee={currentAttendee}
          onOpenLogin={handleOpenUserLogin}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

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
