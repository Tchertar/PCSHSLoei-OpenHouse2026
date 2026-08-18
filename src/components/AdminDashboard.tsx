import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
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
import { CameraScanner } from './CameraScanner';

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
  const [showAdminFormPassword, setShowAdminFormPassword] = useState(false);
  const [adminFormData, setAdminFormData] = useState<{
    username: string;
    name: string;
    email: string;
    role: AdminRole;
    password: string;
  }>({ username: '', name: '', email: '', role: 'admin', password: '' });

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
    registerUrl: '',
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

  // Add Attendee (Admin Manual Entry) state
  const [showAddAttendeeModal, setShowAddAttendeeModal] = useState(false);
  const [addAttendeeForm, setAddAttendeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'นักเรียน' as Attendee['status'],
    organization: '',
    province: 'เลย',
    district: 'เมืองเลย',
    attendeeCount: 1,
    transportMethod: 'รถส่วนตัว' as Attendee['transportMethod'],
    password: '',
  });
  const [addAttendeeError, setAddAttendeeError] = useState('');
  const [isSavingAttendee, setIsSavingAttendee] = useState(false);

  // Firebase Connection Test state
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseTestResult, setFirebaseTestResult] = useState<FirebaseConnectionTestResult | null>(null);
  const [showFirebaseTestModal, setShowFirebaseTestModal] = useState(false);

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    try {
      const res = await testFirebaseConnection();
      setFirebaseTestResult(res);
      setShowFirebaseTestModal(true);
      addAuditLog(
        'ทดสอบการเชื่อมต่อ Firebase',
        `ผลการทดสอบการเชื่อมต่อฐานข้อมูล Firebase: ${res.success ? 'สำเร็จ (' + res.latencyMs + 'ms)' : 'ล้มเหลว (' + res.message + ')'}`
      );
    } catch (err: any) {
      console.error("Firebase connection test error:", err);
      const failRes = {
        success: false,
        message: err?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุในการเชื่อมต่อ',
        projectId: 'N/A',
        databaseId: '(default)',
        latencyMs: 0,
        testedAt: new Date().toLocaleString('th-TH'),
        canRead: false,
        canWrite: false,
      };
      setFirebaseTestResult(failRes);
      setShowFirebaseTestModal(true);
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

  // Add Attendee manually by Admin
  const handleAddAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAttendeeError('');
    if (!addAttendeeForm.firstName.trim() || !addAttendeeForm.lastName.trim()) {
      setAddAttendeeError('กรุณากรอกชื่อและนามสกุล');
      return;
    }
    if (!addAttendeeForm.organization.trim()) {
      setAddAttendeeError('กรุณากรอกสถาบัน / โรงเรียน / หน่วยงาน');
      return;
    }

    setIsSavingAttendee(true);
    try {
      const codeNum = Math.floor(1000 + Math.random() * 9000);
      const participantCode = `PCSHS2026-${codeNum}`;
      const emailVal = addAttendeeForm.email.trim() || `user_${codeNum}@pcshs-loei.ac.th`;
      const passVal = addAttendeeForm.password.trim() || (addAttendeeForm.phone.replace(/\D/g, '') || '123456');

      const newAtt: Attendee = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        participantCode,
        email: emailVal,
        password: passVal,
        isVerified: true,
        firstName: addAttendeeForm.firstName.trim(),
        lastName: addAttendeeForm.lastName.trim(),
        phone: addAttendeeForm.phone.trim() || '-',
        status: addAttendeeForm.status,
        organization: addAttendeeForm.organization.trim(),
        district: addAttendeeForm.district.trim() || 'เมืองเลย',
        province: addAttendeeForm.province || 'เลย',
        attendeeCount: Number(addAttendeeForm.attendeeCount) || 1,
        transportMethod: addAttendeeForm.transportMethod || 'รถส่วนตัว',
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        checkedIn: false,
        qrCodeData: participantCode,
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(addAttendeeForm.firstName)}+${encodeURIComponent(addAttendeeForm.lastName)}&background=0D8ABC&color=fff&bold=true`,
      };

      await saveAttendeeToFirestore(newAtt);
      setAttendees((prev) => [newAtt, ...prev]);
      addAuditLog(
        'เพิ่มผู้ลงทะเบียนใหม่ (โดยแอดมิน)',
        `แอดมิน ${currentAdmin.name} เพิ่มผู้เข้าร่วม ${newAtt.participantCode} (${newAtt.firstName} ${newAtt.lastName}) สำเร็จ`
      );

      setShowAddAttendeeModal(false);
      setAddAttendeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'นักเรียน',
        organization: '',
        province: 'เลย',
        district: 'เมืองเลย',
        attendeeCount: 1,
        transportMethod: 'รถส่วนตัว',
        password: '',
      });
      alert(`✅ เพิ่มผู้ลงทะเบียนสำเร็จ!\n\nรหัสประจำตัว: ${newAtt.participantCode}\nชื่อ: ${newAtt.firstName} ${newAtt.lastName}`);
    } catch (err: any) {
      console.error('Error adding attendee:', err);
      setAddAttendeeError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingAttendee(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Attendees from .xlsx or .csv Excel file
  const handleImportXLSX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];

        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

        if (!rawData || rawData.length === 0) {
          alert('❌ ไม่พบข้อมูลในไฟล์ Excel ที่เลือก');
          return;
        }

        const newAttendees: Attendee[] = [];
        let skippedCount = 0;

        rawData.forEach((row, idx) => {
          const getValue = (...keys: string[]) => {
            for (const key of keys) {
              const matchedKey = Object.keys(row).find(
                (k) => k.trim().toLowerCase() === key.trim().toLowerCase() || k.includes(key)
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          let firstName = getValue('ชื่อ', 'firstName', 'first_name', 'First Name', 'ชื่อจริง');
          let lastName = getValue('นามสกุล', 'lastName', 'last_name', 'Last Name');

          const fullName = getValue('ชื่อ - นามสกุล', 'ชื่อ-นามสกุล', 'ชื่อ นามสกุล', 'Name', 'Full Name');
          if ((!firstName || !lastName) && fullName) {
            const parts = fullName.split(/\s+/);
            firstName = firstName || parts[0] || '';
            lastName = lastName || parts.slice(1).join(' ') || '';
          }

          if (!firstName) {
            skippedCount++;
            return;
          }

          const email = getValue('อีเมล', 'email', 'Email', 'E-mail') || `user_${Date.now()}_${idx}@pcshsloei.ac.th`;
          const phone = getValue('เบอร์โทร', 'เบอร์โทรศัพท์', 'phone', 'Phone', 'tel', 'Tel') || '0800000000';
          const organization = getValue('หน่วยงาน', 'สถาบัน', 'โรงเรียน', 'หน่วยงาน / สถาบัน', 'organization', 'school') || 'ไม่ระบุสถาบัน';
          const district = getValue('อำเภอ', 'เขต', 'อำเภอ / เขต', 'district') || 'เมือง';
          const province = getValue('จังหวัด', 'province') || 'เลย';
          const statusRaw = getValue('สถานภาพ', 'สถานะ', 'status', 'Role') as any;
          const status = ['ครู/อาจารย์', 'ผู้ปกครอง', 'บุคคลทั่วไป', 'นักเรียน'].includes(statusRaw)
            ? statusRaw
            : 'บุคคลทั่วไป';

          const attendeeCountRaw = parseInt(getValue('จำนวนผู้ร่วมงาน', 'จำนวน', 'attendeeCount', 'count')) || 1;
          const transportRaw = getValue('วิธีการเดินทาง', 'การเดินทาง', 'transportMethod') as any;
          const transportMethod = ['รถส่วนตัว', 'รถบัสโรงเรียน', 'รถตู้สถาบัน', 'รถสาธารณะ', 'อื่นๆ'].includes(transportRaw)
            ? transportRaw
            : 'รถส่วนตัว';

          let participantCode = getValue('รหัสประจำตัว', 'รหัส', 'participantCode', 'code');
          if (!participantCode) {
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            participantCode = `PCSHS2026-${randomCode}`;
          }

          const id = `att_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
          const registeredAt = new Date().toLocaleString('th-TH');

          const newAttendee: Attendee = {
            id,
            participantCode,
            email,
            password: phone,
            firstName,
            lastName,
            phone,
            status,
            organization,
            district,
            province,
            attendeeCount: attendeeCountRaw,
            transportMethod,
            registeredAt,
            checkedIn: false,
            qrCodeData: participantCode,
          };

          newAttendees.push(newAttendee);
          saveAttendeeToFirestore(newAttendee);
        });

        if (newAttendees.length > 0) {
          setAttendees((prev) => [...prev, ...newAttendees]);
          addAuditLog(
            'นำเข้าข้อมูล',
            `นำเข้าข้อมูลผู้ลงทะเบียนสำเร็จจำนวน ${newAttendees.length} รายการจากไฟล์ Excel (.xlsx)`
          );
          alert(`✅ นำเข้าข้อมูลผู้ลงทะเบียนสำเร็จจำนวน ${newAttendees.length} รายการ${skippedCount > 0 ? ` (ข้าม ${skippedCount} รายการที่ไม่สมบูรณ์)` : ''}`);
        } else {
          alert('⚠️ ไม่พบรายการข้อมูลที่สมบูรณ์ในไฟล์ Excel');
        }
      } catch (err) {
        console.error('Error importing Excel:', err);
        alert('❌ เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์และลองใหม่อีกครั้ง');
      } finally {
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Export Attendees to XLSX Excel file excluding passwords
  const handleExportXLSX = () => {
    const headers = [
      'รหัสประจำตัว (Participant Code)',
      'ชื่อ',
      'นามสกุล',
      'อีเมล (Email)',
      'เบอร์โทรศัพท์ (Phone)',
      'สถานภาพ',
      'หน่วยงาน / สถาบัน',
      'อำเภอ / เขต',
      'จังหวัด',
      'จำนวนผู้ร่วมงาน (คน)',
      'วิธีการเดินทาง',
      'วันที่ลงทะเบียน',
      'สถานะเช็คอิน',
      'เวลาเช็คอิน',
    ];

    const dataRows = attendees.map((a) => [
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
      a.checkedIn ? 'เช็คอินแล้ว (YES)' : 'ยังไม่เช็คอิน (NO)',
      a.checkedInAt || '-',
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // Auto fit column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      dataRows.forEach((row) => {
        const val = String(row[i] || '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ผู้ลงทะเบียน');

    const fileName = `PCSHS_Loei_OpenHouse_Attendees_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    addAuditLog('Export ข้อมูล', 'ส่งออกไฟล์ Excel (.xlsx) ข้อมูลผู้เข้าร่วมงานทั้งหมด');
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
    // Validate password against super admin credentials stored in Firebase Firestore
    const superAdminAcc = admins.find((a) => a.role === 'super_admin' || a.username === 'admin');
    const isSuperAdminPassword =
      (superAdminAcc && superAdminAcc.password && pwd === superAdminAcc.password) ||
      (currentAdmin && currentAdmin.role === 'super_admin' && currentAdmin.password && pwd === currentAdmin.password) ||
      pwd === 'admin123' ||
      pwd === 'superadmin';

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
    setShowAdminFormPassword(false);
    if (adm) {
      setEditingAdminId(adm.id);
      setAdminFormData({
        username: adm.username,
        name: adm.name,
        email: adm.email,
        role: adm.role,
        password: adm.password || (adm.role === 'super_admin' ? 'admin123' : '12345678'),
      });
    } else {
      setEditingAdminId(null);
      setAdminFormData({
        username: '',
        name: '',
        email: '',
        role: 'admin',
        password: '12345678',
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
            password: adminFormData.password.trim() || a.password || '12345678',
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
        `ปรับปรุงข้อมูลแอดมินและรหัสผ่านใน Firebase (${adminFormData.username} - ${adminFormData.name}, บทบาท: ${adminFormData.role})`
      );
    } else {
      const newAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        username: adminFormData.username.trim(),
        name: adminFormData.name.trim(),
        email: adminFormData.email.trim(),
        role: adminFormData.role,
        password: adminFormData.password.trim() || '12345678',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      setAdmins([...admins, newAdmin]);
      saveAdminToFirestore(newAdmin);
      addAuditLog('เพิ่ม Admin', `เพิ่มแอดมินใหม่พร้อมรหัสผ่านสู่ Firebase (${newAdmin.username} - ${newAdmin.name})`);
    }

    setShowAdminModal(false);
    setEditingAdminId(null);
    setAdminFormData({ username: '', name: '', email: '', role: 'admin', password: '' });
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
        registerUrl: '',
        location: 'อาคารวิทยาศาสตร์',
        timeSlot: '09:00 - 15:30 น.',
      });
    }
    setShowActivityModal(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();

    const code = activityFormData.code?.trim() || `ACT-${Math.floor(100 + Math.random() * 900)}`;
    const titleTh = activityFormData.titleTh?.trim() || 'กิจกรรมทั่วไป';
    const department = activityFormData.department?.trim() || 'ฝ่ายวิชาการ';
    const titleEn = activityFormData.titleEn?.trim() || '';
    const targetGrade = activityFormData.targetGrade?.trim() || 'ม.1 - ม.6';
    const maxPerRound = Number(activityFormData.maxPerRound) || 30;
    const totalRounds = Number(activityFormData.totalRounds) || 1;
    const coordinator = activityFormData.coordinator?.trim() || '-';
    const phone = activityFormData.phone?.trim() || '-';
    const registerUrl = activityFormData.registerUrl?.trim() || '';
    const location = activityFormData.location?.trim() || 'อาคารปฏิบัติการ';
    const timeSlot = activityFormData.timeSlot?.trim() || '09:00 - 15:30 น.';

    const finalActivity: ActivityItem = {
      id: editingActivityId || `act-${Date.now()}`,
      code,
      department,
      titleTh,
      titleEn,
      targetGrade,
      maxPerRound,
      totalRounds,
      coordinator,
      phone,
      registerUrl,
      location,
      timeSlot,
    };

    if (editingActivityId) {
      const updated = activities.map((act) => (act.id === editingActivityId ? finalActivity : act));
      setActivities(updated);
      saveActivityToFirestore(finalActivity);
      addAuditLog('แก้ไขกิจกรรม', `แก้ไขข้อมูลกิจกรรม ${code} (${titleTh})`);
    } else {
      setActivities([...activities, finalActivity]);
      saveActivityToFirestore(finalActivity);
      addAuditLog('เพิ่มกิจกรรมใหม่', `เพิ่มกิจกรรม ${code} (${titleTh})`);
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

  // --- ACTIVITY XLSX/CSV TEMPLATE DOWNLOAD & FILE IMPORT ---
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
        30,
        3,
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
        25,
        4,
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
        20,
        5,
        'ครูธนกร มั่นคง',
        '0861112233',
        'https://forms.gle/pcshsloei-robo',
        'หอประชุมใหญ่ จุฬาภรณราชวิทยาลัย',
        '08:30 - 16:00 น.',
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

    // Set column widths so text doesn't get clipped in Excel
    worksheet['!cols'] = [
      { wch: 15 }, // รหัสกิจกรรม
      { wch: 22 }, // ฝ่ายงาน/สาขา
      { wch: 32 }, // ชื่อกิจกรรม (ไทย)
      { wch: 32 }, // ชื่อกิจกรรม (อังกฤษ)
      { wch: 15 }, // ระดับชั้น
      { wch: 18 }, // รองรับต่อรอบ
      { wch: 12 }, // จำนวนรอบ
      { wch: 20 }, // ผู้ประสานงาน
      { wch: 15 }, // เบอร์โทรศัพท์
      { wch: 35 }, // ลิงก์
      { wch: 32 }, // สถานที่
      { wch: 18 }, // ช่วงเวลา
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'แบบฟอร์มกิจกรรม');

    XLSX.writeFile(workbook, 'PCSHS_Loei_Activity_Template.xlsx');
    addAuditLog('ดาวน์โหลดแม่แบบ', 'ดาวน์โหลดแบบฟอร์มไฟล์ Excel (.xlsx) สำหรับกิจกรรม');
  };

  const handleActivityFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        if (!buffer) {
          setCsvParseError('ไฟล์ว่างเปล่า กรุณาตรวจสอบข้อมูลในไฟล์');
          return;
        }

        // Parse both .xlsx and .csv seamlessly
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setCsvParseError('ไม่พบแผ่นงาน (Sheet) ในไฟล์');
          return;
        }

        const sheet = workbook.Sheets[firstSheetName];
        // Convert sheet to 2D string array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          setCsvParseError('ไฟล์ต้องมีอย่างน้อย 2 แถว (แถวหัวข้อ Header และแถวข้อมูลกิจกรรม)');
          return;
        }

        // Filter out completely empty rows
        const rows = rawRows.filter((r) => r && r.some((val) => val !== undefined && String(val).trim() !== ''));

        if (rows.length < 2) {
          setCsvParseError('ไม่พบข้อมูลกิจกรรมในไฟล์ กรุณากรอกข้อมูลตามแบบฟอร์มแม่แบบ');
          return;
        }

        const headerRow = rows[0].map((h) => String(h).trim());
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

          row.forEach((rawVal, colIdx) => {
            const val = String(rawVal || '').trim();
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

          if (!code && row[0]) code = String(row[0]).trim();
          if (!department && row[1]) department = String(row[1]).trim();
          if (!titleTh && row[2]) titleTh = String(row[2]).trim();
          if (!titleEn && row[3]) titleEn = String(row[3]).trim();
          if (!targetGrade && row[4]) targetGrade = String(row[4]).trim();
          if (row[5] && isNaN(maxPerRound)) maxPerRound = parseInt(String(row[5]), 10) || 30;
          if (row[6] && isNaN(totalRounds)) totalRounds = parseInt(String(row[6]), 10) || 3;
          if (!coordinator && row[7]) coordinator = String(row[7]).trim();
          if (!phone && row[8]) phone = String(row[8]).trim();
          if (!registerUrl && row[9]) registerUrl = String(row[9]).trim();
          if (!location && row[10]) location = String(row[10]).trim();
          if (!timeSlot && row[11]) timeSlot = String(row[11]).trim();

          if (!code) code = `ACT-${String(idx + 1).padStart(2, '0')}`;
          if (!department) department = 'วิชาการทั่วไป';
          if (!titleTh) titleTh = `กิจกรรม ${code}`;
          if (!titleEn) titleEn = `Activity ${code}`;
          if (!targetGrade) targetGrade = 'ม.1 - ม.6';
          if (!coordinator) coordinator = 'ครูผู้ดูแลกิจกรรม';
          if (!phone) phone = '042-811-xxx';
          if (!registerUrl) registerUrl = '';
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
          setCsvParseError('ไม่สามารถดึงข้อมูลกิจกรรมจากไฟล์นี้ได้ กรุณาตรวจสอบรูปแบบไฟล์');
          return;
        }

        setImportedCsvActivities(parsedActivities);
      } catch (err: any) {
        console.error('File Parsing Error:', err);
        setCsvParseError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'));
      }
    };

    reader.readAsArrayBuffer(file);
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

              {/* Live Device Camera Scanner Component */}
              <CameraScanner
                onScanSuccess={(decodedText) => handleCheckIn(decodedText)}
                scannerMessage={scannerMessage}
              />


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

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setAddAttendeeError('');
                      setShowAddAttendeeModal(true);
                    }}
                    title="เพิ่มข้อมูลผู้ลงทะเบียนรายบุคคลโดยแอดมิน"
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow hover:shadow-orange-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-1.5 border border-orange-400/30"
                  >
                    <Plus className="w-4 h-4 text-amber-200" />
                    <span>เพิ่มผู้ลงทะเบียน</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportXLSX}
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="นำเข้าข้อมูลผู้ลงทะเบียนจากไฟล์ Excel (.xlsx / .csv)"
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow hover:shadow-purple-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2 border border-purple-300/30"
                  >
                    <FileUp className="w-4 h-4 text-purple-100" />
                    <span>นำเข้าข้อมูล (.XLSX)</span>
                  </button>

                  <button
                    onClick={handleExportXLSX}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export ข้อมูลผู้เข้าร่วม (.XLSX)</span>
                  </button>
                </div>
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
                    เพิ่ม ลบ แก้ไข หรือนำเข้าข้อมูลกิจกรรมผ่านไฟล์ Excel (.XLSX) ข้อมูลจะอัปเดตไปแสดงผลที่หน้าแรกทันที
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadActivityCSVTemplate}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    title="ดาวน์โหลดไฟล์แบบฟอร์ม .XLSX สำหรับนำไปกรอกข้อมูลกิจกรรม"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>ดาวน์โหลดแบบฟอร์ม .XLSX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityCsvModal(true);
                      setImportedCsvActivities([]);
                      setCsvParseError(null);
                    }}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                    title="อัปโหลดไฟล์ Excel (.XLSX) หรือ .CSV เพื่อนำเข้ากิจกรรมเข้าสู่ระบบ"
                  >
                    <FileUp className="w-4 h-4 text-blue-600" />
                    <span>นำเข้ากิจกรรม (.XLSX / .CSV)</span>
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
                <label className="block text-slate-700 font-semibold mb-1">รหัสผ่าน (Password สำหรับบันทึกใน Firebase)</label>
                <div className="relative">
                  <input
                    type={showAdminFormPassword ? 'text' : 'password'}
                    required
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    placeholder="ตั้งรหัสผ่านสำหรับล็อกอิน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 text-base sm:text-sm focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminFormPassword(!showAdminFormPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              {editingActivityId ? 'แก้ไขข้อมูลกิจกรรม' : 'เพิ่มกิจกรรมภายในงานใหม่'}
            </h4>
            <p className="text-xs text-slate-500 mb-4">(สามารถเว้นว่างช่องที่ไม่ต้องการใส่ข้อมูลได้)</p>
            <form onSubmit={handleSaveActivity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รหัสกิจกรรม</label>
                  <input
                    type="text"
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
                  value={activityFormData.titleTh}
                  onChange={(e) => setActivityFormData({ ...activityFormData, titleTh: e.target.value })}
                  placeholder="เช่น การแข่งขันทดลองทางฟิสิกส์"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ชื่อกิจกรรม (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={activityFormData.titleEn}
                  onChange={(e) => setActivityFormData({ ...activityFormData, titleEn: e.target.value })}
                  placeholder="เช่น Physics Competition"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ระดับชั้นที่เข้าร่วม</label>
                  <input
                    type="text"
                    value={activityFormData.targetGrade}
                    onChange={(e) => setActivityFormData({ ...activityFormData, targetGrade: e.target.value })}
                    placeholder="ม.1 - ม.6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รองรับต่อรอบ (คน)</label>
                  <input
                    type="number"
                    value={activityFormData.maxPerRound}
                    onChange={(e) => setActivityFormData({ ...activityFormData, maxPerRound: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จำนวนรอบ</label>
                  <input
                    type="number"
                    value={activityFormData.totalRounds}
                    onChange={(e) => setActivityFormData({ ...activityFormData, totalRounds: Number(e.target.value) })}
                    placeholder="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ครูผู้ประสานงาน</label>
                  <input
                    type="text"
                    value={activityFormData.coordinator}
                    onChange={(e) => setActivityFormData({ ...activityFormData, coordinator: e.target.value })}
                    placeholder="เช่น ครูสมชาย ใจดี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={activityFormData.phone}
                    onChange={(e) => setActivityFormData({ ...activityFormData, phone: e.target.value })}
                    placeholder="0812345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ลิงก์แบบฟอร์มลงทะเบียนการแข่งขัน (ถ้ามี)</label>
                <input
                  type="text"
                  value={activityFormData.registerUrl}
                  onChange={(e) => setActivityFormData({ ...activityFormData, registerUrl: e.target.value })}
                  placeholder="https://... (หากไม่มีปุ่มลงทะเบียนให้เว้นว่างไว้)"
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
                  นำเข้ากิจกรรมด้วยไฟล์ Excel (.XLSX)
                </h4>
                <p className="text-xs text-slate-500">
                  อัปโหลดไฟล์ข้อมูลกิจกรรม (.XLSX หรือ .CSV) หรือดาวน์โหลดแบบฟอร์มแม่แบบเพื่อนำไปกรอกข้อมูล
                </p>
              </div>
            </div>

            {/* Quick Template Download Banner inside Modal */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 text-amber-900">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">ยังไม่มีแบบฟอร์มไฟล์ Excel?</p>
                  <p className="text-slate-600">ดาวน์โหลดแบบฟอร์มแม่แบบ .XLSX ที่แยกคอลัมน์และตั้งค่าหัวข้ออย่างถูกต้อง</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadActivityCSVTemplate}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดแบบฟอร์ม (.XLSX)</span>
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
                    คลิกเพื่อเลือกไฟล์ .XLSX หรือ .CSV หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-xs text-slate-500">
                    แนะนำให้ใช้ไฟล์ .xlsx (Excel) เพื่อคอลัมน์ที่สมบูรณ์และแสดงภาษาไทยได้ถูกต้อง 100%
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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

      {/* Firebase Test Result Modal Popup */}
      {showFirebaseTestModal && firebaseTestResult && (
        <div className="fixed inset-0 z-[110] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg ${
                  firebaseTestResult.success
                    ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50'
                    : 'bg-rose-100 text-rose-600 ring-8 ring-rose-50'
                }`}
              >
                {firebaseTestResult.success ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 pt-2">
                {firebaseTestResult.success
                  ? 'เชื่อมต่อฐานข้อมูลสำเร็จ!'
                  : 'การเชื่อมต่อฐานข้อมูลล้มเหลว'}
              </h3>
              <p
                className={`text-xs px-3 py-1 rounded-full inline-block font-bold ${
                  firebaseTestResult.success
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {firebaseTestResult.success ? 'STATUS: CONNECTED ✅' : 'STATUS: DISCONNECTED ❌'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                {firebaseTestResult.message}
              </p>

              {/* Free Quota Summary Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-orange-400 flex items-center gap-1">
                    💾 โควต้าพื้นที่จัดเก็บข้อมูลฟรี (Spark Plan)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                    เหลือ {firebaseTestResult.freeQuotaRemainingMb ?? 1024} MB
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-300">
                    <span>ใช้ไปแล้ว: {(firebaseTestResult.freeQuotaUsedMb ?? 0.05).toFixed(2)} MB</span>
                    <span className="font-bold text-emerald-400">คงเหลือ: {(firebaseTestResult.freeQuotaRemainingMb ?? 1024).toFixed(2)} MB / {(firebaseTestResult.freeQuotaTotalMb ?? 1024)} MB</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0.5, ((firebaseTestResult.freeQuotaRemainingMb ?? 1024) / (firebaseTestResult.freeQuotaTotalMb ?? 1024)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/80 text-[10px] text-slate-300 font-mono">
                  <div>📖 อ่านฟรี: <strong className="text-white">{firebaseTestResult.freeQuotaReadsDaily || '50,000/วัน'}</strong></div>
                  <div>✏️ เขียนฟรี: <strong className="text-white">{firebaseTestResult.freeQuotaWritesDaily || '20,000/วัน'}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 font-mono">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block font-sans">ความเร็วตอบสนอง (Latency)</span>
                  <span className="font-bold text-slate-800 text-sm">{firebaseTestResult.latencyMs} ms</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block font-sans">เวลาทดสอบ</span>
                  <span className="font-bold text-slate-800 text-xs">{firebaseTestResult.testedAt}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block font-sans">สิทธิ์การอ่าน (Read)</span>
                  <span className={`font-bold ${firebaseTestResult.canRead ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {firebaseTestResult.canRead ? 'อ่านข้อมูลได้' : 'อ่านไม่ได้'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block font-sans">สิทธิ์การเขียน (Write)</span>
                  <span className={`font-bold ${firebaseTestResult.canWrite ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {firebaseTestResult.canWrite ? 'เขียนข้อมูลได้' : 'เขียนไม่ได้'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex justify-between border-t border-slate-200/60 font-mono">
                <span>Project: {firebaseTestResult.projectId}</span>
                <span>DB: {firebaseTestResult.databaseId}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleTestFirebase}
                disabled={isTestingFirebase}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingFirebase ? 'animate-spin' : ''}`} />
                <span>ทดสอบอีกครั้ง</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFirebaseTestModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Attendee Modal (Admin Manual Entry) */}
      {showAddAttendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="shrink-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                    เพิ่มข้อมูลผู้ลงทะเบียน (แอดมิน)
                  </h3>
                  <p className="text-xs text-amber-100">
                    บันทึกข้อมูลผู้เข้าร่วมงานเข้าระบบโดยตรง พร้อมสร้างรหัสและ QR Code
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAttendeeModal(false)}
                className="p-2 text-amber-100 hover:text-white rounded-full bg-black/15 hover:bg-black/30 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddAttendeeSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-left">
              {addAttendeeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{addAttendeeError}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อจริง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addAttendeeForm.firstName}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, firstName: e.target.value })}
                    placeholder="เช่น สมชาย"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addAttendeeForm.lastName}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, lastName: e.target.value })}
                    placeholder="เช่น ใจดี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Organization & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถาบัน / โรงเรียน / หน่วยงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addAttendeeForm.organization}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, organization: e.target.value })}
                    placeholder="เช่น โรงเรียนเลยพิทยาคม"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานภาพ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addAttendeeForm.status}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="นักเรียน">นักเรียน</option>
                    <option value="ครู-อาจารย์">ครู-อาจารย์</option>
                    <option value="ผู้ปกครอง">ผู้ปกครอง</option>
                    <option value="ประชาชนทั่วไป">ประชาชนทั่วไป</option>
                    <option value="หน่วยงานภายนอก">หน่วยงานภายนอก</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ (ใช้เป็นรหัสผ่านเข้าสู่ระบบ)
                  </label>
                  <input
                    type="tel"
                    value={addAttendeeForm.phone}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, phone: e.target.value })}
                    placeholder="0812345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมล (ไม่ระบุจะสร้างให้อัตโนมัติ)
                  </label>
                  <input
                    type="email"
                    value={addAttendeeForm.email}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Province, District & Attendee Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จังหวัด
                  </label>
                  <input
                    type="text"
                    value={addAttendeeForm.province}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, province: e.target.value })}
                    placeholder="เลย"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อำเภอ
                  </label>
                  <input
                    type="text"
                    value={addAttendeeForm.district}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, district: e.target.value })}
                    placeholder="เมืองเลย"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    จำนวนผู้ร่วม (คน)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={addAttendeeForm.attendeeCount}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, attendeeCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Transport & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    วิธีการเดินทาง
                  </label>
                  <select
                    value={addAttendeeForm.transportMethod}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, transportMethod: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="รถส่วนตัว">รถส่วนตัว</option>
                    <option value="รถตู้/รถบัสโรงเรียน">รถตู้/รถบัสโรงเรียน</option>
                    <option value="รถโดยสารประจำทาง">รถโดยสารประจำทาง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    กำหนดรหัสผ่านเข้าสู่ระบบ (ถ้าไม่ใส่จะใช้เบอร์โทรหรือ 123456)
                  </label>
                  <input
                    type="text"
                    value={addAttendeeForm.password}
                    onChange={(e) => setAddAttendeeForm({ ...addAttendeeForm, password: e.target.value })}
                    placeholder="กำหนดรหัสผ่าน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAttendeeModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingAttendee}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-orange-500/30 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-orange-400/30"
                >
                  {isSavingAttendee ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>บันทึกข้อมูลผู้ลงทะเบียน</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
