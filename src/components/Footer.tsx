import React from 'react';
import { ExternalLink, Facebook, Globe, Mail, MapPin, Receipt, Shield, Phone } from 'lucide-react';

interface FooterProps {
  onOpenPrivacyPolicy: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacyPolicy }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-200 z-10 relative pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: School Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://lh3.googleusercontent.com/d/1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE"
                alt="PCSHS Loei Logo"
                className="w-12 h-12 object-contain bg-white/10 p-1 rounded-full ring-2 ring-blue-500/30"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://drive.google.com/thumbnail?id=1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE&sz=w500';
                }}
              />
              <div>
                <h4 className="font-extrabold text-white text-base leading-tight">
                  PCSHS LOEI
                </h4>
                <p className="text-xs text-orange-400 font-semibold">
                  โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Princess Chulabhorn Science High School Loei <br />
              129 หมู่ 5 ตำบลธาตุ อำเภอเชียงคาน จังหวัดเลย 42110
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Receipt className="w-4 h-4 text-blue-400 shrink-0" />
              <span>เลขประจำตัวผู้เสียภาษี: <strong className="text-slate-200">0994000379374</strong></span>
            </div>
          </div>

          {/* Col 2: Contact Info */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              ช่องทางติดต่อสอบถาม
            </h5>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>
                  อีเมลงานวิชาการ: <br />
                  <a
                    href="mailto:academic_services@pcshsloei.ac.th"
                    className="text-blue-400 hover:underline"
                  >
                    academic_services@pcshsloei.ac.th
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>โทรศัพท์: 042-810-880</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Links */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              เว็บไซต์และโซเชียลมีเดีย
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://pcshsloei.ac.th/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors"
                >
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>เว็บไซต์โรงเรียน (pcshsloei.ac.th)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/pcshsloei.ac.th/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors"
                >
                  <Facebook className="w-4 h-4 text-blue-500" />
                  <span>Facebook โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/RABYiDnwZXi7cuTaA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-orange-400 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>พิกัดสถานที่ใน Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: PDPA & Privacy */}
          <div className="space-y-3">
            <h5 className="font-bold text-white text-sm tracking-wider uppercase border-b border-slate-800 pb-2">
              ความคุ้มครองข้อมูลส่วนบุคคล
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              การลงทะเบียนข้อมูลอยู่ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) เพื่อใช้จัดการกิจกรรมงาน Open House 2026 เท่านั้น
            </p>
            <button
              onClick={onOpenPrivacyPolicy}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>อ่านนโยบายความเป็นส่วนตัว (Privacy Policy)</span>
            </button>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            © 2026 Princess Chulabhorn Science High School Loei. All Rights Reserved.
          </span>
          <span>ระบบจัดการลงทะเบียนเข้าร่วมงาน PCSHS Loei Open House 2026</span>
        </div>
      </div>
    </footer>
  );
};
