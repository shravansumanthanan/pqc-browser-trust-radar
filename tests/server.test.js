const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Start server on a test port
process.env.PORT = '3099';
const serverApp = require('../server.js');

function fetchJson(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:3099${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

test('GET /api/presets returns domain benchmarking targets', async () => {
  const res = await fetchJson('/api/presets');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 3);
  const cloudflare = res.body.find(p => p.hostname === 'pq.cloudflareresearch.com');
  assert.ok(cloudflare);
  assert.equal(cloudflare.status, 'Hybrid-Ready');
});

test('GET /api/telemetry returns hardware status & profile recommendation', async () => {
  const res = await fetchJson('/api/telemetry');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(typeof res.body.batteryLevel === 'number');
  assert.ok(res.body.recommendedProfile);
});

test('POST /api/session/purge executes memory zeroization & returns TPM seal', async () => {
  const payload = JSON.stringify({
    sessionId: 'EPHEM-TEST-UNIT',
    memorySizeBytes: 1048576
  });
  const res = await fetchJson('/api/session/purge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.certificateId.startsWith('SHRED-CERT-'));
  assert.ok(res.body.hardwareAttestationSeal);
  assert.ok(res.body.tpmPcr15State.startsWith('PCR15:'));
  assert.equal(res.body.passesExecuted.length, 3);
});

test('GET /api/scan?url=pq.cloudflareresearch.com returns TLS posture', async () => {
  const res = await fetchJson('/api/scan?url=pq.cloudflareresearch.com');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'Hybrid-Ready');
  assert.equal(res.body.nistLevel, 3);
});
