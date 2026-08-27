export type AttendeeStatus = 'ครู/อาจารย์' | 'ผู้ปกครอง' | 'บุคคลทั่วไป' | 'นักเรียน';

export type TransportMethod = 'รถส่วนตัว' | 'รถบัสโรงเรียน' | 'รถตู้สถาบัน' | 'รถสาธารณะ' | 'อื่นๆ';

export interface Attendee {
  id: string;
  participantCode: string; // PCSHS-0001, PCSHS-0002, etc. (Consecutive 4-digit number)
  email: string;
  password?: string;
  isVerified?: boolean;
  prefix?: string; // คำนำหน้าชื่อ (นาย / นาง / นางสาว / ดร. ฯลฯ)
  firstName: string;
  lastName: string;
  phone: string;
  position?: string; // ตำแหน่ง (ครู / นักเรียน / ผู้อำนวยการ / บุคลากร ฯลฯ)
  status: AttendeeStatus;
  organization: string; // ชื่อสถานศึกษา (โรงเรียน)
  district: string;
  province: string;
  attendeeCount: number;
  transportMethod: TransportMethod;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  qrCodeData: string;
  googleId?: string;
  photoUrl?: string;

  // ข้อมูลประเภทสถานศึกษา (School / Educational Institution Registration)
  schoolType?: string; // ประเภทของโรงเรียน
  schoolName?: string; // ชื่อสถานศึกษา (โรงเรียน)
  serviceArea?: string; // โรงเรียนตั้งอยู่เขตพื้นที่บริการ
  studentType?: string; // ประเภทนักเรียนที่เข้าร่วม
  interestedActivities?: string; // รายการกิจกรรมที่สนใจเข้าร่วม
  executivesCount?: number; // จำนวนผู้บริหารสถานศึกษาที่เข้าร่วม
  teachersCount?: number; // จำนวนครูหรือบุคลากรทางการศึกษาที่เข้าร่วม
  studentsCount?: number; // จำนวนนักเรียนที่เข้าร่วม
  coordinatorName?: string; // ชื่อ - นามสกุล ครูผู้ประสานงาน
  coordinatorPhone?: string; // เบอร์โทรศัพท์ (ครูผู้ประสานงาน)
  contactEmail?: string; // อีเมลสำหรับติดต่อกลับ
  acceptanceFormUrl?: string; // ลิงก์แบบตอบรับเข้าร่วมงาน

  // ข้อมูลการเช็คอินและจำนวนผู้มาร่วมงานจริง (Actual Attendance upon QR Scan)
  registrationSource?: 'excel_import' | 'admin_entry' | 'web_registration';
  isWebIndividual?: boolean;
  actualExecutivesCount?: number; // จำนวนผู้บริหารสถานศึกษาที่มาร่วมจริง
  actualTeachersCount?: number; // จำนวนครูหรือบุคลากรที่มาร่วมจริง
  actualStudentsCount?: number; // จำนวนนักเรียนที่มาร่วมจริง
  actualAttendeeCount?: number; // ยอดรวมผู้มาร่วมงานจริง (คน)
  actualNotes?: string; // หมายเหตุการเช็คอิน
  updatedAt?: string; // เวลาอัปเดตข้อมูลล่าสุด
}

export interface Coordinator {
  id: string;
  code: string; // รหัส
  school: string; // โรงเรียน
  name: string; // ชื่อผู้ประสานงาน
  phone: string; // เบอร์โทรศัพท์ (มีเลข 0 นำหน้า 10 หลัก)
  email?: string;
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  registeredAt?: string;
  updatedAt?: string;
}

export interface SchoolStudent {
  id: string;
  coordinatorId: string; // รหัสอ้างอิงผู้ประสานงาน / โรงเรียน
  school: string; // โรงเรียน
  code: string; // รหัส
  prefix: string; // คำนำหน้า (ด.ช., ด.ญ., นาย, นางสาว, อื่นๆ)
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  gradeLevel: string; // ระดับชั้น (เช่น ม.1, ม.2, ม.3, ม.4, ม.5, ม.6, ป.6 ฯลฯ)
  attended: boolean; // เช็คบ็อกซ์ติ๊กว่ามาหรือไม่มา (true = มา, false = ไม่มา)
  attendedAt?: string; // เวลาที่บันทึกว่ามา
  registeredAt?: string;
  updatedAt?: string;
}

export interface NewUserRegistration {
  id: string;
  code: string; // รหัส (เริ่มด้วย OH47001, OH47002, ...)
  prefix: string; // คำนำหน้าชื่อ (นาย, นาง, นางสาว, ด.ช., ด.หญิง, อื่นๆ)
  fullName: string; // ชื่อ-สกุล
  school: string; // โรงเรียน/สังกัด
  phone: string; // เบอร์โทรศัพท์ (10 หลัก มี 0 นำหน้า)
  email: string; // Email
  checkedIn: boolean; // สถานะเป็นเช็คอินแล้วทันทีเมื่อเพิ่ม
  checkedInAt: string; // เวลาที่เช็คอิน (เมื่อบันทึก)
  registeredAt: string;
  updatedAt?: string;
}

export type AdminRole = 'super_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface ActivityItem {
  id: string;
  code: string; // รหัสกิจกรรม
  department: string; // ฝ่ายงาน/สาขา
  titleTh: string; // ชื่อกิจกรรมภาษาไทย
  titleEn: string; // ชื่อกิจกรรมภาษาอังกฤษ
  targetGrade: string; // ระดับชั้นที่เข้าร่วมได้
  maxPerRound: number; // จำนวนที่รองรับต่อรอบ
  totalRounds: number; // จำนวนรอบ
  coordinator: string; // ครูผู้ประสานงาน
  phone: string; // เบอร์โทร
  registerUrl: string; // ลิงก์แบบฟอร์มลงทะเบียนการแข่งขัน
  location?: string;
  timeSlot?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  location: string;
  description: string;
  category: string;
}
