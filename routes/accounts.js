const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try { const { rows } = await db.query('SELECT * FROM accounts WHERE deleted_at IS NULL'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Database execution error' }); }
});
router.get('/audit/deleted', async (req, res) => {
  try { const { rows } = await db.query('SELECT * FROM accounts WHERE deleted_at IS NOT NULL'); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Audit query failed' }); }
});
router.get('/user/:userId', async (req, res) => {
  try { const { rows } = await db.query('SELECT * FROM accounts WHERE user_id = $1 AND deleted_at IS NULL', [req.params.userId]); res.json(rows); }
  catch (err) { res.status(500).json({ error: 'Database retrieval error' }); }
});
router.post('/', async (req, res) => {
  const { user_id, account_type, balance } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO accounts (user_id, account_type, balance) VALUES ($1, $2, $3) RETURNING *', [user_id, account_type, balance]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Account creation failed' }); }
});
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query('UPDATE accounts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Active account not found' });
    res.json({ message: 'Account soft-deleted and retained for recovery/audit' });
  } catch (err) { res.status(500).json({ error: 'Soft-delete operation failed' }); }
});
router.post('/:id/restore', async (req, res) => {
  try {
    const { rowCount } = await db.query('UPDATE accounts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Deleted account not found' });
    res.json({ message: 'Account restored' });
  } catch (err) { res.status(500).json({ error: 'Restore operation failed' }); }
});
module.exports = router;
