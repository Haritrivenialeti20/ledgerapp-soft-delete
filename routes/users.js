const express = require('express');
const router = express.Router();
const db = require('../db');

// Normal responses contain active users only.
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE deleted_at IS NULL');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Database execution error' }); }
});

// Audit/admin view: intentionally returns only retained deleted users.
router.get('/audit/deleted', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE deleted_at IS NOT NULL');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Audit query failed' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Database retrieval error' }); }
});

router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'User creation failed' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Active user not found' });
    res.json({ message: 'User soft-deleted and retained for recovery/audit' });
  } catch (err) { res.status(500).json({ error: 'Soft-delete operation failed' }); }
});

router.post('/:id/restore', async (req, res) => {
  try {
    const { rowCount } = await db.query('UPDATE users SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Deleted user not found' });
    res.json({ message: 'User restored' });
  } catch (err) { res.status(500).json({ error: 'Restore operation failed' }); }
});
module.exports = router;
