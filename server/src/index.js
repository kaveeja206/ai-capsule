const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Load .env from monorepo root, then server/
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Ensure DB schema exists on start
require('./db');

const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// In development, allow Vite origin with credentials (cookies).
// In production, same-origin static serve — CORS not needed.
if (!isProd) {
  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
    })
  );
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api/capsules', capsuleRoutes);

// Production: serve React build from client/dist
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  if (
    process.env.NODE_ENV === 'development' &&
    String(process.env.DEV_AUTH_BYPASS).toLowerCase() === 'true'
  ) {
    console.log('DEV_AUTH_BYPASS enabled: GET/POST /auth/dev-login available');
  }
});
