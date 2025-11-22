/**
 * 빌드 결과물 정리 스크립트
 * Node.js v14+ 기본 기능 사용 (rimraf 불필요)
 */
const { rm } = require('fs/promises');
const path = require('path');

const paths = [
  'dist',
  'frontend/dist',
  'backend/dist',
  'backend/build',
  'resources',
];

const run = async () => {
  console.log('🧹 빌드 결과물 정리 중...\n');
  
  for (const p of paths) {
    try {
      await rm(p, { recursive: true, force: true });
      console.log(`✅ 삭제 완료: ${p}`);
    } catch (e) {
      // 폴더가 없어도 에러가 나지 않도록 force: true 사용
      console.log(`⏭️  건너뜀: ${p} (존재하지 않음)`);
    }
  }
  
  console.log('\n✨ 정리 완료!');
};

run().catch((error) => {
  console.error('❌ 정리 중 오류 발생:', error);
  process.exit(1);
});

