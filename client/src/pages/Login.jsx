import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { api } from '../api';

export default function Login() {
  const { user, refresh, setUser } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleDevLogin() {
    setBusy(true);
    setError('');
    try {
      const data = await api.devLogin();
      setUser(data.user);
      await refresh();
    } catch (err) {
      setError(
        err.message ||
          'Dev login unavailable. Enable DEV_AUTH_BYPASS=true with NODE_ENV=development, or use GitHub OAuth.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="login-split">
        <div className="login-visual">
          <img
            src="/images/login-panel.png"
            alt="Calm workspace with notebook and coffee"
          />
        </div>
        <div className="login-form-side">
          <h1>Welcome back</h1>
          <p className="lede">
            Sign in to your private capsule library. After login the server sets an
            HttpOnly cookie named <code className="mono">token</code>.
          </p>
          {error && <div className="error">{error}</div>}
          <div className="stack">
            <a className="btn btn-primary btn-lg" href="/auth/github">
              Continue with GitHub
            </a>
            <Link className="btn btn-secondary" to="/">
              Back to home
            </Link>
          </div>
          <div className="dev-note">
            <strong>DEV ONLY</strong> — local smoke-test without OAuth secrets.
            Requires <code className="mono">NODE_ENV=development</code> and{' '}
            <code className="mono">DEV_AUTH_BYPASS=true</code>. Disable before marking.
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={handleDevLogin}
              >
                {busy ? 'Signing in…' : 'Dev login (fake user)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
