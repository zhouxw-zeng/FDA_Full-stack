const net = require('node:net');
const path = require('node:path');
const { execFileSync, spawn, spawnSync } = require('node:child_process');

const isWindows = process.platform === 'win32';

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isPortAccepting(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    const finish = (value) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function isPortAvailable(port) {
  const [ipv4InUse, ipv6InUse] = await Promise.all([
    isPortAccepting(port, '127.0.0.1'),
    isPortAccepting(port, '::1'),
  ]);
  return !ipv4InUse && !ipv6InUse;
}

function getListeningPids(port) {
  try {
    if (isWindows) {
      const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], {
        encoding: 'utf8',
        windowsHide: true,
      });
      const matcher = new RegExp(
        `^\\s*TCP\\s+\\S*:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)\\s*$`,
        'im',
      );
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        const match = line.match(matcher);
        if (match) {
          pids.add(Number(match[1]));
        }
      }
      return [...pids];
    }

    const output = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
    });
    return output
      .split(/\s+/)
      .map((value) => Number(value))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killProcessTree(pid) {
  if (!pid || pid === process.pid) {
    return false;
  }

  if (isWindows) {
    const taskkill = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
      stdio: 'ignore',
      windowsHide: true,
    });
    if (taskkill.status === 0) {
      return true;
    }

    const stopProcess = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', `Stop-Process -Id ${pid} -Force`],
      {
        encoding: 'utf8',
        windowsHide: true,
      },
    );
    if (stopProcess.status === 0) {
      return true;
    }

    const taskkillMessage = taskkill.stderr?.trim() || 'taskkill failed';
    const powershellMessage = stopProcess.stderr?.trim() || 'Stop-Process failed';
    console.warn(`[dev] 无法结束 PID ${pid}：${taskkillMessage}；${powershellMessage}`);
    return false;
  }

  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

async function ensurePortAvailable(port, label) {
  if (await isPortAvailable(port)) {
    return;
  }

  const pids = getListeningPids(port);
  if (pids.length === 0) {
    throw new Error(`${label}端口 ${port} 已被占用，但无法定位监听进程`);
  }

  console.log(`[dev] ${label}端口 ${port} 被占用，正在结束旧服务：PID ${pids.join(', ')}`);
  for (const pid of pids) {
    killProcessTree(pid);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(200);
    if (await isPortAvailable(port)) {
      return;
    }
  }

  throw new Error(
    `${label}端口 ${port} 仍被占用。请手动关闭上述 PID，或以管理员权限重新运行 pnpm run dev`,
  );
}

function ensureBackendPortAvailable(port) {
  return ensurePortAvailable(port, '后端');
}

class BackendDevServerPlugin {
  constructor({ port, serverDir }) {
    this.port = port;
    this.serverDir = serverDir;
    this.child = null;
    this.startPromise = null;
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapPromise('BackendDevServerPlugin', () => this.startBackend());
    compiler.hooks.watchRun.tapPromise('BackendDevServerPlugin', () => this.startBackend());
    compiler.hooks.watchClose.tap('BackendDevServerPlugin', () => this.stopBackend());

    const shutdown = () => this.stopBackend();
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }

  startBackend() {
    if (this.child && this.child.exitCode === null) {
      return Promise.resolve();
    }

    if (!this.startPromise) {
      this.startPromise = (async () => {
        await ensureBackendPortAvailable(this.port);
        console.log(`[backend] 正在启动 NestJS，端口 ${this.port}`);

        const nestCliPath = path.join(
          this.serverDir,
          'node_modules',
          '@nestjs',
          'cli',
          'bin',
          'nest.js',
        );
        const child = spawn(process.execPath, [nestCliPath, 'start', '--watch'], {
          cwd: this.serverDir,
          shell: false,
          stdio: 'inherit',
          windowsHide: true,
        });

        this.child = child;
        child.once('exit', (code) => {
          console.log(`[backend] 进程已退出：code ${code ?? 'null'}`);
          this.child = null;
          this.startPromise = null;
        });
      })();
    }

    return this.startPromise;
  }

  stopBackend() {
    if (!this.child || this.child.exitCode !== null) {
      return;
    }

    killProcessTree(this.child.pid);
    this.child = null;
    this.startPromise = null;
  }
}

module.exports = {
  BackendDevServerPlugin,
  ensureBackendPortAvailable,
  ensurePortAvailable,
};
