export type AttendeeStatus = 'ครู/อาจารย์' | 'ผู้ปกครอง' | 'บุคคลทั่วไป' | 'นักเรียน';

export type TransportMethod = 'รถส่วนตัว' | 'รถบัสโรงเรียน' | 'รถตู้สถาบัน' | 'รถสาธารณะ' | 'อื่นๆ';

export interface Attendee {
  id: string;
  participantCode: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: AttendeeStatus;
  organization: string;
  district: string;
  province: string;
  attendeeCount: number;
  transportMethod: TransportMethod;
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  qrCodeData: string;
}

export type AdminRole = 'super_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
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

export interface NewsItem {
  id: string;
  title: string;
  category: 'ข่าวประชาสัมพันธ์' | 'กำหนดการ' | 'การแข่งขัน' | 'ผลรางวัล' | 'การลงทะเบียน';
  date: string;
  content: string;
  important?: boolean;
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
