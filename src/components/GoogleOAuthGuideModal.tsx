import React, { useState } from 'react';
import { ExternalLink, Key, Check, Copy, X } from 'lucide-react';

interface GoogleOAuthGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleOAuthGuideModal: React.FC<GoogleOAuthGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const devUrl = 'https://ais-dev-g3wlhpeswkmd6reyjosbqx-685451187034.asia-east1.run.app';
  const sharedUrl = 'https://ais-pre-g3wlhpeswkmd6reyjosbqx-685451187034.asia-east1.run.app';
  const callbackUri = `${devUrl}/auth/callback`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="bg-slate-900 p-6 text-white border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                การตั้งค่า Google OAuth 2.0 (Google Cloud Console)
              </h3>
              <p className="text-xs text-blue-300">
                คู่มือสร้าง OAuth Client ID และกำหนดค่า Authorized Origins / Redirect URIs
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-left max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              สร้าง OAuth Client ID ใน Google Cloud Console
            </h4>
            <p className="text-xs text-slate-600 pl-8">
              เข้าไปที่หน้า <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-1">Google Credentials Console <ExternalLink className="w-3 h-3" /></a> แล้วคลิก <strong>Create Credentials &gt; OAuth client ID</strong> เลือกประเภทเป็น <strong>Web application</strong>
            </p>
          </div>

          {/* Step 2: Authorized Origins */}
          <div className="space-y-2 pl-8">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              ตั้งค่า Authorized JavaScript origins (สำหรับ GIS SDK)
            </h4>
            <p className="text-xs text-slate-600">
              คัดลอกโดเมนของแอปพลิเคชันไปวางในช่อง <strong>Authorized JavaScript origins</strong>:
            </p>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Development URL (สำหรับพรีวิวขณะพัฒนา):</span>
                  <button
                    onClick={() => copyToClipboard(devUrl, 'dev')}
                    className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copiedText === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'dev' ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>
                <code className="block text-xs bg-white p-2 rounded-lg border border-slate-200 font-mono text-slate-800 break-all select-all">
                  {devUrl}
                </code>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                  <span>Shared App URL (สำหรับการแชร์/ใช้งานจริง):</span>
                  <button
                    onClick={() => copyToClipboard(sharedUrl, 'shared')}
                    className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copiedText === 'shared' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'shared' ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                </div>
                <code className="block text-xs bg-white p-2 rounded-lg border border-slate-200 font-mono text-slate-800 break-all select-all">
                  {sharedUrl}
                </code>
              </div>
            </div>
          </div>

          {/* Step 3: Redirect URIs */}
          <div className="space-y-2 pl-8">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              ตั้งค่า Authorized redirect URIs (สำหรับ OAuth 2.0 OpenID Connect)
            </h4>
            <p className="text-xs text-slate-600">
              ระบุ URL สำหรับรับ Callback จาก Google OAuth 2.0:
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Authorized Redirect URI:</span>
                <button
                  onClick={() => copyToClipboard(callbackUri, 'cb')}
                  className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copiedText === 'cb' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'cb' ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                </button>
              </div>
              <code className="block text-xs bg-white p-2 rounded-lg border border-slate-200 font-mono text-slate-800 break-all select-all">
                {callbackUri}
              </code>
            </div>
          </div>

          {/* Step 4: Environment Variable */}
          <div className="space-y-2 pl-8">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
              ระบุ VITE_GOOGLE_CLIENT_ID ในไฟล์ .env หรือ AI Studio Secrets
            </h4>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              นำ Client ID ที่ได้จาก Google Cloud Console เช่น <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">123456789-abc.apps.googleusercontent.com</code> ไปใส่ในตัวแปร <code className="font-mono font-bold">VITE_GOOGLE_CLIENT_ID</code>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
