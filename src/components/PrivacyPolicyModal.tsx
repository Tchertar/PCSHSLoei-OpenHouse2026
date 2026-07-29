import React from 'react';
import { ShieldCheck, Lock, Clock, Eye, CheckCircle, X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="relative bg-slate-900 p-6 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                เอกสารนโยบายความเป็นส่วนตัว (Privacy Policy)
              </h3>
              <p className="text-xs text-blue-300">
                พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) - PCSHS Loei Open House 2026
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm leading-relaxed text-slate-700">
          <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800">
            โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย ให้ความสำคัญสูงสุดต่อการคุ้มครองข้อมูลส่วนบุคคลของท่าน เอกสารฉบับนี้อธิบายถึงนโยบายและแนวปฏิบัติในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของผู้ลงทะเบียนเข้าร่วมงาน PCSHS Loei Open House 2026
          </p>

          <div className="space-y-4">
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2 text-orange-600">
                <Lock className="w-4 h-4" />
                1. วัตถุประสงค์ของการเก็บรวบรวมข้อมูล
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                <li>เพื่อออกบัตรเข้าร่วมงานประจำตัว (Pass Ticket) และรหัส QR Code ประจำตัว</li>
                <li>เพื่อจัดเตรียมสถานที่ อาหาร สวัสดิการ เอกสารคู่มือ และของที่ระลึกหน้างานให้เพียงพอ</li>
                <li>เพื่อใช้ในการยืนยันตัวตน สแกนเข้างาน และบันทึกสถิติผู้เข้าร่วมตามประเภทสถาบัน</li>
                <li>เพื่อจัดส่งการแจ้งเตือนและข้อมูลสำคัญเกี่ยวกับงานทางอีเมลล่วงหน้า 1 วันก่อนวันจัดงาน</li>
              </ul>
            </div>

            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2 text-blue-600">
                <Clock className="w-4 h-4" />
                2. ระยะเวลาการจัดเก็บข้อมูลส่วนบุคคล
              </h4>
              <p className="text-xs text-slate-600">
                ข้อมูลส่วนบุคคลของท่านจะถูกจัดเก็บไว้ในระบบเป็นระยะเวลา <strong>90 วัน</strong> หลังจากวันเสร็จสิ้นงาน (นับจากวันที่ 28 สิงหาคม 2569) หลังจากนั้น ข้อมูลระบุตัวตนทั้งหมดจะถูกลบหรือแปลงเป็นข้อมูลสถิติที่ไม่สามารถระบุตัวตนได้โดยสมบูรณ์
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2 text-emerald-600">
                <Eye className="w-4 h-4" />
                3. การเข้าถึงและการเปิดเผยข้อมูล
              </h4>
              <p className="text-xs text-slate-600">
                ข้อมูลของท่านจะถูกจำกัดการเข้าถึงเฉพาะคณะกรรมการดำเนินงานฝ่ายวิชาการ ฝ่ายเทคโนโลยีสารสนเทศ และผู้ดูแลระบบ (Admin) ที่ได้รับอนุญาตอย่างเป็นทางการเท่านั้น โรงเรียนจะไม่เปิดเผยหรือจำหน่ายข้อมูลของท่านแก่บุคคลภายนอกโดยเด็ดขาด
              </p>
            </div>

            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2 text-amber-600">
                <CheckCircle className="w-4 h-4" />
                4. สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล
              </h4>
              <p className="text-xs text-slate-600">
                ท่านมีสิทธิ์ในการขอเข้าถึง ขอรับคัดลอก ขอแก้ไขข้อมูลให้ถูกต้อง หรือขอเพิกถอนความยินยอมและลบข้อมูลส่วนบุคคลของท่านได้ตลอดเวลา โดยสามารถติดต่อเจ้าหน้าที่ผ่านทางอีเมล <strong>academic_services@pcshsloei.ac.th</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
