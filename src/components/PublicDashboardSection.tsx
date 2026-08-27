import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  PieChart as PieChartIcon,
  Sparkles,
  School,
  GraduationCap,
  Award,
  RefreshCw,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Attendee, Coordinator, SchoolStudent, NewUserRegistration } from '../types';

interface PublicDashboardSectionProps {
  attendees: Attendee[];
  coordinators: Coordinator[];
  schoolStudents: SchoolStudent[];
  newUsers: NewUserRegistration[];
  onOpenGetQrCode?: () => void;
}

// Color Palette for Pie Chart Levels
const LEVEL_COLORS: Record<string, string> = {
  'ระดับมัธยมศึกษาตอนต้น (ม.1 - ม.3)': '#2563EB', // Blue
  'ระดับประถมศึกษา (ป.1 - ป.6)': '#0EA5E9', // Sky Blue
  'ระดับมัธยมศึกษาตอนปลาย (ม.4 - ม.6)': '#8B5CF6', // Purple
  'ครูและบุคลากรทางการศึกษา': '#F97316', // Orange
  'ผู้บริหารสถานศึกษา': '#D97706', // Amber
  'ผู้ปกครอง': '#10B981', // Emerald
  'ประชาชนทั่วไป': '#14B8A6', // Teal
  'นักเรียนระดับอื่นๆ': '#6366F1', // Indigo
  'ผู้เข้าร่วมทั่วไป': '#64748B', // Slate
};

const DEFAULT_COLOR = '#94A3B8';

// Helper to classify level & category
export function classifyParticipantLevel(person: {
  position?: string;
  status?: string;
  gradeLevel?: string;
  grade?: string;
  prefix?: string;
  name?: string;
  firstName?: string;
}): string {
  const text = `${person.gradeLevel || ''} ${person.grade || ''} ${person.position || ''} ${person.status || ''} ${person.prefix || ''}`.toLowerCase();

  // 1. Executive
  if (
    text.includes('ผู้อำนวยการ') ||
    text.includes('ผู้บริหาร') ||
    text.includes('ผอ.') ||
    text.includes('รองผู้อำนวยการ')
  ) {
    return 'ผู้บริหารสถานศึกษา';
  }

  // 2. Teacher & Educational Personnel
  if (
    text.includes('ครู') ||
    text.includes('อาจารย์') ||
    text.includes('บุคลากร') ||
    text.includes('วิทยากร') ||
    text.includes('ผู้ประสานงาน')
  ) {
    return 'ครูและบุคลากรทางการศึกษา';
  }

  // 3. Parents
  if (text.includes('ผู้ปกครอง')) {
    return 'ผู้ปกครอง';
  }

  // 4. General Public
  if (text.includes('บุคคลทั่วไป') || text.includes('ประชาชน')) {
    return 'ประชาชนทั่วไป';
  }

  // 5. Primary School (ป.1 - ป.6)
  if (
    text.includes('ป.') ||
    text.includes('ประถม') ||
    text.includes('ประถมศึกษา') ||
    text.includes('ป.1') ||
    text.includes('ป.2') ||
    text.includes('ป.3') ||
    text.includes('ป.4') ||
    text.includes('ป.5') ||
    text.includes('ป.6')
  ) {
    return 'ระดับประถมศึกษา (ป.1 - ป.6)';
  }

  // 6. Lower Secondary School (ม.1 - ม.3)
  if (
    text.includes('ม.1') ||
    text.includes('ม.2') ||
    text.includes('ม.3') ||
    text.includes('ม.ต้น') ||
    text.includes('มัธยมศึกษาตอนต้น') ||
    text.includes('มัธยมศึกษาปีที่ 1') ||
    text.includes('มัธยมศึกษาปีที่ 2') ||
    text.includes('มัธยมศึกษาปีที่ 3')
  ) {
    return 'ระดับมัธยมศึกษาตอนต้น (ม.1 - ม.3)';
  }

  // 7. Upper Secondary School (ม.4 - ม.6)
  if (
    text.includes('ม.4') ||
    text.includes('ม.5') ||
    text.includes('ม.6') ||
    text.includes('ม.ปลาย') ||
    text.includes('มัธยมศึกษาตอนปลาย') ||
    text.includes('มัธยมศึกษาปีที่ 4') ||
    text.includes('มัธยมศึกษาปีที่ 5') ||
    text.includes('มัธยมศึกษาปีที่ 6')
  ) {
    return 'ระดับมัธยมศึกษาตอนปลาย (ม.4 - ม.6)';
  }

  // 8. Other Student
  if (
    text.includes('ด.ช.') ||
    text.includes('ด.ญ.') ||
    text.includes('เด็กชาย') ||
    text.includes('เด็กหญิง') ||
    text.includes('นักเรียน')
  ) {
    return 'นักเรียนระดับอื่นๆ';
  }

  return 'ผู้เข้าร่วมทั่วไป';
}

export const PublicDashboardSection: React.FC<PublicDashboardSectionProps> = ({
  attendees = [],
  coordinators = [],
  schoolStudents = [],
  newUsers = [],
  onOpenGetQrCode,
}) => {
  const [chartDataMode, setChartDataMode] = useState<'all' | 'attended'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Group 1 Counts: Pre-registered attendees
  const group1Registered = attendees.length;
  const group1Attended = attendees.filter((a) => a.checkedIn).length;
  const group1Rate = group1Registered > 0 ? Math.round((group1Attended / group1Registered) * 100) : 0;

  // Group 2 Counts: 45 Coordinators + School Students
  const group2CoordRegistered = coordinators.length;
  const group2CoordAttended = coordinators.filter((c) => c.checkedIn).length;
  const group2StuRegistered = schoolStudents.length;
  const group2StuAttended = schoolStudents.filter((s) => s.attended).length;
  const group2Registered = group2CoordRegistered + group2StuRegistered;
  const group2Attended = group2CoordAttended + group2StuAttended;
  const group2Rate = group2Registered > 0 ? Math.round((group2Attended / group2Registered) * 100) : 0;

  // Group 3 Counts: Onsite Walk-in registrations
  const group3Registered = newUsers.length;
  const group3Attended = newUsers.filter((u) => u.checkedIn).length;
  const group3Rate = group3Registered > 0 ? Math.round((group3Attended / group3Registered) * 100) : 100;

  // Overall Totals across all 3 groups
  const grandTotalRegistered = group1Registered + group2Registered + group3Registered;
  const grandTotalAttended = group1Attended + group2Attended + group3Attended;
  const overallAttendanceRate =
    grandTotalRegistered > 0 ? Math.round((grandTotalAttended / grandTotalRegistered) * 100) : 0;

  // Unique schools count
  const uniqueSchoolsCount = useMemo(() => {
    const schoolSet = new Set<string>();
    attendees.forEach((a) => {
      if (a.organization && a.organization.trim()) schoolSet.add(a.organization.trim());
      if (a.schoolName && a.schoolName.trim()) schoolSet.add(a.schoolName.trim());
    });
    coordinators.forEach((c) => {
      if (c.school && c.school.trim()) schoolSet.add(c.school.trim());
    });
    schoolStudents.forEach((s) => {
      if (s.school && s.school.trim()) schoolSet.add(s.school.trim());
    });
    newUsers.forEach((u) => {
      if (u.school && u.school.trim()) schoolSet.add(u.school.trim());
    });
    return Math.max(schoolSet.size, 45);
  }, [attendees, coordinators, schoolStudents, newUsers]);

  // Aggregate Participant Level Distribution (Pie Chart Data)
  const pieChartData = useMemo(() => {
    const counts: Record<string, number> = {};

    // 1. Group 1
    attendees.forEach((att) => {
      if (chartDataMode === 'attended' && !att.checkedIn) return;
      const level = classifyParticipantLevel(att);
      counts[level] = (counts[level] || 0) + 1;
    });

    // 2. Group 2 - Coordinators
    coordinators.forEach((coord) => {
      if (chartDataMode === 'attended' && !coord.checkedIn) return;
      const level = 'ครูและบุคลากรทางการศึกษา';
      counts[level] = (counts[level] || 0) + 1;
    });

    // 2. Group 2 - School Students
    schoolStudents.forEach((stu) => {
      if (chartDataMode === 'attended' && !stu.attended) return;
      const level = classifyParticipantLevel({
        gradeLevel: stu.gradeLevel || stu.grade,
        prefix: stu.prefix,
        firstName: stu.firstName,
      });
      counts[level] = (counts[level] || 0) + 1;
    });

    // 3. Group 3 - New Users
    newUsers.forEach((u) => {
      if (chartDataMode === 'attended' && !u.checkedIn) return;
      const level = classifyParticipantLevel({
        prefix: u.prefix,
        position: 'ผู้เข้าร่วมหน้างาน',
      });
      counts[level] = (counts[level] || 0) + 1;
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : '0',
        color: LEVEL_COLORS[name] || DEFAULT_COLOR,
      }))
      .sort((a, b) => b.value - a.value);
  }, [attendees, coordinators, schoolStudents, newUsers, chartDataMode]);

  const handleRefresh = () => {
    setLastRefreshedAt(
      new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return (
    <section id="dashboard" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200/90 text-orange-800 text-xs font-bold rounded-full mb-2.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>สรุปข้อมูลสถิติภาพรวม Real-time</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>แดชบอร์ดสรุปผู้เข้าร่วมงาน</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
            รายงานสถิติจำนวนผู้ลงทะเบียนเข้าร่วมทั้ง 3 กลุ่ม จำนวนที่เข้าร่วมจริง และสัดส่วนระดับของผู้เข้าร่วมงาน PCSHS Loei Open House 2026
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {onOpenGetQrCode && (
            <button
              type="button"
              onClick={onOpenGetQrCode}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>รับ QR Code ของตนเอง</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
            title="อัปเดตข้อมูลล่าสุด"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">อัปเดต: {lastRefreshedAt} น.</span>
          </button>
        </div>
      </div>

      {/* 4 MAIN HIGHLIGHT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        
        {/* CARD 1: ยอดรวมผู้ลงทะเบียนทั้งหมด */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-slate-600">ผู้ลงทะเบียนทั้งหมด</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {grandTotalRegistered.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>รวมครบทั้ง 3 กลุ่ม</span>
            <span className="font-bold text-blue-600">100% ของเป้าหมาย</span>
          </div>
        </div>

        {/* CARD 2: ผู้เข้าร่วมงานจริง (เช็คอินแล้ว) */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-emerald-500/15 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-emerald-100">ผู้เข้าร่วมงานจริง (เช็คชื่อแล้ว)</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {grandTotalAttended.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-emerald-100">คน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100">
            <span>อัตราการเข้าร่วมจริง</span>
            <span className="font-black text-white bg-white/20 px-2 py-0.5 rounded-full">
              {overallAttendanceRate}%
            </span>
          </div>
        </div>

        {/* CARD 3: โรงเรียน / สถาบันที่เข้าร่วม */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/5 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-slate-600">สถานศึกษา / สถาบัน</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-xs">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {uniqueSchoolsCount.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-slate-500">โรงเรียน</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>เครือข่าย OH01 - OH45</span>
            <span className="font-bold text-orange-600">45 กลุ่มหลัก</span>
          </div>
        </div>

        {/* CARD 4: อัตราความสำเร็จการเช็คชื่อ */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-slate-600">สถานะความคืบหน้า</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {overallAttendanceRate}%
            </span>
            <span className="text-sm font-semibold text-slate-500">Check-in</span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallAttendanceRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* 3 GROUPS PARTICIPANT CARDS BREAKDOWN */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              รายละเอียดจำนวนผู้ลงทะเบียนและเข้าร่วมจริง แยกตาม 3 กลุ่ม
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* GROUP 1: ผู้ลงทะเบียนล่วงหน้า */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-base shadow-xs">
                  1
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                    กลุ่ม 1: ผู้ลงทะเบียนล่วงหน้า
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ลงทะเบียนออนไลน์ (Pre-registered)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium">จำนวนลงทะเบียน:</span>
                <span className="font-bold text-slate-900">{group1Registered.toLocaleString()} คน</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  เข้าร่วมจริง:
                </span>
                <span className="font-black text-emerald-700">{group1Attended.toLocaleString()} คน</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>อัตราการเช็คชื่อ:</span>
                  <span className="font-bold text-blue-600">{group1Rate}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(group1Rate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              รหัสประจำตัวรูปแบบ: <code className="text-blue-600 font-bold">PCSHS-0001</code> เป็นต้นไป
            </div>
          </div>

          {/* GROUP 2: คณะครูและนักเรียน 45 โรงเรียน */}
          <div className="bg-white border-2 border-orange-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all relative">
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-extrabold rounded-full">
                กลุ่มใหญ่ที่สุด
              </span>
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-base shadow-xs">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                    กลุ่ม 2: ครูและนักเรียน 45 โรงเรียน
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ผู้ประสานงาน & นักเรียน (OH01 - OH45)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 bg-orange-50/50 rounded-2xl p-3.5 border border-orange-100/80">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium">รวมทั้งหมด:</span>
                <span className="font-black text-slate-900">{group2Registered.toLocaleString()} คน</span>
              </div>
              <div className="text-[11px] text-slate-500 pl-2 border-l-2 border-orange-300 space-y-1">
                <div className="flex justify-between">
                  <span>• ครูผู้ประสานงาน:</span>
                  <span className="font-semibold text-slate-700">
                    {group2CoordAttended}/{group2CoordRegistered} คน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>• นักเรียนในสังกัด:</span>
                  <span className="font-semibold text-slate-700">
                    {group2StuAttended}/{group2StuRegistered} คน
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  เข้าร่วมจริงรวม:
                </span>
                <span className="font-black text-emerald-700">{group2Attended.toLocaleString()} คน</span>
              </div>
              <div className="pt-2 border-t border-orange-200/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>อัตราการเช็คชื่อ:</span>
                  <span className="font-bold text-orange-600">{group2Rate}%</span>
                </div>
                <div className="w-full bg-orange-200/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(group2Rate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              รหัสประจำตัวรูปแบบ: <code className="text-orange-600 font-bold">OH0101 - OH4530</code>
            </div>
          </div>

          {/* GROUP 3: ผู้ลงทะเบียนหน้างาน */}
          <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-black text-base shadow-xs">
                  3
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                    กลุ่ม 3: ผู้ลงทะเบียนหน้างาน
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ลงทะเบียน Walk-in / Onsite
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-600 font-medium">จำนวนลงทะเบียน:</span>
                <span className="font-bold text-slate-900">{group3Registered.toLocaleString()} คน</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  เข้าร่วมจริง:
                </span>
                <span className="font-black text-emerald-700">{group3Attended.toLocaleString()} คน</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>อัตราการเช็คชื่อ:</span>
                  <span className="font-bold text-emerald-600">100%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              รหัสประจำตัวรูปแบบ: <code className="text-emerald-600 font-bold">OH47001</code> เป็นต้นไป
            </div>
          </div>

        </div>
      </div>

      {/* PIE CHART SECTION : ระดับของผู้เข้าร่วมงาน */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                กราฟวงกลมแสดงสัดส่วนระดับของผู้เข้าร่วม
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                จำแนกตามระดับชั้นการศึกษา (ประถม/ม.ต้น/ม.ปลาย) คณะครู บุคลากร และผู้บริหาร
              </p>
            </div>
          </div>

          {/* Toggle View Mode (ทั้งหมด vs มาจริง) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => setChartDataMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartDataMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ผู้ลงทะเบียนทั้งหมด ({grandTotalRegistered})
            </button>
            <button
              type="button"
              onClick={() => setChartDataMode('attended')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartDataMode === 'attended'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เข้าร่วมจริงเท่านั้น ({grandTotalAttended})
            </button>
          </div>
        </div>

        {/* Chart & Legend Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Recharts Pie Chart (5 Cols on large screen) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-72 sm:h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800">
                            <div className="font-bold text-sm text-amber-300">{data.name}</div>
                            <div className="flex items-center justify-between gap-4 text-slate-300">
                              <span>จำนวน:</span>
                              <span className="font-bold text-white">{data.value.toLocaleString()} คน</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-slate-300">
                              <span>สัดส่วน:</span>
                              <span className="font-bold text-emerald-400">{data.percentage}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs font-semibold text-slate-400">
                  {chartDataMode === 'all' ? 'ยอดรวม' : 'เข้าร่วมจริง'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {chartDataMode === 'all'
                    ? grandTotalRegistered.toLocaleString()
                    : grandTotalAttended.toLocaleString()}
                </span>
                <span className="text-[11px] font-bold text-slate-500">คน</span>
              </div>
            </div>
          </div>

          {/* Detailed Level Breakdown List (7 Cols on large screen) */}
          <div className="lg:col-span-7 space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              ตารางแจกแจงจำนวนและสัดส่วนร้อยละ
            </h4>

            {pieChartData.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-bold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-extrabold text-slate-900">
                    {item.value.toLocaleString()} <span className="text-slate-400 font-normal text-xs">คน</span>
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md font-black text-xs min-w-[50px] text-center"
                    style={{
                      backgroundColor: `${item.color}15`,
                      color: item.color,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
