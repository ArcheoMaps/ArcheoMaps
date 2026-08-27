'use strict';
const { spawn, execFileSync } = require('child_process');
const path = require('path');

const CURATOR_DIR = path.join(__dirname, '..', 'curator');
const PORT = process.env.CURATOR_TEST_PORT || '8791';

function waitForServer(url, retries) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      try {
        execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], { timeout: 2000 });
        resolve();
      } catch (e) {
        if (n <= 0) return reject(new Error('server never became ready'));
        setTimeout(() => attempt(n - 1), 300);
      }
    };
    attempt(retries);
  });
}

async function main() {
  const server = spawn('python3', ['-m', 'http.server', PORT, '--bind', '127.0.0.1'], {
    cwd: CURATOR_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverExited = false;
  server.on('exit', () => { serverExited = true; });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/index.html`, 20);
    console.log('[orchestrator] server ready on port', PORT);

    const testProc = spawn('node', [path.join(__dirname, 'manual-browser-check.js')], {
      env: Object.assign({}, process.env, { CURATOR_BASE_URL: `http://127.0.0.1:${PORT}` }),
      stdio: 'inherit',
    });

    const exitCode = await new Promise((resolve) => {
      testProc.on('exit', (code) => resolve(code));
    });

    process.exitCode = exitCode;
  } finally {
    if (!serverExited) server.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error('[orchestrator] FATAL:', e.message);
  process.exitCode = 1;
});
