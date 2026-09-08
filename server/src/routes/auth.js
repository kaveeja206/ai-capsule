const express = require('express');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../auth');

const router = express.Router();

function clientUrl() {
  return process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173';
}

function callbackUrl() {
  return (
    process.env.GITHUB_CALLBACK_URL ||
    `${process.env.APP_URL || 'http://localhost:5000'}/auth/github/callback`
  );
}

/** Start GitHub OAuth */
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send(
      'GITHUB_CLIENT_ID is not configured. Set it in .env or use DEV_AUTH_BYPASS in development.'
    );
  }
  const redirectUri = encodeURIComponent(callbackUrl());
  const scope = encodeURIComponent('read:user');
  const url =
    `https://github.com/login/oauth/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}&scope=${scope}`;
  res.redirect(url);
});

/** GitHub OAuth callback — exchange code, mint app JWT, set cookie */
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing OAuth code');
  }
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl(),
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed', tokenData);
      return res.status(401).send('GitHub OAuth failed');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ai-capsule-app',
      },
    });
    const ghUser = await userRes.json();
    if (!ghUser.id) {
      return res.status(401).send('Failed to load GitHub user');
    }

    const appToken = signToken({
      userId: String(ghUser.id),
      login: ghUser.login,
    });
    setAuthCookie(res, appToken);
    res.redirect(`${clientUrl()}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error', err);
    res.status(500).send('OAuth error');
  }
});

/** Current user (from JWT cookie) */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, login: req.user.login } });
});

/** Logout — clear HttpOnly cookie */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

/**
 * DEV-ONLY auth bypass.
 * Only active when NODE_ENV=development AND DEV_AUTH_BYPASS=true.
 * Issues a real app JWT for a fake user so CRUD can be smoke-tested locally
 * without GitHub OAuth secrets. REMOVE / disable before marking / production.
 */
router.post('/dev-login', (req, res) => {
  const allowed =
    process.env.NODE_ENV === 'development' &&
    String(process.env.DEV_AUTH_BYPASS).toLowerCase() === 'true';
  if (!allowed) {
    return res.status(404).json({ error: 'Not found' });
  }
  const appToken = signToken({
    userId: 'dev-user-1',
    login: 'dev-local',
  });
  setAuthCookie(res, appToken);
  res.json({ ok: true, user: { id: 'dev-user-1', login: 'dev-local' } });
});

router.get('/dev-login', (req, res) => {
  const allowed =
    process.env.NODE_ENV === 'development' &&
    String(process.env.DEV_AUTH_BYPASS).toLowerCase() === 'true';
  if (!allowed) {
    return res.status(404).send('Not found');
  }
  const appToken = signToken({
    userId: 'dev-user-1',
    login: 'dev-local',
  });
  setAuthCookie(res, appToken);
  res.redirect(`${clientUrl()}/dashboard`);
});

module.exports = router;
