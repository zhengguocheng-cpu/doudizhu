import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Application from './src/app';

function getAppVersion(): string {
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkgJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getGitInfo(): { branch: string; commit: string } | null {
  try {
    const commit = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return { branch, commit };
  } catch {
    return null;
  }
}

function logStartupInfo() {
  const version = getAppVersion();
  const git = getGitInfo();
  if (git) {
    console.log(
      `🚀 doudizhu-backend v${version} 启动中... (branch: ${git.branch}, commit: ${git.commit})`,
    );
  } else {
    console.log(`🚀 doudizhu-backend v${version} 启动中...`);
  }
}

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
(async () => {
  try {
    logStartupInfo();
    const app = new Application();
    await app.start();
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
})();