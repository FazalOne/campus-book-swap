#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function spawnProc(cmd, args, name) {
  const proc = spawn(cmd, args, { cwd: root, shell: true, env: process.env });
  proc.stdout.on('data', (data) => {
    process.stdout.write(`[${name}] ${data.toString()}`);
  });
  proc.stderr.on('data', (data) => {
    process.stderr.write(`[${name}] ${data.toString()}`);
  });
  proc.on('exit', (code, signal) => {
    console.log(`[${name}] exited with ${signal || code}`);
    shutdownAll();
  });
  proc.on('error', (err) => {
    console.error(`[${name}] error:`, err);
    shutdownAll();
  });
  return proc;
}

let children = [];

function shutdownAll() {
  for (const c of children) {
    try {
      if (!c.killed) c.kill('SIGTERM');
    } catch (e) {}
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down children...');
  shutdownAll();
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down children...');
  shutdownAll();
});

async function findAvailablePort(candidates) {
  const net = require('net');
  for (const p of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await new Promise((resolve) => {
      const srv = net.createServer();
      srv.once('error', () => {
        resolve(false);
      });
      srv.once('listening', () => {
        srv.close(() => resolve(true));
      });
      srv.listen(p, '127.0.0.1');
    });
    if (ok) return p;
  }
  return null;
}

(async () => {
  console.log('Starting backend (tsx server/index.ts) and Vite (npm run dev)...');

  // start backend
  children.push(spawnProc('npx', ['tsx', 'server/index.ts'], 'backend'));

  // Determine Vite port: prefer env var, else try common ports
  const envPort = process.env.VITE_PORT || process.env.DEV_PORT || process.env.PORT;
  let vitePort = envPort ? parseInt(envPort, 10) : null;
  // First, check if a Vite server is already running on common ports
  const candidates = [5173, 3000, 3001, 3002, 5174, 5175];

  // helper: detect Vite by requesting its client entry
  async function isViteRunningOn(p) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`http://127.0.0.1:${p}/@vite/client`, { signal: controller.signal });
      clearTimeout(id);
      return res && res.ok;
    } catch (e) {
      return false;
    }
  }

  let existingVitePort = null;
  for (const p of candidates) {
    // respect explicit envPort if provided
    if (envPort && parseInt(envPort, 10) !== p) continue;
    /* eslint-disable no-await-in-loop */
    const running = await isViteRunningOn(p);
    /* eslint-enable no-await-in-loop */
    if (running) { existingVitePort = p; break; }
  }

  if (existingVitePort) {
    console.log(`Detected existing Vite server on port ${existingVitePort}; skipping spawn.`);
    // open browser to existing vite
    const url = `http://localhost:${existingVitePort}`;
    openBrowser(url);
    return; // backend child is running; keep script alive until shutdown
  }

  if (!vitePort) {
    vitePort = await findAvailablePort(candidates);
  }
  if (!vitePort) {
    console.error('No available port found for Vite. Aborting.');
    shutdownAll();
    return;
  }

  console.log(`Launching Vite on port ${vitePort}`);
  const viteProc = spawnProc('npm', ['run', 'dev', '--', '--port', String(vitePort)], 'vite');
  children.push(viteProc);

  // open browser when Vite reports the local URL
  let opened = false;
  try {
    viteProc.stdout.on('data', (chunk) => {
      try {
        const s = chunk.toString();
        const m = s.match(/Local:\s+(https?:\/\/\S+)/);
        if (m && m[1] && !opened) {
          opened = true;
          openBrowser(m[1].replace(/\/?$/, '/'));
        }
      } catch (e) {}
    });
  } catch (e) {}
})();

function openBrowser(url) {
  const { spawn } = require('child_process');
  const plat = process.platform;
  const skipOpen =
    process.env.BROWSER === 'none' ||
    process.env.CI === 'true' ||
    process.env.NO_BROWSER === '1' ||
    (!process.env.DISPLAY && plat !== 'win32' && plat !== 'darwin');
  if (skipOpen) {
    console.log(`Browser auto-open skipped for ${url}`);
    return;
  }
  console.log(`Opening browser at ${url}`);
  try {
    let child;
    if (plat === 'win32') {
      child = spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' });
    } else if (plat === 'darwin') {
      child = spawn('open', [url], { detached: true, stdio: 'ignore' });
    } else {
      child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    }
    child.on('error', (e) => {
      console.error(`Browser open failed for ${url}:`, e.message);
    });
  } catch (e) {
    console.error('Failed to open browser:', e);
  }
}

module.exports = {};