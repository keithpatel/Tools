const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const lockFile = path.join(__dirname, '.next', 'dev', 'lock');
try { fs.unlinkSync(lockFile); } catch(e) {}

const logFd = fs.openSync(path.join(__dirname, '.next', 'dev', 'server.log'), 'a');

const child = spawn(process.execPath, [
  path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
  'dev', '--webpack', '-p', '3456'
], {
  detached: true,
  stdio: ['ignore', logFd, logFd],
  cwd: __dirname,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=3072' }
});

child.unref();
console.log('Dev server started with PID', child.pid);
