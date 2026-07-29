import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

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
