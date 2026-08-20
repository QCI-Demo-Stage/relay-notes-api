import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('/health returns HTTP 200 with status ok', async (t) => {
  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  t.after(() =>
    new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    }),
  );

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });
});
