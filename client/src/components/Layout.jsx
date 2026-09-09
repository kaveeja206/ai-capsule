import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="container">
      <nav className="nav">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="AI Capsule" className="brand-logo" />
          AI Capsule
        </Link>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">@{user.login}</span>
              <Link className="btn btn-secondary" to="/dashboard">
                Dashboard
              </Link>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      {children}
      <footer className="footer">
        AI Capsule · Private prompt library
      </footer>
    </div>
  );
}
