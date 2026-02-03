#!/usr/bin/env node

// Dev starter: picks a free port, starts Vite with that port, waits for it, then launches Electron
// Cross-platform: avoids shell `PORT=...` syntax by passing env into spawned processes

const getPort = require('get-port').default || require('get-port');
const { spawn } = require('child_process');
const path = require('path');
const isWin = process.platform === 'win32';
const viteCmd = path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'vite.cmd' : 'vite');
const electronCmd = path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'electron.cmd' : 'electron');
const waitOn = require('wait-on');

function spawnCmdBin(binPath, args, opts) {
  if (isWin) {
    return spawn('cmd', ['/c', binPath, ...args], opts);
  }
  return spawn(binPath, args, opts);
}

(async () => {
  try {
    const port = await getPort({ port: 5173 });
    const devUrl = `http://localhost:${port}`;

    const env = Object.assign({}, process.env, {
      PORT: String(port),
      DEV_SERVER_URL: devUrl
    });

    console.log(`Starting Vite on ${devUrl}...`);
    const vite = spawnCmdBin(viteCmd, [], { stdio: 'inherit', env });

    vite.on('exit', (code) => {
      // If Vite exits, also exit this script
      process.exit(code);
    });

    // Wait for Vite to be ready (ensure the exact pages Electron will load are available)
    await new Promise((resolve, reject) => {
      const resources = [
        `${devUrl}/src/settings/index.html`,
        `${devUrl}/src/pet/index.html`
      ];
      console.log('Waiting for Vite resources:', resources);
      waitOn({ resources, timeout: 60000 }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('Vite ready — launching Electron');
    const electron = spawnCmdBin(electronCmd, ['.'], { stdio: 'inherit', env });

    // Clean up children when this process exits
    const cleanup = () => {
      if (vite && !vite.killed) vite.kill();
      if (electron && !electron.killed) electron.kill();
    };

    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });
    process.on('exit', cleanup);

  } catch (err) {
    console.error('Failed to start dev processes:', err);
    process.exit(1);
  }
})();