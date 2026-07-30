import React, { useState, useEffect } from 'react';
import { ActivityItem, AdminRole, AdminUser, Attendee, AuditLog, ScheduleItem } from '../types';
import {
  saveAttendeeToFirestore,
  deleteAttendeeFromFirestore,
  saveAdminToFirestore,
  deleteAdminFromFirestore,
  saveActivityToFirestore,
  saveAllActivitiesToFirestore,
  deleteActivityFromFirestore,
  saveMapBuildingToFirestore,
  deleteMapBuildingFromFirestore,
  saveScheduleToFirestore,
  deleteScheduleFromFirestore,
  testFirebaseConnection,
  FirebaseConnectionTestResult,
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
  Upload,
  FileUp,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Database,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
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
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminFormData, setAdminFormData] = useState<{
    username: string;
    name: string;
    email: string;
    role: AdminRole;
  }>({ username: '', name: '', email: '', role: 'admin' });

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

  // Activity CSV Import & Template State
  const [showActivityCsvModal, setShowActivityCsvModal] = useState(false);
  const [importedCsvActivities, setImportedCsvActivities] = useState<ActivityItem[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvImportMode, setCsvImportMode] = useState<'append' | 'replace'>('append');
  const [csvParseError, setCsvParseError] = useState<string | null>(null);

  // Delete Attendee (Super Admin Password Required) state
  const [deletingAttendee, setDeletingAttendee] = useState<Attendee | null>(null);
  const [superAdminPasswordInput, setSuperAdminPasswordInput] = useState('');
  const [superAdminPasswordError, setSuperAdminPasswordError] = useState('');
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);

  // Firebase Connection Test state
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<FirebaseConnectionTestResult | null>(null);

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirebaseConnection();
      setFirebaseTestResult(res);
      addAuditLog(
        'ทดสอบการเชื่อมต่อ Firebase',
        `ผลการทดสอบการเชื่อมต่อฐานข้อมูล Firebase: ${res.success ? 'สำเร็จ (' + res.latencyMs + 'ms)' : 'ล้มเหลว (' + res.message + ')'}`
      );
    } catch (err: any) {
      console.error("Firebase connection test error:", err);
      setFirebaseTestResult({
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุในการเชื่อมต่อ',
        projectId: 'N/A',
        databaseId: '(default)',
        latencyMs: 0,
        testedAt: new Date().toLocaleString('th-TH'),
        canRead: false,
        canWrite: false,
      });
    } finally {
      setIsTestingFirebase(false);
    }
  };

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

  // Open Admin Modal for Add/Edit
  const handleOpenAdminModal = (adm?: AdminUser) => {
    if (adm) {
      setEditingAdminId(adm.id);
      setAdminFormData({
        username: adm.username,
        name: adm.name,
        email: adm.email,
        role: adm.role,
      });
    } else {
      setEditingAdminId(null);
      setAdminFormData({
        username: '',
        name: '',
        email: '',
        role: 'admin',
      });
    }
    setShowAdminModal(true);
  };

  // Add/Edit Admin (Super Admin only)
  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.username || !adminFormData.name || !adminFormData.email) return;

    if (editingAdminId) {
      let updatedAdminItem: AdminUser | null = null;
      const updatedList = admins.map((a) => {
        if (a.id === editingAdminId) {
          updatedAdminItem = {
            ...a,
            username: adminFormData.username.trim(),
            name: adminFormData.name.trim(),
            email: adminFormData.email.trim(),
            role: adminFormData.role,
          };
          return updatedAdminItem;
        }
        return a;
      });
      setAdmins(updatedList);
      if (updatedAdminItem) {
        saveAdminToFirestore(updatedAdminItem);
      }
      addAuditLog(
        'แก้ไขข้อมูล Admin',
        `ปรับปรุงข้อมูลแอดมิน (${adminFormData.username} - ${adminFormData.name}, บทบาท: ${adminFormData.role})`
      );
    } else {
      const newAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        username: adminFormData.username.trim(),
        name: adminFormData.name.trim(),
        email: adminFormData.email.trim(),
        role: adminFormData.role,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      setAdmins([...admins, newAdmin]);
      saveAdminToFirestore(newAdmin);
      addAuditLog('เพิ่ม Admin', `เพิ่มแอดมินใหม่ (${newAdmin.username} - ${newAdmin.name})`);
    }

    setShowAdminModal(false);
    setEditingAdminId(null);
    setAdminFormData({ username: '', name: '', email: '', role: 'admin' });
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

  // --- ACTIVITY CSV TEMPLATE DOWNLOAD & FILE IMPORT ---
  const handleDownloadActivityCSVTemplate = () => {
    const headers = [
      'รหัสกิจกรรม',
      'ฝ่ายงาน/สาขา',
      'ชื่อกิจกรรม (ไทย)',
      'ชื่อกิจกรรม (อังกฤษ)',
      'ระดับชั้นที่เข้าร่วม',
      'รองรับต่อรอบ (คน)',
      'จำนวนรอบ',
      'ผู้ประสานงาน',
      'เบอร์โทรศัพท์',
      'ลิงก์ลงทะเบียน',
      'สถานที่จัดงาน',
      'ช่วงเวลา',
    ];

    const sampleRows = [
      [
        'SCI-PHYS-01',
        'สาขาฟิสิกส์',
        'การแข่งขันสิ่งประดิษฐ์ทางฟิสิกส์',
        'Physics Innovation Competition',
        'ม.1 - ม.6',
        '30',
        '3',
        'ครูสมชาย ใจดี',
        '0812345678',
        'https://forms.gle/pcshsloei-phys',
        'อาคารปฏิบัติการฟิสิกส์ ชั้น 2',
        '09:00 - 15:30 น.',
      ],
      [
        'SCI-CHEM-01',
        'สาขาเคมี',
        'การทดลองปฏิกิริยาเคมีเรืองแสง',
        'Luminescent Chemical Reactions',
        'ม.3 - ม.6',
        '25',
        '4',
        'ครูวิภาดา สุขใจ',
        '0898765432',
        'https://forms.gle/pcshsloei-chem',
        'อาคารปฏิบัติการเคมี ชั้น 1',
        '09:00 - 15:00 น.',
      ],
      [
        'ICT-ROBO-01',
        'สาขาคอมพิวเตอร์และเทคโนโลยี',
        'การแข่งขันหุ่นยนต์กู้ภัยสับปะรด',
        'Rescue Robot Challenge',
        'ม.1 - ม.6',
        '20',
        '5',
        'ครูธนกร มั่นคง',
        '0861112233',
        'https://forms.gle/pcshsloei-robo',
        'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย',
        '08:30 - 16:00 น.',
      ],
    ];

    let csvContent = '\uFEFF'; // UTF-8 BOM for Thai Excel compatibility
    csvContent += headers.join(',') + '\n';
    sampleRows.forEach((row) => {
      const escapedRow = row.map((field) => `"${String(field).replace(/"/g, '""')}"`);
      csvContent += escapedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'PCSHS_Loei_Activity_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleActivityFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setCsvParseError('ไฟล์ CSV ว่างเปล่า กรุณาตรวจสอบข้อมูลในไฟล์');
          return;
        }

        const parseCSVRows = (rawText: string): string[][] => {
          const result: string[][] = [];
          let row: string[] = [];
          let cur = '';
          let inQuotes = false;

          let cleanText = rawText;
          if (cleanText.charCodeAt(0) === 0xFEFF) {
            cleanText = cleanText.slice(1);
          }

          for (let i = 0; i < cleanText.length; i++) {
            const char = cleanText[i];
            const nextChar = cleanText[i + 1];

            if (inQuotes) {
              if (char === '"' && nextChar === '"') {
                cur += '"';
                i++;
              } else if (char === '"') {
                inQuotes = false;
              } else {
                cur += char;
              }
            } else {
              if (char === '"') {
                inQuotes = true;
              } else if (char === ',') {
                row.push(cur.trim());
                cur = '';
              } else if (char === '\r') {
                // skip CR
              } else if (char === '\n') {
                row.push(cur.trim());
                if (row.some((f) => f.length > 0)) {
                  result.push(row);
                }
                row = [];
                cur = '';
              } else {
                cur += char;
              }
            }
          }

          if (cur.length > 0 || row.length > 0) {
            row.push(cur.trim());
            if (row.some((f) => f.length > 0)) {
              result.push(row);
            }
          }

          return result;
        };

        const rows = parseCSVRows(text);
        if (rows.length < 2) {
          setCsvParseError('ไฟล์ CSV ต้องมีอย่างน้อยแถวหัวข้อ (Header) และข้อมูลอย่างน้อย 1 แถว');
          return;
        }

        const headerRow = rows[0];
        const dataRows = rows.slice(1);

        const normalizeHeader = (header: string): string => {
          const h = header.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
          if (h.includes('รหัส') || h.includes('code')) return 'code';
          if (h.includes('ฝ่าย') || h.includes('สาขา') || h.includes('department')) return 'department';
          if (h.includes('ไทย') || (h.includes('ชื่อ') && !h.includes('อังกฤษ') && !h.includes('eng')) || h.includes('titleth')) return 'titleTh';
          if (h.includes('อังกฤษ') || h.includes('eng') || h.includes('titleen')) return 'titleEn';
          if (h.includes('ระดับ') || h.includes('ชั้น') || h.includes('grade')) return 'targetGrade';
          if (h.includes('รองรับ') || h.includes('ต่อรอบ') || h.includes('max')) return 'maxPerRound';
          if (h.includes('รอบ') || h.includes('rounds')) return 'totalRounds';
          if (h.includes('ผู้ประสานงาน') || h.includes('ครู') || h.includes('coordinator')) return 'coordinator';
          if (h.includes('เบอร์') || h.includes('โทร') || h.includes('phone')) return 'phone';
          if (h.includes('ลิงก์') || h.includes('ฟอร์ม') || h.includes('register') || h.includes('url')) return 'registerUrl';
          if (h.includes('สถานที่') || h.includes('อาคาร') || h.includes('location')) return 'location';
          if (h.includes('ช่วงเวลา') || h.includes('เวลา') || h.includes('time')) return 'timeSlot';
          return '';
        };

        const colKeys = headerRow.map(normalizeHeader);

        const parsedActivities: ActivityItem[] = [];

        dataRows.forEach((row, idx) => {
          let code = '';
          let department = '';
          let titleTh = '';
          let titleEn = '';
          let targetGrade = '';
          let maxPerRound = 30;
          let totalRounds = 3;
          let coordinator = '';
          let phone = '';
          let registerUrl = '';
          let location = '';
          let timeSlot = '';

          row.forEach((val, colIdx) => {
            const key = colKeys[colIdx];
            if (key === 'code') code = val;
            else if (key === 'department') department = val;
            else if (key === 'titleTh') titleTh = val;
            else if (key === 'titleEn') titleEn = val;
            else if (key === 'targetGrade') targetGrade = val;
            else if (key === 'maxPerRound') maxPerRound = parseInt(val, 10) || 30;
            else if (key === 'totalRounds') totalRounds = parseInt(val, 10) || 3;
            else if (key === 'coordinator') coordinator = val;
            else if (key === 'phone') phone = val;
            else if (key === 'registerUrl') registerUrl = val;
            else if (key === 'location') location = val;
            else if (key === 'timeSlot') timeSlot = val;
          });

          if (!code && row[0]) code = row[0];
          if (!department && row[1]) department = row[1];
          if (!titleTh && row[2]) titleTh = row[2];
          if (!titleEn && row[3]) titleEn = row[3];
          if (!targetGrade && row[4]) targetGrade = row[4];
          if (row[5] && isNaN(maxPerRound)) maxPerRound = parseInt(row[5], 10) || 30;
          if (row[6] && isNaN(totalRounds)) totalRounds = parseInt(row[6], 10) || 3;
          if (!coordinator && row[7]) coordinator = row[7];
          if (!phone && row[8]) phone = row[8];
          if (!registerUrl && row[9]) registerUrl = row[9];
          if (!location && row[10]) location = row[10];
          if (!timeSlot && row[11]) timeSlot = row[11];

          if (!code) code = `ACT-${String(idx + 1).padStart(2, '0')}`;
          if (!department) department = 'วิชาการทั่วไป';
          if (!titleTh) titleTh = `กิจกรรม ${code}`;
          if (!titleEn) titleEn = `Activity ${code}`;
          if (!targetGrade) targetGrade = 'ม.1 - ม.6';
          if (!coordinator) coordinator = 'ครูผู้ดูแลกิจกรรม';
          if (!phone) phone = '042-811-xxx';
          if (!registerUrl) registerUrl = 'https://forms.gle/pcshsloei-activity';
          if (!location) location = 'อาคารปฏิบัติการวิทยาศาสตร์';
          if (!timeSlot) timeSlot = '09:00 - 15:30 น.';

          parsedActivities.push({
            id: `act-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            code: code.trim(),
            department: department.trim(),
            titleTh: titleTh.trim(),
            titleEn: titleEn.trim(),
            targetGrade: targetGrade.trim(),
            maxPerRound: maxPerRound || 30,
            totalRounds: totalRounds || 3,
            coordinator: coordinator.trim(),
            phone: phone.trim(),
            registerUrl: registerUrl.trim(),
            location: location.trim(),
            timeSlot: timeSlot.trim(),
          });
        });

        if (parsedActivities.length === 0) {
          setCsvParseError('ไม่สามารถดึงข้อมูลกิจกรรมจากไฟล์นี้ได้ กรุณาตรวจสอบรูปแบบไฟล์ CSV');
          return;
        }

        setImportedCsvActivities(parsedActivities);
      } catch (err: any) {
        console.error('CSV Parsing Error:', err);
        setCsvParseError('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + (err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'));
      }
    };

    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmImportActivities = async () => {
    if (importedCsvActivities.length === 0) return;

    let newActivitiesList: ActivityItem[] = [];
    if (csvImportMode === 'replace') {
      newActivitiesList = [...importedCsvActivities];
    } else {
      const existingCodes = new Set(activities.map((a) => a.code));
      const dedupedImport = importedCsvActivities.map((act) => {
        if (existingCodes.has(act.code)) {
          return { ...act, code: `${act.code}_NEW` };
        }
        return act;
      });
      newActivitiesList = [...activities, ...dedupedImport];
    }

    setActivities(newActivitiesList);
    await saveAllActivitiesToFirestore(importedCsvActivities);

    addAuditLog(
      'นำเข้ากิจกรรมผ่าน CSV',
      `นำเข้าข้อมูลกิจกรรมจำนวน ${importedCsvActivities.length} รายการ จากไฟล์ "${csvFileName}" (โหมด: ${
        csvImportMode === 'replace' ? 'แทนที่ทั้งหมด' : 'เพิ่มสมทบ'
      })`
    );

    setShowActivityCsvModal(false);
    setImportedCsvActivities([]);
    setCsvFileName('');
    setCsvParseError(null);
    alert(`🎉 นำเข้าข้อมูลกิจกรรมสำเร็จจำนวน ${importedCsvActivities.length} รายการ!`);
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

          <div className="flex items-center gap-2">
            {currentAdmin.role === 'super_admin' && (
              <button
                onClick={handleTestFirebase}
                disabled={isTestingFirebase}
                title="ทดสอบสถานะการเชื่อมต่อฐานข้อมูล Firebase"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all hover:scale-105 active:scale-95 border border-orange-400/40"
              >
                <Database className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                <span>{isTestingFirebase ? 'กำลังทดสอบ...' : 'เช็คสถานะ Firebase'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900 text-base sm:text-lg">จัดการกิจกรรมและนิทรรศการภายในงาน</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เพิ่ม ลบ แก้ไข หรือนำเข้าข้อมูลกิจกรรมผ่านไฟล์ .CSV ข้อมูลจะอัปเดตไปแสดงผลที่หน้าแรกทันที
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadActivityCSVTemplate}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    title="ดาวน์โหลดไฟล์แบบฟอร์ม .CSV สำหรับนำไปกรอกข้อมูลกิจกรรม"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ดาวน์โหลดแบบฟอร์ม .CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityCsvModal(true);
                      setImportedCsvActivities([]);
                      setCsvParseError(null);
                    }}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    title="อัปโหลดไฟล์ .CSV เพื่อนำเข้ากิจกรรมเข้าสู่ระบบ"
                  >
                    <FileUp className="w-4 h-4 text-blue-600" />
                    <span>นำเข้ากิจกรรม (.CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenActivityModal()}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มกิจกรรมใหม่</span>
                  </button>
                </div>
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
            <div className="space-y-5">
              {/* FIREBASE DATABASE TEST SECTION FOR SUPER ADMIN */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                        <span>ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล Firebase</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300">
                          Firestore Database
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        ทดสอบรับ-ส่งข้อมูล (Ping Read/Write) เพื่อตรวจสอบสถานะการเชื่อมต่อแบบเรียลไทม์ระหว่างระบบและ Firebase
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestFirebase}
                    disabled={isTestingFirebase}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-orange-400/40 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                    <span>{isTestingFirebase ? 'กำลังทดสอบการเชื่อมต่อ...' : 'ทดสอบสถานะการเชื่อมต่อ Firebase'}</span>
                  </button>
                </div>

                {/* Display Test Result */}
                {firebaseTestResult ? (
                  <div
                    className={`p-4 rounded-xl border text-xs sm:text-sm space-y-3 ${
                      firebaseTestResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-base">
                      <div className="flex items-center gap-2">
                        {firebaseTestResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                        <span>
                          {firebaseTestResult.success
                            ? 'เชื่อมต่อฐานข้อมูลสำเร็จ (Connected)'
                            : 'การเชื่อมต่อล้มเหลว (Disconnected)'}
                        </span>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 bg-black/40 rounded-lg text-amber-300 border border-white/10">
                        Latency: {firebaseTestResult.latencyMs} ms
                      </span>
                    </div>

                    <p className="text-xs opacity-90 leading-relaxed">{firebaseTestResult.message}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-sans">Project ID</span>
                        <span className="font-bold text-amber-300 truncate block" title={firebaseTestResult.projectId}>
                          {firebaseTestResult.projectId}
                        </span>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-sans">Database ID</span>
                        <span className="font-bold text-blue-300 truncate block" title={firebaseTestResult.databaseId}>
                          {firebaseTestResult.databaseId}
                        </span>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-sans">สิทธิ์การอ่าน (Read)</span>
                        <span className={`font-bold block ${firebaseTestResult.canRead ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {firebaseTestResult.canRead ? '✅ อ่านข้อมูลได้' : '❌ อ่านไม่ได้'}
                        </span>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-slate-400 block font-sans">สิทธิ์การเขียน (Write)</span>
                        <span className={`font-bold block ${firebaseTestResult.canWrite ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {firebaseTestResult.canWrite ? '✅ เขียนข้อมูลได้' : '❌ เขียนไม่ได้'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>เวลาทดสอบล่าสุด: {firebaseTestResult.testedAt}</span>
                      {firebaseTestResult.errorDetail && (
                        <span className="text-rose-300 font-mono text-[10px] truncate max-w-[300px]">
                          Error: {firebaseTestResult.errorDetail}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-orange-400" />
                      <span>กดปุ่มข้างต้นเพื่อทดสอบการปิงสัญญาณ (Ping Read/Write Test) ไปยัง Firebase Firestore</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Status: พร้อมทดสอบ</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">จัดการรายชื่อผู้ได้รับสิทธิ์ Admin</h4>
                  <p className="text-xs text-slate-500">
                    เพิ่มหรือถอนสิทธิ์อีเมลสำหรับสแกนเข้างานและจัดการข้อมูล
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAdminModal()}
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
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAdminModal(adm)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 font-bold text-xs"
                            title="แก้ไขข้อมูล Admin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                          {adm.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                              className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 font-bold text-xs"
                              title="ลบ Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-lg font-bold text-slate-900 mb-4 pr-8">
              {editingAdminId ? 'แก้ไขข้อมูลผู้ดูแลระบบ (Admin)' : 'เพิ่มผู้ดูแลระบบ (Admin) ใหม่'}
            </h4>
            <form onSubmit={handleSaveAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={adminFormData.username}
                  onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                  placeholder="เช่น admin04"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none focus:border-orange-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none focus:border-orange-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">บทบาทสิทธิ์การใช้งาน (Role)</label>
                <select
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value as AdminRole })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="admin">admin (ผู้ดูแลระบบทั่วไป / สแกนเช็คอิน)</option>
                  <option value="super_admin">super_admin (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
              >
                {editingAdminId ? 'บันทึกการแก้ไขข้อมูล Admin' : 'บันทึกแอดมินใหม่'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Activity Add/Edit Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
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

      {/* Activity CSV Upload Modal */}
      {showActivityCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowActivityCsvModal(false);
                setImportedCsvActivities([]);
                setCsvParseError(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shrink-0">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  นำเข้ากิจกรรมด้วยไฟล์ .CSV
                </h4>
                <p className="text-xs text-slate-500">
                  อัปโหลดไฟล์ข้อมูลกิจกรรม หรือดาวน์โหลดแบบฟอร์มแม่แบบเพื่อนำไปกรอกข้อมูล
                </p>
              </div>
            </div>

            {/* Quick Template Download Banner inside Modal */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 text-amber-900">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">ยังไม่มีแบบฟอร์มไฟล์ CSV?</p>
                  <p className="text-slate-600">ดาวน์โหลดแบบฟอร์มแม่แบบ .CSV ที่มีหัวข้อคอลัมน์ถูกต้องพร้อมตัวอย่างข้อมูล</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadActivityCSVTemplate}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดแบบฟอร์ม (.CSV)</span>
              </button>
            </div>

            {/* Upload Area */}
            {importedCsvActivities.length === 0 ? (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/80 hover:bg-orange-50/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm mb-1">
                    คลิกเพื่อเลือกไฟล์ .CSV หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-500">
                    รองรับไฟล์ประเภท .csv (บันทึกด้วยรหัส UTF-8)
                  </p>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleActivityFileUpload}
                    className="hidden"
                  />
                </label>

                {csvParseError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{csvParseError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Preview Area */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      อ่านไฟล์ <strong className="font-mono">{csvFileName}</strong> สำเร็จ! พบทั้งหมด{' '}
                      <strong className="text-emerald-700 text-sm">{importedCsvActivities.length}</strong> กิจกรรม
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedCsvActivities([]);
                      setCsvFileName('');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                  >
                    เลือกไฟล์อื่น
                  </button>
                </div>

                {/* Import Mode Selection */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-2">
                  <label className="block font-bold text-slate-800">เลือกโหมดการนำเข้าข้อมูล:</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={csvImportMode === 'append'}
                        onChange={() => setCsvImportMode('append')}
                        className="text-orange-500 focus:ring-orange-400"
                      />
                      <span className="font-medium text-slate-700">เพิ่มสมทบเข้ากับกิจกรรมเดิม (Append)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={csvImportMode === 'replace'}
                        onChange={() => setCsvImportMode('replace')}
                        className="text-orange-500 focus:ring-orange-400"
                      />
                      <span className="font-medium text-slate-700">แทนที่กิจกรรมทั้งหมดด้วยไฟล์นี้ (Replace All)</span>
                    </label>
                  </div>
                </div>

                {/* Preview Table */}
                <div>
                  <h5 className="font-bold text-xs text-slate-700 mb-2">ตัวอย่างกิจกรรมที่จะถูกนำเข้า ({importedCsvActivities.length} รายการ):</h5>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">รหัส</th>
                          <th className="px-3 py-2">ฝ่ายงาน</th>
                          <th className="px-3 py-2">ชื่อกิจกรรม (ไทย)</th>
                          <th className="px-3 py-2">ระดับชั้น</th>
                          <th className="px-3 py-2">ผู้ประสานงาน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importedCsvActivities.map((act, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono font-bold text-orange-600">{act.code}</td>
                            <td className="px-3 py-2 text-slate-600">{act.department}</td>
                            <td className="px-3 py-2 font-semibold text-slate-900">{act.titleTh}</td>
                            <td className="px-3 py-2 text-slate-600">{act.targetGrade}</td>
                            <td className="px-3 py-2 text-slate-600">{act.coordinator} ({act.phone})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityCsvModal(false);
                      setImportedCsvActivities([]);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImportActivities}
                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>ยืนยันนำเข้าข้อมูล {importedCsvActivities.length} กิจกรรม</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Super Admin Password Verification Modal for Deleting Attendee */}
      {deletingAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-white border border-red-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
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
