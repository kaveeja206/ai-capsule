import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <Layout>
      <section className="hero-split">
        <div className="hero-copy">
          <span className="pill">Private prompt library</span>
          <h1>Keep the prompts that actually work.</h1>
          <p className="lede">
            AI Capsule is a calm place to save prompts, capture what the model
            returned, and reuse the ones worth keeping — without the clutter.
          </p>
          <div className="hero-cta">
            {user ? (
              <Link className="btn btn-primary btn-lg" to="/dashboard">
                Open dashboard
              </Link>
            ) : (
              <Link className="btn btn-primary btn-lg" to="/login">
                Get started
              </Link>
            )}
            <a className="btn btn-secondary btn-lg" href="#features">
              See features
            </a>
          </div>
          <p className="hero-security">
            Sign in with GitHub. Sessions use an HttpOnly cookie — nothing sensitive
            in localStorage.
          </p>
        </div>
        <div className="hero-media">
          <div className="media-frame">
            <img
              src="/images/hero-desk.png"
              alt="Desk workspace with notebook and laptop"
            />
          </div>
        </div>
      </section>

      <p className="section-label" id="features">
        Why Capsule
      </p>
      <section className="grid-3">
        <article className="card">
          <div className="card-icon" aria-hidden="true">
            ✦
          </div>
          <h3>Own your history</h3>
          <p>
            Capture project, title, version, full prompt text, and a short response
            summary for every experiment.
          </p>
        </article>
        <article className="card">
          <div className="card-icon" aria-hidden="true">
            ◇
          </div>
          <h3>Stay organized</h3>
          <p>
            Tag by category, rate usefulness, and mark prompts as reviewed or
            improved so good ones are easy to find.
          </p>
        </article>
        <article className="card">
          <div className="card-icon" aria-hidden="true">
            ○
          </div>
          <h3>Private by default</h3>
          <p>
            Your library is yours alone. GitHub OAuth identifies you; the app never
            stores a password.
          </p>
        </article>
      </section>
    </Layout>
  );
}
