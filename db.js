const { Pool } = require('pg');
require('dotenv').config();

const memory = {
  users: [
    { id: 1, name: 'Ada Lovelace', email: 'ada@ledger.test', created_at: '2025-01-01T00:00:00.000Z', deleted_at: null },
    { id: 2, name: 'Grace Hopper', email: 'grace@ledger.test', created_at: '2025-01-02T00:00:00.000Z', deleted_at: null },
  ],
  accounts: [
    { id: 10, user_id: 1, account_type: 'checking', balance: '1250.00', created_at: '2025-01-03T00:00:00.000Z', deleted_at: null },
    { id: 11, user_id: 2, account_type: 'savings', balance: '900.00', created_at: '2025-01-04T00:00:00.000Z', deleted_at: null },
  ],
  transactions: [
    { id: 100, account_id: 10, amount: '100.00', type: 'credit', description: 'Invoice payment', created_at: '2025-01-05T00:00:00.000Z', deleted_at: null },
    { id: 101, account_id: 10, amount: '25.00', type: 'debit', description: 'Office supplies', created_at: '2025-01-06T00:00:00.000Z', deleted_at: null },
  ],
};

function now() { return new Date().toISOString(); }
function clone(rows) { return rows.map(row => ({ ...row })); }
function memoryQuery(text, params = []) {
  const sql = text.replace(/\s+/g, ' ').trim().toLowerCase();
  const table = sql.includes('from users') || sql.includes('update users') ? 'users' : sql.includes('from accounts') || sql.includes('update accounts') ? 'accounts' : 'transactions';
  const rows = memory[table];
  if (sql.startsWith('select')) {
    let result = rows;
    if (sql.includes('deleted_at is null')) result = result.filter(row => row.deleted_at === null);
    if (sql.includes('deleted_at is not null')) result = result.filter(row => row.deleted_at !== null);
    if (sql.includes('where id = $1')) result = result.filter(row => row.id === Number(params[0]));
    if (sql.includes('where user_id = $1')) result = result.filter(row => row.user_id === Number(params[0]));
    if (sql.includes('where account_id = $1')) result = result.filter(row => row.account_id === Number(params[0]));
    return Promise.resolve({ rows: clone(result), rowCount: result.length });
  }
  if (sql.startsWith('update')) {
    const row = rows.find(item => item.id === Number(params[0]));
    if (!row) return Promise.resolve({ rows: [], rowCount: 0 });
    if (sql.includes('set deleted_at = null')) {
      if (row.deleted_at === null) return Promise.resolve({ rows: [], rowCount: 0 });
      row.deleted_at = null;
    } else {
      if (row.deleted_at !== null) return Promise.resolve({ rows: [], rowCount: 0 });
      row.deleted_at = now();
    }
    return Promise.resolve({ rows: clone([row]), rowCount: 1 });
  }
  if (sql.startsWith('insert')) throw new Error('memory adapter only supports read/delete verification');
  return Promise.resolve({ rows: [], rowCount: 0 });
}

const pool = process.env.DB_URL ? new Pool({ connectionString: process.env.DB_URL }) : null;
if (pool) pool.on('error', err => console.error('Unexpected error on idle client', err));
module.exports = {
  query: (text, params) => pool ? pool.query(text, params) : memoryQuery(text, params),
  resetMemory: () => {
    memory.users.forEach(row => { row.deleted_at = null; });
    memory.accounts.forEach(row => { row.deleted_at = null; });
    memory.transactions.forEach(row => { row.deleted_at = null; });
  },
};
