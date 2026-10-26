const assert = require('assert');
const app = require('../app');
const db = require('../db');

(async () => {
  db.resetMemory();
  const server = app.listen(0);
  const port = server.address().port;
  const get = path => fetch(`http://127.0.0.1:${port}${path}`);
  const send = (method, path) => fetch(`http://127.0.0.1:${port}${path}`, { method });
  try {
    let response = await get('/');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).deletionPolicy, 'soft-delete');

    response = await get('/users');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).length, 2);

    response = await send('DELETE', '/users/1');
    assert.equal(response.status, 200);
    assert.match((await response.json()).message, /soft-deleted/);

    response = await get('/users');
    assert.deepEqual((await response.json()).map(row => row.id), [2]);
    response = await get('/users/1');
    assert.equal(response.status, 404);
    response = await get('/users/audit/deleted');
    const deletedUser = await response.json();
    assert.equal(response.status, 200);
    assert.equal(deletedUser.length, 1);
    assert.equal(deletedUser[0].id, 1);
    assert.ok(deletedUser[0].deleted_at);

    response = await send('POST', '/users/1/restore');
    assert.equal(response.status, 200);
    response = await get('/users');
    assert.equal((await response.json()).length, 2);

    response = await send('DELETE', '/accounts/10');
    assert.equal(response.status, 200);
    response = await get('/accounts');
    assert.deepEqual((await response.json()).map(row => row.id), [11]);
    response = await get('/accounts/audit/deleted');
    assert.deepEqual((await response.json()).map(row => row.id), [10]);

    response = await send('DELETE', '/transactions/100');
    assert.equal(response.status, 200);
    response = await get('/transactions');
    assert.deepEqual((await response.json()).map(row => row.id), [101]);
    response = await get('/transactions/audit/deleted');
    assert.deepEqual((await response.json()).map(row => row.id), [100]);

    console.log('PASS: active filters hide deleted rows, audit routes retain them, and restore recovers users');
  } finally {
    server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
