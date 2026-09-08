const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

// All capsule routes require JWT from cookie
router.use(requireAuth);

function rowToCapsule(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    project_name: row.project_name,
    prompt_title: row.prompt_title,
    prompt_version: row.prompt_version,
    prompt_text: row.prompt_text,
    response_summary: row.response_summary,
    category: row.category,
    usefulness: row.usefulness,
    reviewed: Boolean(row.reviewed),
    improved: Boolean(row.improved),
    screenshot_url: row.screenshot_url,
    notes: row.notes,
    created_at: row.created_at,
  };
}

/** GET /api/capsules — list current user's capsules */
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id);
  res.json(rows.map(rowToCapsule));
});

/** POST /api/capsules — create capsule owned by JWT user */
router.post('/', (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body || {};

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title, and prompt_text are required',
    });
  }

  const info = db
    .prepare(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      String(project_name).trim(),
      String(prompt_title).trim(),
      prompt_version != null ? String(prompt_version) : null,
      String(prompt_text),
      response_summary != null ? String(response_summary) : null,
      category != null ? String(category) : null,
      usefulness != null ? String(usefulness) : null,
      reviewed ? 1 : 0,
      improved ? 1 : 0,
      screenshot_url != null ? String(screenshot_url) : null,
      notes != null ? String(notes) : null
    );

  const row = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(rowToCapsule(row));
});

/** PUT /api/capsules/:id — update own capsule only */
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body || {};
  const project_name =
    body.project_name != null ? String(body.project_name).trim() : existing.project_name;
  const prompt_title =
    body.prompt_title != null ? String(body.prompt_title).trim() : existing.prompt_title;
  const prompt_text =
    body.prompt_text != null ? String(body.prompt_text) : existing.prompt_text;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: 'project_name, prompt_title, and prompt_text are required',
    });
  }

  db.prepare(
    `UPDATE capsules SET
      project_name = ?,
      prompt_title = ?,
      prompt_version = ?,
      prompt_text = ?,
      response_summary = ?,
      category = ?,
      usefulness = ?,
      reviewed = ?,
      improved = ?,
      screenshot_url = ?,
      notes = ?
    WHERE id = ? AND user_id = ?`
  ).run(
    project_name,
    prompt_title,
    body.prompt_version !== undefined
      ? body.prompt_version != null
        ? String(body.prompt_version)
        : null
      : existing.prompt_version,
    prompt_text,
    body.response_summary !== undefined
      ? body.response_summary != null
        ? String(body.response_summary)
        : null
      : existing.response_summary,
    body.category !== undefined
      ? body.category != null
        ? String(body.category)
        : null
      : existing.category,
    body.usefulness !== undefined
      ? body.usefulness != null
        ? String(body.usefulness)
        : null
      : existing.usefulness,
    body.reviewed !== undefined ? (body.reviewed ? 1 : 0) : existing.reviewed,
    body.improved !== undefined ? (body.improved ? 1 : 0) : existing.improved,
    body.screenshot_url !== undefined
      ? body.screenshot_url != null
        ? String(body.screenshot_url)
        : null
      : existing.screenshot_url,
    body.notes !== undefined
      ? body.notes != null
        ? String(body.notes)
        : null
      : existing.notes,
    id,
    req.user.id
  );

  const row = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  res.json(rowToCapsule(row));
});

/** DELETE /api/capsules/:id — delete own capsule only */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const existing = db.prepare('SELECT * FROM capsules WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ ok: true, id });
});

module.exports = router;
