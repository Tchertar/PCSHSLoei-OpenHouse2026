import React, { useRef, useState } from 'react';
import { Attendee } from '../types';
import { Calendar, Download, MapPin, Phone, Printer, QrCode, School, User, Users, X, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ProfileTicketModalProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileTicketModal: React.FC<ProfileTicketModalProps> = ({
  attendee,
  isOpen,
  onClose,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !attendee) return null;

  const handleDownloadQR = () => {
    const svgElement = document.querySelector('#printable-ticket svg') as SVGElement | null;
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 25, 25, 250, 250);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QRCode_PCSHS_${attendee.participantCode}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Failed to export QR PNG', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    setDownloadingPdf(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_PCSHS_OpenHouse_${attendee.participantCode}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed', err);
      // Fallback print
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="relative bg-slate-900 p-6 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                บัตรเข้าร่วมงาน (Pass Ticket)
              </h3>
              <p className="text-xs text-emerald-300">
                ยืนยันการลงทะเบียน PCSHS Loei Open House 2026 เรียบร้อยแล้ว
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

        {/* Scrollable Printable Ticket Area */}
        <div className="p-6 space-y-6">
          {/* Ticket Card Container (Targeted for PDF canvas capture) */}
          <div
            ref={ticketRef}
            id="printable-ticket"
            className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl border-2 border-dashed border-blue-500 relative overflow-hidden"
          >
            {/* Top Watermark / Brand Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/d/1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE"
                  alt="PCSHS Loei Logo"
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://drive.google.com/thumbnail?id=1T0ODWeiPCRfSDbV3O93tf4VZZp57goDE&sz=w500';
                  }}
                />
                <div>
                  <h4 className="font-extrabold text-blue-900 text-base sm:text-lg leading-tight">
                    PCSHS LOEI OPEN HOUSE 2026
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-300">
                  บัตรประจำตัวผู้เข้าร่วม
                </span>
                <p className="text-xs text-slate-500 mt-1">28 สิงหาคม 2569</p>
              </div>
            </div>

            {/* Main Content Layout: Details + QR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div className="sm:col-span-2 space-y-2.5 text-sm">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <span className="text-xs text-slate-500 font-semibold block">รหัสประจำตัวผู้เข้าร่วม</span>
                  <span className="text-lg font-black text-blue-800 tracking-wider">
                    {attendee.participantCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-base">
                    คุณ{attendee.firstName} {attendee.lastName}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                    {attendee.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                  <School className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{attendee.organization}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    อ.{attendee.district} จ.{attendee.province}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>ผู้เข้าร่วมกลุ่ม: {attendee.attendeeCount} คน ({attendee.transportMethod})</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>เบอร์โทร: {attendee.phone}</span>
                </div>
              </div>

              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <div className="bg-white p-2 rounded-lg shadow-md mb-2">
                  <QRCodeSVG
                    value={attendee.qrCodeData || attendee.participantCode}
                    size={130}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500">สแกนเพื่อลงทะเบียนเข้างาน</span>
                <span className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {attendee.checkedIn ? 'เช็คอินเข้างานแล้ว' : 'พร้อมใช้สแกนวันจริง'}
                </span>
              </div>
            </div>

            {/* Bottom Footer info on ticket */}
            <div className="mt-4 pt-3 border-t text-[11px] text-slate-500 flex justify-between items-center">
              <span>สถานที่: โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</span>
              <span>โทร: 042-810-880</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={handleDownloadQR}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-300"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>โหลดเฉพาะรูป QR Code (PNG)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>พิมพ์บัตร (Print)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดบัตรเข้าร่วม (PDF)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
