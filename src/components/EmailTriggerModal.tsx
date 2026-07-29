import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Mail, Send, ShieldAlert, Sparkles, X, Zap } from 'lucide-react';
import { Attendee } from '../types';

interface EmailTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendees: Attendee[];
}

export const EmailTriggerModal: React.FC<EmailTriggerModalProps> = ({
  isOpen,
  onClose,
  attendees,
}) => {
  const [triggering, setTriggering] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Time-driven Trigger scheduled for 27 สิงหาคม 2569 เวลา 08:00 น. (1 วันก่อนวันจัดงาน)',
    'Daily Email Quota Remaining: 1,480 / 1,500 (Google Workspace standard)',
    'Async Queue Status: Idle & Ready',
  ]);

  if (!isOpen) return null;

  const handleSimulate1DayReminder = () => {
    setTriggering(true);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] 🚀 Triggering 1-Day Pre-Event Email Reminder Batch...`,
      ...prev,
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] 📧 Processed non-blocking async queue for ${attendees.length} registered participants.`,
        `[${new Date().toLocaleTimeString()}] ✅ Sent 1-day pre-event reminder with QR Code & location details successfully!`,
        ...prev,
      ]);
      setTriggering(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              ระบบแจ้งเตือนอีเมลอัตโนมัติ (Email Trigger Service)
            </h3>
            <p className="text-xs text-orange-600 font-medium">
              Time-driven Trigger รายวันเตือนก่อนถึงวันจัดงาน 1 วัน (27 สิงหาคม 2569)
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">โควตาอีเมล Google Workspace</span>
              <span className="text-lg font-bold text-emerald-600">1,480 / 1,500</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">ฉบับต่อวัน (Daily Quota)</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block mb-1">การทำงานเบื้องหลัง (Async)</span>
              <span className="text-lg font-bold text-blue-600">Non-blocking Queue</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">ไม่ขวางการโหลดหน้าเว็บ</span>
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[11px] h-36 overflow-y-auto space-y-1 text-slate-200">
            <span className="text-amber-400 font-bold block mb-1">// System Logs:</span>
            {logs.map((log, idx) => (
              <div key={idx} className="text-slate-300 leading-tight">
                {log}
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              ระบบใช้การทำงานแบบ Asynchronous Batch Processing เพื่อกระจายการส่งอีเมลเป็นชุด ป้องกันการชนโควตาสูงสุดของ Google และช่วยให้หน้าเว็บแสดงผลได้อย่างราบรื่นที่สุด
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSimulate1DayReminder}
              disabled={triggering}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{triggering ? 'กำลังประมวลผลเบื้องหลัง...' : 'ทดสอบเรียกสคริปต์แจ้งเตือนล่วงหน้า 1 วัน'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
