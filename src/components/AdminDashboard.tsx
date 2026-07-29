import React, { useState, useEffect } from 'react';
import { ActivityItem, AdminUser, Attendee, AuditLog, ScheduleItem } from '../types';
import {
  saveAttendeeToFirestore,
  deleteAttendeeFromFirestore,
  saveAdminToFirestore,
  deleteAdminFromFirestore,
  saveActivityToFirestore,
  deleteActivityFromFirestore,
  saveMapBuildingToFirestore,
  deleteMapBuildingFromFirestore,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
} from '../lib/firebase';
import {
  Activity,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  EyeOff,
  History,
  Plus,
  QrCode,
  Search,
  Shield,
  Trash2,
  Users,
  X,
  UserCheck,
  Building,
  MapPin,
  Map,
  Camera,
  Layers,
  Phone,
  Link as LinkIcon,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface AdminDashboardProps {
  currentAdmin: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  attendees: Attendee[];
  setAttendees: React.Dispatch<React.SetStateAction<Attendee[]>>;
  admins: AdminUser[];
  setAdmins: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  activities: ActivityItem[];
  setActivities: React.Dispatch<React.SetStateAction<ActivityItem[]>>;
  schedules: ScheduleItem[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
}

const COLORS = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  isOpen,
  onClose,
  attendees,
  setAttendees,
  admins,
  setAdmins,
  activities,
  setActivities,
  schedules,
  setSchedules,
  auditLogs,
  addAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'attendees' | 'activities' | 'scheduleEditor' | 'admins' | 'logs' | 'mapEditor'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Schedule Editor State
  const [newSchedule, setNewSchedule] = useState<ScheduleItem>({
    time: '08:30 - 09:30 น.',
    title: '',
    location: 'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย เลย',
    description: '',
    category: 'กิจกรรม',
  });
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);

  // Map Layout Editor State
  const [mapBuildings, setMapBuildings] = useState([
    {
      id: 'b1',
      name: 'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย',
      desc: 'จุดลงทะเบียนกลาง พิธีเปิด-ปิด และการแข่งขันหุ่นยนต์กู้ภัย',
      zone: 'โซน A - อาคารอำนวยการ',
    },
    {
      id: 'b2',
      name: 'อาคารปฏิบัติการวิทยาศาสตร์ 1 (ฟิสิกส์ & ดาราศาสตร์)',
      desc: 'นิทรรศการฟิสิกส์ ห้องจำลองดวงดาว และแล็บกลศาสตร์',
      zone: 'โซน B - ฝั่งทิศตะวันออก',
    },
    {
      id: 'b3',
      name: 'อาคารปฏิบัติการวิทยาศาสตร์ 2 (เคมี & ชีววิทยา)',
      desc: 'การสกัด DNA พืช การทดลองสารเรืองแสงเคมี และกล้องจุลทรรศน์',
      zone: 'โซน B - ฝั่งทิศตะวันออก',
    },
    {
      id: 'b4',
      name: 'อาคารนวัตกรรมและเทคโนโลยีสารสนเทศ (ICT)',
      desc: 'นิทรรศการนวัตกรรมเยาวชน การประกวดโครงงาน และการอบรม AI',
      zone: 'โซน C - ฝั่งทิศเหนือ',
    },
    {
      id: 'b5',
      name: 'สนามฟุตบอลและลานกิจกรรมกลางแจ้ง',
      desc: 'การแข่งขันจรวดขวดน้ำประเภทแม่นยำ และกิจกรรมสันทนาการ',
      zone: 'โซน D - สนามกลาง',
    },
    {
      id: 'b6',
      name: 'โรงอาหารและซุ้มอาหารบริการผู้ร่วมงาน',
      desc: 'จุดรับประทานอาหาร คูปองสวัสดิการ เครื่องดื่ม และจุดพักผ่อน',
      zone: 'โซน E - ลานสวัสดิการ',
    },
  ]);

  const [newBuilding, setNewBuilding] = useState({ name: '', desc: '', zone: '' });
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);

  // Scanner state
  const [scannedCodeInput, setScannedCodeInput] = useState('');
  const [scannerMessage, setScannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Admin Modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({ username: '', name: '', email: '' });

  // Activity Modal state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityFormData, setActivityFormData] = useState<Omit<ActivityItem, 'id'>>({
    code: '',
    department: '',
    titleTh: '',
    titleEn: '',
    targetGrade: 'ม.1 - ม.6',
    maxPerRound: 30,
    totalRounds: 3,
    coordinator: '',
    phone: '',
    registerUrl: 'https://forms.gle/pcshsloei-activity',
    location: 'อาคารปฏิบัติการวิทยาศาสตร์',
    timeSlot: '09:00 - 15:30 น.',
  });

  // Delete Attendee (Super Admin Password Required) state
  const [deletingAttendee, setDeletingAttendee] = useState<Attendee | null>(null);
  const [superAdminPasswordInput, setSuperAdminPasswordInput] = useState('');
  const [superAdminPasswordError, setSuperAdminPasswordError] = useState('');
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);

  // Calculate Summary Statistics
  const totalRegistrations = attendees.length;
  const totalParticipantsSum = attendees.reduce((sum, a) => sum + (a.attendeeCount || 1), 0);
  const totalCheckedIn = attendees.filter((a) => a.checkedIn).length;

  // Calculate Province Pie Data
  const provinceCounts: Record<string, number> = {};
  attendees.forEach((a) => {
    const prov = a.province || 'ไม่ระบุ';
    provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
  });
  const provincePieData = Object.keys(provinceCounts).map((key) => ({
    name: key,
    value: provinceCounts[key],
  }));

  // Calculate Status Pie Data
  const statusCounts: Record<string, number> = {};
  attendees.forEach((a) => {
    const st = a.status || 'ทั่วไป';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });
  const statusPieData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  // Handle QR Scan / Code Check-in
  const handleCheckIn = (codeOrEmail: string) => {
    const codeClean = codeOrEmail.trim().split('|')[0].toUpperCase();
    const foundIdx = attendees.findIndex(
      (a) =>
        a.participantCode.toUpperCase() === codeClean ||
        a.email.toLowerCase() === codeOrEmail.trim().toLowerCase()
    );

    if (foundIdx !== -1) {
      const found = attendees[foundIdx];
      if (found.checkedIn) {
        setScannerMessage({
          type: 'info',
          text: `⚠️ ผู้เข้าร่วม ${found.participantCode} (${found.firstName} ${found.lastName}) เช็คอินเข้างานแล้วล่วงหน้า`,
        });
        return;
      }

      const updated = [...attendees];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const updatedItem = {
        ...found,
        checkedIn: true,
        checkedInAt: nowStr,
      };
      updated[foundIdx] = updatedItem;

      setAttendees(updated);
      saveAttendeeToFirestore(updatedItem);
      setScannerMessage({
        type: 'success',
        text: `🎉 บันทึกการเช็คอินสำเร็จ! ${found.participantCode} - คุณ${found.firstName} ${found.lastName} (${found.organization})`,
      });

      addAuditLog(
        'สแกน QR Code เช็คอิน',
        `ผู้เข้าร่วม ${found.participantCode} (${found.firstName} ${found.lastName}) เช็คอินสำเร็จ`
      );
    } else {
      setScannerMessage({
        type: 'error',
        text: `❌ ไม่พบรหัสผู้เข้าร่วม "${codeOrEmail}" ในระบบ`,
      });
    }
  };

  // Toggle checkin directly from table
  const handleToggleCheckIn = (attendeeId: string) => {
    const updated = attendees.map((a) => {
      if (a.id === attendeeId) {
        const nextState = !a.checkedIn;
        const nowStr = nextState ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined;
        addAuditLog(
          'เปลี่ยนสถานะการเช็คอิน',
          `ปรับเปลี่ยนสถานะ ${a.participantCode} (${a.firstName}) เป็น ${nextState ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}`
        );
        const updatedAttendee = { ...a, checkedIn: nextState, checkedInAt: nowStr };
        saveAttendeeToFirestore(updatedAttendee);
        return updatedAttendee;
      }
      return a;
    });
    setAttendees(updated);
  };

  // Export Attendees to CSV/Excel excluding passwords
  const handleExportCSV = () => {
    const headers = [
      'Participant Code',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Organization',
      'District',
      'Province',
      'Attendee Count',
      'Transport Method',
      'Register Date',
      'Checked In Status',
      'Checked In Time',
    ];

    const rows = attendees.map((a) => [
      a.participantCode,
      a.firstName,
      a.lastName,
      a.email,
      a.phone,
      a.status,
      a.organization,
      a.district,
      a.province,
      a.attendeeCount,
      a.transportMethod,
      a.registeredAt,
      a.checkedIn ? 'YES' : 'NO',
      a.checkedInAt || '-',
    ]);

    let csvContent = '\uFEFF'; // UTF-8 BOM for Thai Excel compatibility
    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      const escapedRow = row.map((field) => `"${String(field).replace(/"/g, '""')}"`);
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PCSHS_Loei_OpenHouse_Attendees_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('Export ข้อมูล', 'ส่งออกไฟล์ CSV ข้อมูลผู้เข้าร่วมงานทั้งหมด (ยกเว้นรหัสผ่าน)');
  };

  // Delete Attendee with Super Admin password confirmation
  const handleOpenDeleteAttendeeModal = (att: Attendee) => {
    setDeletingAttendee(att);
    setSuperAdminPasswordInput('');
    setSuperAdminPasswordError('');
    setShowSuperAdminPassword(false);
  };

  const handleConfirmDeleteAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingAttendee) return;

    const pwd = superAdminPasswordInput.trim();
    // Validate password against super admin credentials ('admin123', 'superadmin', or current super admin password)
    const isSuperAdminPassword =
      pwd === 'admin123' ||
      pwd === 'superadmin' ||
      (currentAdmin && currentAdmin.role === 'super_admin' && currentAdmin.password && pwd === currentAdmin.password);

    if (!isSuperAdminPassword) {
      setSuperAdminPasswordError('รหัสผ่าน Super Admin ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      return;
    }

    // Delete attendee locally
    const updated = attendees.filter((a) => a.id !== deletingAttendee.id);
    setAttendees(updated);

    // Delete attendee from Firebase Firestore
    deleteAttendeeFromFirestore(deletingAttendee.id);

    // Add audit log
    addAuditLog(
      'ลบผู้ลงทะเบียน (Super Admin)',
      `ลบข้อมูลผู้ลงทะเบียน ${deletingAttendee.participantCode} (${deletingAttendee.firstName} ${deletingAttendee.lastName}) ออกจากระบบและฐานข้อมูล Firebase`
    );

    alert(`✅ ลบข้อมูลผู้ลงทะเบียน ${deletingAttendee.firstName} ${deletingAttendee.lastName} (${deletingAttendee.participantCode}) เรียบร้อยแล้ว`);

    // Reset state
    setDeletingAttendee(null);
    setSuperAdminPasswordInput('');
    setSuperAdminPasswordError('');
  };

  // Add Admin (Super Admin only)
  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.username || !adminFormData.name || !adminFormData.email) return;

    const newAdmin: AdminUser = {
      id: `adm-${Date.now()}`,
      username: adminFormData.username.trim(),
      name: adminFormData.name.trim(),
      email: adminFormData.email.trim(),
      role: 'admin',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setAdmins([...admins, newAdmin]);
    saveAdminToFirestore(newAdmin);
    setShowAdminModal(false);
    setAdminFormData({ username: '', name: '', email: '' });
    addAuditLog('เพิ่ม Admin', `เพิ่มแอดมินใหม่ (${newAdmin.username} - ${newAdmin.name})`);
  };

  const handleDeleteAdmin = (id: string, username: string) => {
    if (username === 'admin') {
      alert('ไม่สามารถลบ Super Admin หลักได้');
      return;
    }
    if (confirm(`คุณต้องการลบสิทธิ์ Admin ของ ${username} หรือไม่?`)) {
      setAdmins(admins.filter((a) => a.id !== id));
      deleteAdminFromFirestore(id);
      addAuditLog('ลบ Admin', `ถอนสิทธิ์แอดมิน (${username})`);
    }
  };

  // Activity CRUD
  const handleOpenActivityModal = (activity?: ActivityItem) => {
    if (activity) {
      setEditingActivityId(activity.id);
      setActivityFormData({
        code: activity.code,
        department: activity.department,
        titleTh: activity.titleTh,
        titleEn: activity.titleEn,
        targetGrade: activity.targetGrade,
        maxPerRound: activity.maxPerRound,
        totalRounds: activity.totalRounds,
        coordinator: activity.coordinator,
        phone: activity.phone,
        registerUrl: activity.registerUrl,
        location: activity.location || 'อาคารวิทยาศาสตร์',
        timeSlot: activity.timeSlot || '09:00 - 15:30 น.',
      });
    } else {
      setEditingActivityId(null);
      setActivityFormData({
        code: `SCI-${Math.floor(10 + Math.random() * 89)}`,
        department: 'สาขาวิทยาศาสตร์',
        titleTh: '',
        titleEn: '',
        targetGrade: 'ม.1 - ม.6',
        maxPerRound: 30,
        totalRounds: 3,
        coordinator: '',
        phone: '',
        registerUrl: 'https://forms.gle/pcshsloei-activity',
        location: 'อาคารวิทยาศาสตร์',
        timeSlot: '09:00 - 15:30 น.',
      });
    }
    setShowActivityModal(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityFormData.code || !activityFormData.titleTh || !activityFormData.coordinator) return;

    if (editingActivityId) {
      // Edit existing
      let updatedAct: ActivityItem | null = null;
      const updated = activities.map((act) => {
        if (act.id === editingActivityId) {
          updatedAct = { ...act, ...activityFormData };
          return updatedAct;
        }
        return act;
      });
      setActivities(updated);
      if (updatedAct) saveActivityToFirestore(updatedAct);
      addAuditLog('แก้ไขกิจกรรม', `แก้ไขข้อมูลกิจกรรม ${activityFormData.code} (${activityFormData.titleTh})`);
    } else {
      // Add new
      const newAct: ActivityItem = {
        id: `act-${Date.now()}`,
        ...activityFormData,
      };
      setActivities([...activities, newAct]);
      saveActivityToFirestore(newAct);
      addAuditLog('เพิ่มกิจกรรมใหม่', `เพิ่มกิจกรรม ${newAct.code} (${newAct.titleTh})`);
    }

    setShowActivityModal(false);
  };

  const handleDeleteActivity = (id: string, code: string) => {
    if (confirm(`คุณต้องการลบกิจกรรม ${code} หรือไม่?`)) {
      setActivities(activities.filter((a) => a.id !== id));
      deleteActivityFromFirestore(id);
      addAuditLog('ลบกิจกรรม', `ลบกิจกรรม (${code})`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl my-4 sm:my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 p-4 sm:p-6 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <span>แดชบอร์ดผู้ดูแลระบบ</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300">
                  {currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </h3>
              <p className="text-xs text-blue-300">
                ยินดีต้อนรับ คุณ{currentAdmin.name} ({currentAdmin.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 pt-3 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            สรุปรายงาน & กราฟ
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>สแกน QR Code เช็คอิน</span>
          </button>

          <button
            onClick={() => setActiveTab('attendees')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attendees'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>รายชื่อผู้ลงทะเบียน ({totalRegistrations})</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'activities'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>จัดการกิจกรรม ({activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduleEditor')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scheduleEditor'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>แก้ไขกำหนดการ ({schedules.length})</span>
          </button>

          {currentAdmin.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admins'
                  ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>จัดการสิทธิ์ Admin ({admins.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('mapEditor')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mapEditor'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Map className="w-4 h-4 text-orange-500" />
            <span>แก้ไขแผนผังงาน ({mapBuildings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-white text-orange-600 border-t-2 border-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: OVERVIEW & PIE CHARTS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-blue-600 font-bold block mb-1">จำนวนการลงทะเบียนทั้งหมด</span>
                  <span className="text-3xl font-extrabold text-slate-900">{totalRegistrations} รายการ</span>
                  <span className="text-xs text-slate-500 block mt-1">รวมยอดผู้เข้าร่วมงาน {totalParticipantsSum} คน</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-orange-600 font-bold block mb-1">สแกนเช็คอินเข้างานแล้ว</span>
                  <span className="text-3xl font-extrabold text-orange-600">{totalCheckedIn} รายการ</span>
                  <span className="text-xs text-slate-500 block mt-1">
                    คิดเป็น {totalRegistrations ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0}% ของทั้งหมด
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-emerald-600 font-bold block mb-1">กิจกรรมและนิทรรศการ</span>
                  <span className="text-3xl font-extrabold text-emerald-600">{activities.length} กิจกรรม</span>
                  <span className="text-xs text-slate-500 block mt-1">เปิดรับลงทะเบียนการแข่งขันทางวิชาการ</span>
                </div>
              </div>

              {/* Pie Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Province Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    <span>เปรียบเทียบสัดส่วนผู้เข้าร่วมตามจังหวัด</span>
                  </h4>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={provincePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {provincePieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Status / Participant Type Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>เปรียบเทียบประเภทกลุ่มผู้เข้าร่วมงาน</span>
                  </h4>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#82ca9d"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusPieData.map((_, index) => (
                            <Cell key={`cell-status-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE SCANNER */}
          {activeTab === 'scanner' && (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                  <Camera className="w-6 h-6 text-orange-500" />
                  <span>สแกน QR Code ประจำตัวผู้เข้าร่วม</span>
                </h4>
                <p className="text-xs text-slate-600">
                  สแกนรหัสผ่านกล้อง หรือ พิมพ์รหัสผู้เข้าร่วม (เช่น <code className="text-orange-600 font-bold">PCSHS2026-1001</code>) เพื่อบันทึกข้อมูลการเข้างานทันที
                </p>
              </div>

              {/* Status Alert */}
              {scannerMessage && (
                <div
                  className={`p-4 rounded-xl border text-sm font-bold shadow-sm ${
                    scannerMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : scannerMessage.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {scannerMessage.text}
                </div>
              )}

              {/* Code Input Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  พิมพ์รหัสผู้เข้าร่วม (Participant Code) หรือ อีเมล
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedCodeInput}
                    onChange={(e) => setScannedCodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckIn(scannedCodeInput);
                        setScannedCodeInput('');
                      }
                    }}
                    placeholder="PCSHS2026-1001"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => {
                      handleCheckIn(scannedCodeInput);
                      setScannedCodeInput('');
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105"
                  >
                    บันทึกเช็คอิน
                  </button>
                </div>
              </div>


            </div>
          )}

          {/* TAB 3: ATTENDEES TABLE */}
          {activeTab === 'attendees' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร, สถาบัน..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export ข้อมูลผู้เข้าร่วม (CSV/Excel)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">รหัสประจำตัว</th>
                      <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                      <th className="px-4 py-3">สถาบัน / หน่วยงาน</th>
                      <th className="px-4 py-3">จังหวัด</th>
                      <th className="px-4 py-3">สถานภาพ</th>
                      <th className="px-4 py-3 text-center">จำนวนผู้ร่วม</th>
                      <th className="px-4 py-3 text-center">สถานะเช็คอิน</th>
                      <th className="px-4 py-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendees
                      .filter(
                        (a) =>
                          a.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.participantCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.organization.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-orange-600">
                            {att.participantCode}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {att.firstName} {att.lastName}
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {att.email} | {att.phone}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{att.organization}</td>
                          <td className="px-4 py-3 text-slate-700">{att.province}</td>
                          <td className="px-4 py-3 text-slate-700">{att.status}</td>
                          <td className="px-4 py-3 text-center font-bold text-amber-700">
                            {att.attendeeCount} คน
                          </td>
                          <td className="px-4 py-3 text-center">
                            {att.checkedIn ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                เช็คอินแล้ว
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium text-xs bg-slate-100 px-2.5 py-1 rounded-full">
                                ยังไม่เช็คอิน
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleCheckIn(att.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  att.checkedIn
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow'
                                }`}
                              >
                                {att.checkedIn ? 'ยกเลิก' : 'สแกนเข้างาน'}
                              </button>
                              <button
                                onClick={() => handleOpenDeleteAttendeeModal(att)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg text-xs font-bold border border-red-200/80 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                title="ลบข้อมูลผู้ลงทะเบียน (ต้องยืนยันรหัสผ่าน Super Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITIES MANAGEMENT */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">จัดการกิจกรรมและนิทรรศการภายในงาน</h4>
                  <p className="text-xs text-slate-500">
                    เพิ่ม ลบ หรือแก้ไขกิจกรรมได้ตลอดเวลา ข้อมูลจะอัปเดตไปแสดงผลที่หน้าแรกทันที
                  </p>
                </div>
                <button
                  onClick={() => handleOpenActivityModal()}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มกิจกรรมใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                          {act.code}
                        </span>
                        <span className="text-xs text-blue-600 font-bold">{act.department}</span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-base mb-1">{act.titleTh}</h5>
                      <p className="text-xs text-slate-500 italic font-mono mb-3">{act.titleEn}</p>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                        <p>• ระดับชั้น: <strong>{act.targetGrade}</strong></p>
                        <p>• รองรับ: <strong>{act.maxPerRound} คน/รอบ</strong> ({act.totalRounds} รอบ)</p>
                        <p>• ผู้ประสานงาน: <strong>{act.coordinator}</strong> ({act.phone})</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenActivityModal(act)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border border-blue-200"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id, act.code)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border border-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ADMINS MANAGEMENT (Super Admin Only) */}
          {activeTab === 'admins' && currentAdmin.role === 'super_admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">จัดการรายชื่อผู้ได้รับสิทธิ์ Admin</h4>
                  <p className="text-xs text-slate-500">
                    เพิ่มหรือถอนสิทธิ์อีเมลสำหรับสแกนเข้างานและจัดการข้อมูล
                  </p>
                </div>
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่ม Admin ใหม่</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                      <th className="px-4 py-3">อีเมล</th>
                      <th className="px-4 py-3">บทบาท</th>
                      <th className="px-4 py-3">วันที่เพิ่ม</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-orange-600">
                          {adm.username}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{adm.name}</td>
                        <td className="px-4 py-3 text-slate-600">{adm.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              adm.role === 'super_admin'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {adm.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{adm.createdAt}</td>
                        <td className="px-4 py-3 text-right">
                          {adm.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                              className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SCHEDULE EDITOR */}
          {activeTab === 'scheduleEditor' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <span>จัดการกำหนดการจัดงานประจำวัน</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    เพิ่ม แก้ไข หรือลบกำหนดการกิจกรรม ตารางเวลา พิธีการ นิทรรศการ และสถานที่จัดงาน
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewSchedule({
                      time: '08:30 - 09:30 น.',
                      title: '',
                      location: 'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย เลย',
                      description: '',
                      category: 'กิจกรรม',
                    });
                    setEditingScheduleIndex(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ล้างฟอร์มเพิ่มช่วงเวลาใหม่</span>
                </button>
              </div>

              {/* Form Box */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-500" />
                  <span>{editingScheduleIndex !== null ? 'แก้ไขกำหนดการช่วงเวลา' : 'ฟอร์มเพิ่มกำหนดการใหม่'}</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ช่วงเวลา (Time)</label>
                    <input
                      type="text"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                      placeholder="เช่น 08:30 - 09:30 น."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ประเภทกิจกรรม (Category)</label>
                    <select
                      value={newSchedule.category}
                      onChange={(e) => setNewSchedule({ ...newSchedule, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="พิธีการ">พิธีการ</option>
                      <option value="นิทรรศการ">นิทรรศการ</option>
                      <option value="กิจกรรม">กิจกรรม</option>
                      <option value="การแข่งขัน">การแข่งขัน</option>
                      <option value="พักผ่อน">พักผ่อน</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">สถานที่จัดกิจกรรม (Location)</label>
                    <input
                      type="text"
                      value={newSchedule.location}
                      onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
                      placeholder="เช่น หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย เลย"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">หัวข้อย่อย / ชื่องาน (Title)</label>
                    <input
                      type="text"
                      value={newSchedule.title}
                      onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                      placeholder="เช่น พิธีเปิด PCSHS Loei Open House 2026"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">คำอธิบายรายละเอียด (Description)</label>
                    <input
                      type="text"
                      value={newSchedule.description}
                      onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                      placeholder="รายละเอียดการดำเนินกิจกรรมสังเขป..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  {editingScheduleIndex !== null && (
                    <button
                      onClick={() => {
                        setEditingScheduleIndex(null);
                        setNewSchedule({
                          time: '08:30 - 09:30 น.',
                          title: '',
                          location: '',
                          description: '',
                          category: 'กิจกรรม',
                        });
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!newSchedule.time || !newSchedule.title) {
                        alert('กรุณากรอกช่วงเวลาและหัวข้อกิจกรรม');
                        return;
                      }
                      if (editingScheduleIndex !== null) {
                        const updated = [...schedules];
                        const itemToSave = { ...updated[editingScheduleIndex], ...newSchedule };
                        updated[editingScheduleIndex] = itemToSave;
                        setSchedules(updated);
                        await saveScheduleToFirestore(itemToSave);
                        addAuditLog('แก้ไขกำหนดการ', `ปรับปรุงกำหนดการ: ${newSchedule.title}`);
                      } else {
                        const newItem = {
                          id: `sch_${Date.now()}`,
                          ...newSchedule,
                        };
                        const updated = [...schedules, newItem];
                        setSchedules(updated);
                        await saveScheduleToFirestore(newItem);
                        addAuditLog('เพิ่มกำหนดการใหม่', `เพิ่มกำหนดการ: ${newSchedule.title}`);
                      }
                      setEditingScheduleIndex(null);
                      setNewSchedule({
                        time: '08:30 - 09:30 น.',
                        title: '',
                        location: '',
                        description: '',
                        category: 'กิจกรรม',
                      });
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    {editingScheduleIndex !== null ? 'บันทึกการแก้ไข' : 'เพิ่มกำหนดการ'}
                  </button>
                </div>
              </div>

              {/* Schedule Items List */}
              <div className="space-y-3">
                {schedules.map((sch, idx) => (
                  <div
                    key={sch.id || idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sch.time}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {sch.category}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                          {sch.location}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm sm:text-base">{sch.title}</h5>
                      {sch.description && <p className="text-xs text-slate-600">{sch.description}</p>}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          setEditingScheduleIndex(idx);
                          setNewSchedule({ ...sch });
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-colors text-xs font-bold flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`คุณต้องการลบกำหนดการ "${sch.title}" ใช่หรือไม่?`)) {
                            const updated = schedules.filter((_, i) => i !== idx);
                            setSchedules(updated);
                            if (sch.id) {
                              await deleteScheduleFromFirestore(sch.id);
                            }
                            addAuditLog('ลบกำหนดการ', `ลบกำหนดการ: ${sch.title}`);
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl cursor-pointer transition-colors text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MAP EDITOR */}
          {activeTab === 'mapEditor' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Map className="w-5 h-5 text-orange-500" />
                    <span>จัดการแผนผังงานและจุดจัดกิจกรรม</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    ปรับแต่งข้อมูลอาคาร โซนกิจกรรม รายละเอียด และตำแหน่งพิกัดแผนผังสำหรับแสดงในหน้าเว็บหลัก
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewBuilding({ name: '', desc: '', zone: '' });
                    setEditingBuildingId(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มอาคาร/จุดกิจกรรมใหม่</span>
                </button>
              </div>

              {/* Add/Edit Form Box */}
              <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-4">
                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-orange-500" />
                  <span>{editingBuildingId ? 'แก้ไขข้อมูลอาคาร' : 'ฟอร์มเพิ่มอาคาร/โซนใหม่'}</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ชื่ออาคาร / สถานที่</label>
                    <input
                      type="text"
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                      placeholder="เช่น อาคารปฏิบัติการวิทยาศาสตร์ 3"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ชื่อโซน / ฝั่งสถานที่</label>
                    <input
                      type="text"
                      value={newBuilding.zone}
                      onChange={(e) => setNewBuilding({ ...newBuilding, zone: e.target.value })}
                      placeholder="เช่น โซน F - อาคารเรียนรวม"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">รายละเอียดกิจกรรมในอาคาร</label>
                    <input
                      type="text"
                      value={newBuilding.desc}
                      onChange={(e) => setNewBuilding({ ...newBuilding, desc: e.target.value })}
                      placeholder="เช่น นิทรรศการนวัตกรรม และการแข่งขันหุ่นยนต์"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {editingBuildingId && (
                    <button
                      onClick={() => {
                        setEditingBuildingId(null);
                        setNewBuilding({ name: '', desc: '', zone: '' });
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!newBuilding.name || !newBuilding.zone) {
                        alert('กรุณากรอกชื่ออาคารและโซนสถานที่');
                        return;
                      }
                      if (editingBuildingId) {
                        setMapBuildings(
                          mapBuildings.map((b) =>
                            b.id === editingBuildingId ? { ...b, ...newBuilding } : b
                          )
                        );
                        addAuditLog('แก้ไขแผนผังงาน', `ปรับปรุงข้อมูลอาคาร ${newBuilding.name}`);
                      } else {
                        const newB = {
                          id: `b-${Date.now()}`,
                          ...newBuilding,
                        };
                        setMapBuildings([...mapBuildings, newB]);
                        addAuditLog('เพิ่มแผนผังอาคาร', `เพิ่มอาคารใหม่ ${newBuilding.name}`);
                      }
                      setEditingBuildingId(null);
                      setNewBuilding({ name: '', desc: '', zone: '' });
                    }}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    {editingBuildingId ? 'บันทึกการแก้ไข' : 'เพิ่มจุดจัดกิจกรรม'}
                  </button>
                </div>
              </div>

              {/* Buildings List Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">โซน / ฝั่ง</th>
                      <th className="px-4 py-3">ชื่ออาคาร / สถานที่</th>
                      <th className="px-4 py-3">รายละเอียดกิจกรรม</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mapBuildings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-blue-600 whitespace-nowrap">{b.zone}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{b.name}</td>
                        <td className="px-4 py-3 text-slate-600">{b.desc}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => {
                              setEditingBuildingId(b.id);
                              setNewBuilding({ name: b.name, desc: b.desc, zone: b.zone });
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`ต้องการลบอาคาร "${b.name}" ออกจากแผนผังหรือไม่?`)) {
                                setMapBuildings(mapBuildings.filter((item) => item.id !== b.id));
                                addAuditLog('ลบอาคารแผนผัง', `ลบอาคาร ${b.name}`);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-500" />
                  <span>ประวัติการแก้ไขข้อมูล (Audit Logs)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  บันทึกประวัติการเปลี่ยนแปลงข้อมูล การสแกนเข้างาน และการปรับเปลี่ยนสิทธิ์ระบบ
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">เวลา</th>
                      <th className="px-4 py-3">ผู้ดำเนินการ</th>
                      <th className="px-4 py-3">การกระทำ (Action)</th>
                      <th className="px-4 py-3">รายละเอียด (Details)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{log.actor}</td>
                        <td className="px-4 py-3 font-bold text-orange-600">{log.action}</td>
                        <td className="px-4 py-3 text-slate-700">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Add Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-bold text-slate-900 mb-4">เพิ่มผู้ดูแลระบบ (Admin) ใหม่</h4>
            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                  placeholder="เช่น admin04"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  placeholder="เช่น ครูสมชาย ใจดี"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  placeholder="admin04@pcshsloei.ac.th"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow cursor-pointer"
              >
                บันทึกแอดมินใหม่
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Activity Add/Edit Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
            <button
              onClick={() => setShowActivityModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-bold text-slate-900 mb-4">
              {editingActivityId ? 'แก้ไขข้อมูลกิจกรรม' : 'เพิ่มกิจกรรมภายในงานใหม่'}
            </h4>
            <form onSubmit={handleSaveActivity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รหัสกิจกรรม</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.code}
                    onChange={(e) => setActivityFormData({ ...activityFormData, code: e.target.value })}
                    placeholder="SCI-PHYS-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ฝ่ายงาน/สาขา</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.department}
                    onChange={(e) => setActivityFormData({ ...activityFormData, department: e.target.value })}
                    placeholder="สาขาฟิสิกส์"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อกิจกรรม (ภาษาไทย)</label>
                <input
                  type="text"
                  required
                  value={activityFormData.titleTh}
                  onChange={(e) => setActivityFormData({ ...activityFormData, titleTh: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อกิจกรรม (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  required
                  value={activityFormData.titleEn}
                  onChange={(e) => setActivityFormData({ ...activityFormData, titleEn: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ระดับชั้นที่เข้าร่วม</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.targetGrade}
                    onChange={(e) => setActivityFormData({ ...activityFormData, targetGrade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รองรับต่อรอบ (คน)</label>
                  <input
                    type="number"
                    required
                    value={activityFormData.maxPerRound}
                    onChange={(e) => setActivityFormData({ ...activityFormData, maxPerRound: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนรอบ</label>
                  <input
                    type="number"
                    required
                    value={activityFormData.totalRounds}
                    onChange={(e) => setActivityFormData({ ...activityFormData, totalRounds: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ครูผู้ประสานงาน</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.coordinator}
                    onChange={(e) => setActivityFormData({ ...activityFormData, coordinator: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    required
                    value={activityFormData.phone}
                    onChange={(e) => setActivityFormData({ ...activityFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ลิงก์แบบฟอร์มลงทะเบียนการแข่งขัน</label>
                <input
                  type="url"
                  required
                  value={activityFormData.registerUrl}
                  onChange={(e) => setActivityFormData({ ...activityFormData, registerUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow cursor-pointer mt-2"
              >
                บันทึกกิจกรรม
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Password Verification Modal for Deleting Attendee */}
      {deletingAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white border border-red-200 rounded-3xl p-6 shadow-2xl text-slate-900 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setDeletingAttendee(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-2xl shrink-0">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  ยืนยันการลบข้อมูลผู้ลงทะเบียน
                </h3>
                <p className="text-xs text-red-600 font-semibold">
                  (ต้องใส่รหัสผ่าน Super Admin เพื่อดำเนินการ)
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs space-y-1.5">
              <p className="text-slate-500 font-medium">ผู้ลงทะเบียนที่จะถูกลบ:</p>
              <p className="text-slate-900 font-bold text-sm">
                {deletingAttendee.firstName} {deletingAttendee.lastName}
              </p>
              <p className="text-slate-600 font-mono">
                รหัสประจำตัว: <span className="text-orange-600 font-bold">{deletingAttendee.participantCode}</span>
              </p>
              <p className="text-slate-600">
                หน่วยงาน: {deletingAttendee.organization} ({deletingAttendee.province})
              </p>
              <p className="text-slate-600">
                อีเมล / เบอร์โทร: {deletingAttendee.email} | {deletingAttendee.phone}
              </p>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              ⚠️ การลบนี้จะลบข้อมูลออกจากระบบและฐานข้อมูล Firebase (<code className="font-mono text-orange-600 font-bold">PCSHS-Loei-Open-House-2026-db</code>) อย่างถาวร ไม่สามารถกู้คืนได้
            </p>

            {superAdminPasswordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {superAdminPasswordError}
              </div>
            )}

            <form onSubmit={handleConfirmDeleteAttendee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  กรอกรหัสผ่าน Super Admin
                </label>
                <div className="relative">
                  <input
                    type={showSuperAdminPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={superAdminPasswordInput}
                    onChange={(e) => {
                      setSuperAdminPasswordInput(e.target.value);
                      setSuperAdminPasswordError('');
                    }}
                    placeholder="กรอกรหัสผ่าน Super Admin..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSuperAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingAttendee(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบข้อมูลผู้ลงทะเบียน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
