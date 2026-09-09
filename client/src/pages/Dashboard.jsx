import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../api';

const emptyForm = {
  project_name: '',
  prompt_title: '',
  prompt_version: '',
  prompt_text: '',
  response_summary: '',
  category: '',
  usefulness: '',
  reviewed: false,
  improved: false,
  screenshot_url: '',
  notes: '',
};

export default function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.listCapsules();
      setCapsules(data);
    } catch (err) {
      setError(err.message || 'Failed to load capsules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function startEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || '',
      prompt_title: capsule.prompt_title || '',
      prompt_version: capsule.prompt_version || '',
      prompt_text: capsule.prompt_text || '',
      response_summary: capsule.response_summary || '',
      category: capsule.category || '',
      usefulness: capsule.usefulness || '',
      reviewed: Boolean(capsule.reviewed),
      improved: Boolean(capsule.improved),
      screenshot_url: capsule.screenshot_url || '',
      notes: capsule.notes || '',
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function focusNewForm() {
    const el = document.getElementById('capsule-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await api.updateCapsule(editingId, form);
        setMessage('Capsule updated.');
      } else {
        await api.createCapsule(form);
        setMessage('Capsule created.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this capsule? This cannot be undone.')) return;
    setError('');
    setMessage('');
    try {
      await api.deleteCapsule(id);
      if (editingId === id) resetForm();
      setMessage('Capsule deleted.');
      await load();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  return (
    <Layout>
      <div className="row-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Create and manage your private AI prompt capsules.
          </p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <div className="panel stack" id="capsule-form" style={{ marginBottom: '1.5rem' }}>
        <div className="row-between">
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
            {editingId ? `Edit capsule #${editingId}` : 'New capsule'}
          </h2>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <div className="form-row">
            <label>
              Project name *
              <input
                name="project_name"
                value={form.project_name}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Prompt title *
              <input
                name="prompt_title"
                value={form.prompt_title}
                onChange={onChange}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Prompt version
              <input
                name="prompt_version"
                value={form.prompt_version}
                onChange={onChange}
                placeholder="e.g. v1.2"
              />
            </label>
            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={onChange}
                placeholder="e.g. debugging, writing"
              />
            </label>
          </div>
          <label>
            Prompt text *
            <textarea
              name="prompt_text"
              value={form.prompt_text}
              onChange={onChange}
              required
            />
          </label>
          <label>
            Response summary
            <textarea
              name="response_summary"
              value={form.response_summary}
              onChange={onChange}
            />
          </label>
          <div className="form-row">
            <label>
              Usefulness
              <select name="usefulness" value={form.usefulness} onChange={onChange}>
                <option value="">—</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Screenshot URL
              <input
                name="screenshot_url"
                value={form.screenshot_url}
                onChange={onChange}
                placeholder="https://…"
              />
            </label>
          </div>
          <label>
            Notes
            <textarea name="notes" value={form.notes} onChange={onChange} />
          </label>
          <div className="checks">
            <label>
              <input
                type="checkbox"
                name="reviewed"
                checked={form.reviewed}
                onChange={onChange}
              />
              Reviewed
            </label>
            <label>
              <input
                type="checkbox"
                name="improved"
                checked={form.improved}
                onChange={onChange}
              />
              Improved
            </label>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update capsule' : 'Create capsule'}
            </button>
          </div>
        </form>
      </div>

      <div className="panel capsule-list-panel">
        <div className="row-between" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Your capsules</h2>
          <span className="muted" style={{ fontSize: '0.875rem' }}>
            {capsules.length} total
          </span>
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : capsules.length === 0 ? (
          <div className="empty-state">
            <img
              src="/images/empty-state.png"
              alt="Empty notebook — no capsules yet"
            />
            <h3>No capsules yet</h3>
            <p>
              Capture your first prompt above — project, version, notes, and all.
            </p>
            <button type="button" className="btn btn-primary" onClick={focusNewForm}>
              Create your first capsule
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Title</th>
                  <th>Version</th>
                  <th>Category</th>
                  <th>Flags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {capsules.map((c) => (
                  <tr key={c.id}>
                    <td>{c.project_name}</td>
                    <td>
                      <div>{c.prompt_title}</div>
                      <div className="muted" style={{ fontSize: '0.8rem' }}>
                        {c.created_at}
                      </div>
                    </td>
                    <td>{c.prompt_version || '—'}</td>
                    <td>{c.category ? <span className="pill">{c.category}</span> : '—'}</td>
                    <td className="muted" style={{ fontSize: '0.85rem' }}>
                      {c.reviewed ? 'reviewed ' : ''}
                      {c.improved ? 'improved' : ''}
                      {!c.reviewed && !c.improved ? '—' : ''}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => startEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => onDelete(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
