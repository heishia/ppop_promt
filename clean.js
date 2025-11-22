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
  console.log('🧹 빌드 결과물 정리 중...\n');
  
  // 일반 빌드 결과물 정리
  for (const p of paths) {
    try {
      await rm(p, { recursive: true, force: true });
      console.log(`✅ 삭제 완료: ${p}`);
    } catch (e) {
      // 폴더가 없어도 에러가 나지 않도록 force: true 사용
      console.log(`⏭️  건너뜀: ${p} (존재하지 않음)`);
    }
  }
  
  // electron-builder 캐시 정리
  const cachePath = getElectronBuilderCachePath();
  try {
    await rm(cachePath, { recursive: true, force: true });
    console.log(`✅ 삭제 완료: electron-builder 캐시 (${cachePath})`);
  } catch (e) {
    console.log(`⏭️  건너뜀: electron-builder 캐시 (존재하지 않음)`);
  }
  
  console.log('\n✨ 정리 완료!');
};

run().catch((error) => {
  console.error('❌ 정리 중 오류 발생:', error);
  process.exit(1);
});

