const net = require('node:net');
const path = require('node:path');
const { execFileSync, spawn, spawnSync } = require('node:child_process');

const isWindows = process.platform === 'win32';

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * 端口是否可绑定。
 * 这里刻意用真实 bind 探测而不是连接探测：在带代理 / 沙箱的环境里，
 * 旧进程已经退出、netstat 也没有监听项，但 connect 仍然可能被拦截层接受，
 * 从而把空闲端口误判成占用。
 */
function canBindPort(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    const finish = (value) => {
      server.removeAllListeners();
      server.close(() => resolve(value));
    };

    server.once('error', (error) => {
      server.removeAllListeners();
      // 只有 EADDRINUSE 表示端口被占用；地址族不可用等情况不算占用
      resolve(error.code !== 'EADDRINUSE');
    });
    server.once('listening', () => finish(true));
    server.listen({ port, host, exclusive: true });
  });
}

async function isPortAvailable(port) {
  const ipv4Available = await canBindPort(port, '0.0.0.0');
  if (!ipv4Available) {
    return false;
  }
  return canBindPort(port, '::');
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

/**
 * 尝试结束占用端口的进程，返回端口是否已释放。
 * 分多轮重试：进程退出、套接字真正释放都需要时间，且进程可能在重试期间换 PID。
 */
async function releasePort(port, label) {
  if (await isPortAvailable(port)) {
    return true;
  }

  const pids = getListeningPids(port);
  if (pids.length === 0) {
    console.log(`[dev] ${label}端口 ${port} 显示被占用，但未定位到监听进程，等待其释放`);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await delay(250);
      if (await isPortAvailable(port)) {
        return true;
      }
    }
    return false;
  }

  console.log(`[dev] ${label}端口 ${port} 被占用，正在结束旧服务：PID ${pids.join(', ')}`);
  const killed = pids.map((pid) => killProcessTree(pid)).some(Boolean);
  if (!killed) {
    // 完全没有权限结束旧进程，直接让调用方顺延端口，不再空等
    return false;
  }

  // 进程已结束，但监听套接字回收需要一点时间，这里给足等待窗口（约 12 秒）
  for (let attempt = 0; attempt < 48; attempt += 1) {
    await delay(250);
    if (await isPortAvailable(port)) {
      return true;
    }
  }

  return false;
}

/**
 * 申请一个可用端口：优先释放并沿用期望端口；
 * 释放失败（典型情况是旧进程由其它用户 / 管理员权限启动）时顺延到后续端口，
 * 保证 `pnpm run dev` 不会因为端口问题直接中断。
 */
async function resolvePort({ preferredPort, label, fallbackLimit = 10 }) {
  if (await releasePort(preferredPort, label)) {
    return preferredPort;
  }

  for (let offset = 1; offset <= fallbackLimit; offset += 1) {
    const candidate = preferredPort + offset;
    if (await isPortAvailable(candidate)) {
      console.warn(
        `[dev] ${label}端口 ${preferredPort} 无法释放（可能由其它用户或管理员权限启动），改用 ${candidate}`,
      );
      return candidate;
    }
  }

  throw new Error(
    `${label}端口 ${preferredPort} 及后续 ${fallbackLimit} 个候选端口都不可用，请手动清理后重试`,
  );
}

async function ensurePortAvailable(port, label) {
  if (!(await releasePort(port, label))) {
    throw new Error(`${label}端口 ${port} 仍被占用，请手动关闭监听进程后重试`);
  }
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
  releasePort,
  resolvePort,
};
