/**
 * 빌드 결과물 정리 스크립트
 * Node.js v14+ 기본 기능 사용 (rimraf 불필요)
 */
const { rm } = require('fs/promises');
const path = require('path');
const os = require('os');

const paths = [
  'dist',
  'frontend/dist',
  'backend/dist',
  'backend/build',
  'resources',
];

// electron-builder 캐시 경로 (플랫폼별)
const getElectronBuilderCachePath = () => {
  const platform = process.platform;
  const homeDir = os.homedir();
  
  if (platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Local', 'electron-builder', 'Cache');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Caches', 'electron-builder');
  } else {
    return path.join(homeDir, '.cache', 'electron-builder');
  }
};

const run = async () => {
  console.log('[CLEAN] Cleaning build artifacts...\n');
  
  // Clean general build artifacts
  for (const p of paths) {
    try {
      await rm(p, { recursive: true, force: true });
      console.log(`[OK] Deleted: ${p}`);
    } catch (e) {
      // Use force: true to avoid errors if folder doesn't exist
      console.log(`[SKIP] ${p} (not found)`);
    }
  }
  
  // Clean electron-builder cache
  const cachePath = getElectronBuilderCachePath();
  try {
    await rm(cachePath, { recursive: true, force: true });
    console.log(`[OK] Deleted: electron-builder cache (${cachePath})`);
  } catch (e) {
    console.log(`[SKIP] electron-builder cache (not found)`);
  }
  
  // Clean winCodeSign cache (Windows only)
  if (process.platform === 'win32') {
    const winCodeSignCachePath = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign');
    try {
      await rm(winCodeSignCachePath, { recursive: true, force: true });
      console.log(`[OK] Deleted: winCodeSign cache (${winCodeSignCachePath})`);
    } catch (e) {
      console.log(`[SKIP] winCodeSign cache (not found)`);
    }
  }
  
  console.log('\n[CLEAN] Cleanup completed!');
};

run().catch((error) => {
  console.error('[ERROR] Cleanup failed:', error);
  process.exit(1);
});

