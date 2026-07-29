import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;

app.use(express.json());

// Utility to decode JWT without external native dependencies
function decodeGoogleJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Fix base64url padding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding Google JWT:', err);
    return null;
  }
}

// API Endpoint: Get OAuth Configuration & Environment Info
app.get('/api/auth/config', (req, res) => {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const devUrl = 'https://ais-dev-g3wlhpeswkmd6reyjosbqx-685451187034.asia-east1.run.app';
  const sharedUrl = 'https://ais-pre-g3wlhpeswkmd6reyjosbqx-685451187034.asia-east1.run.app';
  const currentAppUrl = process.env.APP_URL || devUrl;

  res.json({
    clientId,
    isConfigured: !!clientId && !clientId.includes('YOUR_GOOGLE_OAUTH_CLIENT_ID'),
    appUrl: currentAppUrl,
    origins: [devUrl, sharedUrl, 'http://localhost:3000'],
    redirectUri: `${currentAppUrl}/auth/callback`,
  });
});

// API Endpoint: Verify Google ID Token (OIDC / GIS)
app.post('/api/auth/google/verify', (req, res) => {
  const { credential, userInfo } = req.body;

  let decodedUser: any = null;

  if (credential) {
    // Decode real Google OIDC ID Token from Google Identity Services
    decodedUser = decodeGoogleJwt(credential);
  } else if (userInfo) {
    // Directly provided user info payload (fallback / account chooser)
    decodedUser = userInfo;
  }

  if (!decodedUser || (!decodedUser.email && !decodedUser.sub)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing Google Identity credentials',
    });
  }

  const googleProfile = {
    googleId: decodedUser.sub || decodedUser.googleId || `g_${Date.now()}`,
    email: decodedUser.email || '',
    name: decodedUser.name || `${decodedUser.given_name || ''} ${decodedUser.family_name || ''}`.trim() || decodedUser.email?.split('@')[0] || 'Google User',
    firstName: decodedUser.given_name || decodedUser.name?.split(' ')[0] || 'ผู้ใช้งาน',
    lastName: decodedUser.family_name || decodedUser.name?.split(' ').slice(1).join(' ') || 'Google',
    photoUrl: decodedUser.picture || decodedUser.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(decodedUser.name || 'G')}&background=0D8ABC&color=fff`,
    emailVerified: decodedUser.email_verified ?? true,
  };

  // Generate a session token
  const sessionToken = Buffer.from(JSON.stringify({
    googleId: googleProfile.googleId,
    email: googleProfile.email,
    timestamp: Date.now(),
  })).toString('base64');

  return res.json({
    success: true,
    user: googleProfile,
    token: sessionToken,
  });
});

// In-memory store for Email Verification OTPs
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

// API Endpoint: Send Email Verification OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, firstName } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุอีเมลที่ถูกต้อง',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  // Generate 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // OTP valid for 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore[normalizedEmail] = { code, expiresAt };

  console.log(`[OTP Generated] Email: ${normalizedEmail}, Code: ${code}`);

  let emailSentReal = false;
  let emailErrorMessage = '';

  // Attempt real email dispatch via nodemailer if SMTP is configured
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `PCSHS Loei Open House 2026 <no-reply@pcshsloei.ac.th>`;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: smtpFrom,
        to: normalizedEmail,
        subject: `[PCSHS Loei Open House 2026] รหัสยืนยันลงทะเบียน OTP: ${code}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ea580c;">
              <h1 style="color: #ea580c; font-size: 20px; margin: 0;">โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย</h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">PCSHS Loei Open House 2026</p>
            </div>
            <div style="padding: 24px 0;">
              <p style="font-size: 15px; color: #1e293b;">สวัสดีคุณ <strong>${firstName || 'ผู้เข้าร่วมงาน'}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                ขอบคุณที่สนใจลงทะเบียนเข้าร่วมงาน <strong>PCSHS Loei Open House 2026</strong><br />
                รหัสยืนยันตัวตน OTP ของท่านคือ:
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ea580c; background-color: #fff7ed; padding: 16px 32px; border-radius: 12px; border: 2px dashed #f97316;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">
                รหัสนี้มีอายุการใช้งาน 10 นาที (หากท่านไม่ได้เป็นผู้ทำรายการ กรุณาข้ามอีเมลนี้)
              </p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
              © 2026 โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย เลย | PCSHS Loei Open House
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      emailSentReal = true;
      console.log(`[SMTP Success] Sent real OTP email to ${normalizedEmail}`);
    } catch (err: any) {
      console.error('[SMTP Error] Failed to send email via SMTP:', err.message);
      emailErrorMessage = err.message;
    }
  } else {
    console.log(`[SMTP Config Note] SMTP_USER and SMTP_PASS not set in process.env. Code generated for ${normalizedEmail}: ${code}`);
  }

  return res.json({
    success: true,
    email: normalizedEmail,
    emailSentReal,
    emailError: emailErrorMessage || undefined,
    otp: code,
    message: emailSentReal
      ? `ส่งรหัสยืนยัน OTP ไปยังอีเมล ${normalizedEmail} เรียบร้อยแล้ว`
      : `ระบบสร้างรหัส OTP (${code}) เรียบร้อยแล้ว`,
  });
});

// API Endpoint: Verify Email OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุอีเมลและรหัส OTP ให้ครบถ้วน',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore[normalizedEmail];

  if (!record) {
    return res.status(400).json({
      success: false,
      error: 'ไม่พบข้อมูลการขอรหัส OTP สำหรับอีเมลนี้ กรุณากดขอรหัสยืนยันใหม่อีกครั้ง',
    });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[normalizedEmail];
    return res.status(400).json({
      success: false,
      error: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสยืนยันใหม่อีกครั้ง',
    });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({
      success: false,
      error: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสจากอีเมลที่ได้รับแล้วลองใหม่อีกครั้ง',
    });
  }

  // OTP is valid
  delete otpStore[normalizedEmail];

  return res.json({
    success: true,
    message: 'ยืนยันรหัส OTP และอีเมลสำเร็จ',
  });
});

async function startServer() {
  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

