import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { Camera, RefreshCw, Volume2, VolumeX, AlertTriangle, SwitchCamera, ShieldCheck, Zap } from 'lucide-react';

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  scannerMessage?: { type: 'success' | 'error' | 'info'; text: string } | null;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScanSuccess, scannerMessage }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedText, setLastScannedText] = useState<string>('');
  const [scanCooldown, setScanCooldown] = useState<boolean>(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-full-region';

  // Play synthetic beep sound via Web Audio API
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context play error handled silently
    }
  }, [soundEnabled]);

  // Fetch available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to rear camera if present, or first device
        const backCamera = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear') || d.label.toLowerCase().includes('environment'));
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    } catch (err: unknown) {
      console.warn('Could not enumerate cameras:', err);
    }
  }, []);

  useEffect(() => {
    getAvailableCameras();
  }, [getAvailableCameras]);

  // Stop camera stream safely
  const stopScanning = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  }, []);

  // Start camera stream
  const startScanning = useCallback(async () => {
    setErrorMessage(null);

    // Make sure previous scanner stopped
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      await stopScanning();
    }

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrcodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const qrCodeSuccessCallback = (decodedText: string) => {
        if (scanCooldown) return;

        // Trigger scan success
        setLastScannedText(decodedText);
        playBeep();
        onScanSuccess(decodedText);

        // 1.5s Cooldown to prevent spam scanning
        setScanCooldown(true);
        setTimeout(() => {
          setScanCooldown(false);
        }, 1500);
      };

      // Camera config strategy: Selected Camera ID OR facingMode
      const cameraConfig = selectedCameraId ? selectedCameraId : { facingMode: facingMode };

      await html5QrCode.start(
        cameraConfig,
        config,
        qrCodeSuccessCallback,
        undefined
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.error('Camera scan start failed:', err);
      let msg = 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์การใช้งานกล้องในเบราว์เซอร์';
      if (err instanceof Error && err.message) {
        if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
          msg = 'เบราว์เซอร์ถูกปฏิเสธการเข้าถึงกล้อง กรุณากดปลดล็อกสิทธิ์ Camera ในแถบการตั้งค่าเบราว์เซอร์';
        } else if (err.message.includes('NotFoundError')) {
          msg = 'ไม่พบอุปกรณ์กล้องบนเครื่องนี้';
        }
      }
      setErrorMessage(msg);
      setIsScanning(false);
    }
  }, [selectedCameraId, facingMode, scanCooldown, playBeep, onScanSuccess, stopScanning]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().then(() => html5QrcodeRef.current?.clear()).catch(() => {});
      }
    };
  }, []);

  // Toggle Camera Facing Mode (Front / Rear)
  const handleToggleFacingMode = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setSelectedCameraId(''); // reset selected id to force facing mode
    if (isScanning) {
      await stopScanning();
      setTimeout(() => {
        startScanning();
      }, 300);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-slate-900 text-sm sm:text-base">
              ระบบสแกนด้วยกล้อง (Webcam & Smartphone)
            </h5>
            <p className="text-xs text-slate-500">
              รองรับกล้องจากคอมพิวเตอร์ แท็บเล็ต และสมาร์ตโฟนทุกรุ่น
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              soundEnabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={soundEnabled ? 'เปิดเสียงสแกน' : 'ปิดเสียงสแกน'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'เสียงเปิด' : 'เสียงปิด'}</span>
          </button>

          {!isScanning ? (
            <button
              type="button"
              onClick={startScanning}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-transform hover:scale-105 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>เปิดกล้องสแกน</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanning}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <span>ปิดกล้อง</span>
            </button>
          )}
        </div>
      </div>

      {/* Camera Selector Toolbar (when cameras are detected) */}
      {cameras.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <label className="font-semibold text-slate-700 shrink-0">เลือกอุปกรณ์กล้อง:</label>
          <select
            value={selectedCameraId}
            onChange={(e) => {
              setSelectedCameraId(e.target.value);
              if (isScanning) {
                stopScanning().then(() => setTimeout(startScanning, 300));
              }
            }}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="">-- สลับตาม Facing Mode (กล้องหลัง/หน้า) --</option>
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>
                {cam.label || `Camera (${cam.id.substring(0, 8)}...)`}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleToggleFacingMode}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg flex items-center gap-1 cursor-pointer"
            title="สลับระหว่างกล้องหน้าและกล้องหลัง"
          >
            <SwitchCamera className="w-3.5 h-3.5 text-orange-500" />
            <span>{facingMode === 'environment' ? 'กล้องหลัง' : 'กล้องหน้า'}</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{errorMessage}</p>
            <p className="text-[11px] text-red-600 font-normal">
              คำแนะนำ: ตรวจสอบว่าได้กดอนุญาตให้เว็บไซต์ใช้งานกล้อง (Camera Permission) ในแถบ Address bar ของเบราว์เซอร์เรียบร้อยแล้ว
            </p>
          </div>
        </div>
      )}

      {/* Camera Viewport Container */}
      <div className="relative w-full max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800 min-h-[280px] flex items-center justify-center">
        {/* QR Scanner Region required by html5-qrcode */}
        <div id={qrRegionId} className="w-full h-full text-white [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

        {!isScanning && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/90 text-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
              <Camera className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">กล้องยังไม่ได้เปิดใช้งาน</p>
              <p className="text-xs text-slate-400 max-w-xs">
                กดปุ่ม <span className="text-orange-400 font-semibold">"เปิดกล้องสแกน"</span> เพื่อเริ่มต้นสแกน QR Code จากบัตรประจำตัวผู้เข้าร่วม
              </p>
            </div>
            <button
              type="button"
              onClick={startScanning}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-transform hover:scale-105"
            >
              เริ่มต้นสแกนกล้องสด
            </button>
          </div>
        )}

        {/* Viewfinder Overlay Box & Animated Laser Scanning Line */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Viewfinder Target Frame */}
            <div className="relative w-56 h-56 border-2 border-orange-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] overflow-hidden">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-orange-500 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-orange-500 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-orange-500 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-orange-500 rounded-br-md" />

              {/* Animated Laser Scanning Line */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-laser-scan" />
            </div>

            {/* Helper Tag */}
            <div className="absolute bottom-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-amber-300 border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>นำ QR Code มาไว้ตรงกลางกรอบ</span>
            </div>
          </div>
        )}
      </div>

      {/* Last Scanned Code Feedback */}
      {lastScannedText && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
          <span className="truncate">รหัสล่าสุดที่สแกน: <strong className="font-mono text-emerald-900">{lastScannedText}</strong></span>
          <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
            สแกนเรียบร้อย
          </span>
        </div>
      )}

      {/* Laser Keyframe animation styling */}
      <style>{`
        @keyframes laserScan {
          0% {
            transform: translateY(0px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(220px);
            opacity: 1;
          }
          100% {
            transform: translateY(0px);
            opacity: 0.8;
          }
        }
        .animate-laser-scan {
          animation: laserScan 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
