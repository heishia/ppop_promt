# CI/CD Pipeline Test Guide

이 문서는 새로 구축된 CI/CD 파이프라인을 테스트하는 방법을 설명합니다.

## 사전 준비사항

### 1. GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에서 다음 secrets를 추가하세요:

#### 필수 Secrets

1. **GH_TOKEN**
   - GitHub Personal Access Token
   - 생성 방법: https://github.com/settings/tokens
   - 필요한 권한: `repo` (Full control of private repositories)
   - 용도: GitHub Release 생성 및 파일 업로드

2. **CSC_KEY_PASSWORD** (코드 사이닝을 사용하는 경우)
   - 인증서 비밀번호
   - 기본값: `ppop_promt_cert_password_2025`
   - 용도: Windows 실행 파일 코드 사이닝

#### 선택 Secrets

3. **CSC_LINK** (인증서를 GitHub에 저장하는 경우)
   - Base64로 인코딩된 인증서 파일
   - 인코딩 방법:
     ```powershell
     # PowerShell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx"))
     ```
   - 용도: CI/CD 환경에서 코드 사이닝

### 2. 로컬 환경 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# env.template 파일을 복사하여 사용
GH_TOKEN=your_github_token_here
CSC_KEY_PASSWORD=ppop_promt_cert_password_2025
DEBUG=false
```

### 3. Git Release 명령어 설정

```bash
npm run setup:release
```

이 명령어는 `git release` alias를 생성합니다.

## 테스트 시나리오

### 시나리오 1: 로컬 빌드 테스트

CI/CD를 테스트하기 전에 로컬에서 빌드가 정상 작동하는지 확인합니다.

```bash
# 1. 의존성 설치
npm install
cd frontend && npm install && cd ..

# 2. 빌드 검증 스크립트 테스트 (빌드 전에는 실패해야 함)
node scripts/verify-build.js
# 예상 결과: dist 폴더가 없어서 실패

# 3. 로컬 빌드 (GitHub 업로드 없이)
npm run build:local

# 4. 빌드 검증
node scripts/verify-build.js
# 예상 결과: 모든 검증 통과

# 5. 빌드 결과물 확인
dir dist
# 예상 파일:
# - ppop_promt Setup 1.1.0.exe
# - ppop_promt Setup 1.1.0.exe.blockmap
# - latest.yml
```

### 시나리오 2: 테스트 릴리스 (Patch 버전)

실제 CI/CD 파이프라인을 테스트합니다.

```bash
# 1. 현재 브랜치 확인
git branch --show-current
# main 또는 master 브랜치에 있어야 함

# 2. 작업 디렉토리가 깨끗한지 확인
git status
# 커밋되지 않은 변경사항이 있으면 커밋

# 3. git release 실행
git release

# 4. 프롬프트에 따라 선택
# - 버전 타입: 1 (patch) 선택
# - 예: 1.1.0 -> 1.1.1
# - 확인: y

# 5. GitHub Actions 모니터링
# https://github.com/heishia/ppop_promt/actions
# Release 워크플로우가 자동으로 시작됨
```

### 시나리오 3: GitHub Actions 워크플로우 확인

1. **Actions 탭 접속**
   - https://github.com/heishia/ppop_promt/actions
   - 최근 실행된 "Release" 워크플로우 클릭

2. **빌드 단계 확인**
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Setup Python
   - ✅ Cache Electron Builder
   - ✅ Install dependencies
   - ✅ Build Backend
   - ✅ Build Frontend
   - ✅ Build Electron App (코드 사이닝 포함)
   - ✅ Verify Build Output (새로 추가된 검증 단계)
   - ✅ Create Release
   - ✅ Delete Old Releases (3개 초과 시)
   - ✅ Upload Build Artifacts

3. **예상 소요 시간**
   - 첫 빌드: 15-20분 (캐시 없음)
   - 이후 빌드: 10-15분 (캐시 활용)

### 시나리오 4: 릴리스 확인

빌드가 성공하면 다음을 확인합니다:

1. **GitHub Release 페이지**
   - https://github.com/heishia/ppop_promt/releases
   - 새 릴리스가 생성되었는지 확인
   - 다음 파일들이 업로드되었는지 확인:
     - `ppop_promt Setup X.X.X.exe`
     - `ppop_promt Setup X.X.X.exe.blockmap`
     - `latest.yml`

2. **latest.yml 내용 확인**
   - 릴리스 페이지에서 `latest.yml` 다운로드
   - 버전 정보가 올바른지 확인
   - 파일 경로와 해시가 포함되어 있는지 확인

3. **이전 릴리스 정리 확인**
   - 릴리스가 3개를 초과하면 오래된 릴리스가 자동 삭제됨
   - 최근 3개만 남아있는지 확인

### 시나리오 5: 자동 업데이트 테스트

실제 사용자 경험을 테스트합니다.

1. **이전 버전 설치**
   - 이전 릴리스에서 설치 파일 다운로드
   - 설치 실행

2. **앱 실행**
   - 앱이 시작되면 자동으로 업데이트 확인
   - 새 버전 알림이 표시되는지 확인

3. **업데이트 다운로드**
   - "다운로드" 버튼 클릭
   - 다운로드 진행률 표시 확인

4. **업데이트 설치**
   - 다운로드 완료 후 "재시작" 프롬프트 확인
   - 재시작하여 업데이트 설치
   - 새 버전으로 업데이트되었는지 확인

## 예상 결과

### 성공 시나리오

1. ✅ 로컬 빌드 성공
2. ✅ GitHub Actions 워크플로우 성공
3. ✅ 빌드 검증 통과
4. ✅ GitHub Release 자동 생성
5. ✅ 파일 업로드 완료
6. ✅ 이전 릴리스 정리 (3개 초과 시)
7. ✅ 자동 업데이트 알림 표시
8. ✅ 업데이트 다운로드 및 설치 성공

### 실패 시나리오 및 해결 방법

#### 1. 빌드 검증 실패

**증상**: "Verify Build Output" 단계에서 실패

**원인**:
- 설치 파일이 생성되지 않음
- latest.yml 구조가 잘못됨
- 버전 불일치

**해결**:
```bash
# 로컬에서 빌드 검증 테스트
npm run build:local
node scripts/verify-build.js

# 에러 메시지 확인 후 수정
```

#### 2. 코드 사이닝 실패

**증상**: "Build Electron App" 단계에서 실패

**원인**:
- CSC_KEY_PASSWORD 설정 안 됨
- 인증서 파일 없음

**해결**:
- GitHub Secrets에 CSC_KEY_PASSWORD 추가
- 또는 서명 없이 빌드:
  ```yaml
  # .github/workflows/release.yml에서 CSC 환경변수 제거
  ```

#### 3. GitHub Release 생성 실패

**증상**: "Create Release" 단계에서 실패

**원인**:
- GH_TOKEN 권한 부족
- 같은 태그가 이미 존재

**해결**:
```bash
# 기존 태그 삭제
git tag -d v1.1.1
git push origin :refs/tags/v1.1.1

# GitHub에서 릴리스 수동 삭제 후 재시도
```

#### 4. 자동 업데이트 작동 안 함

**증상**: 앱에서 업데이트 알림이 표시되지 않음

**원인**:
- latest.yml 파일이 릴리스에 없음
- electron-updater 설정 오류
- 개발 모드에서 실행 중

**해결**:
- 릴리스에 latest.yml이 있는지 확인
- 패키징된 앱으로 테스트 (개발 모드 아님)
- electron.js의 autoUpdater 설정 확인

## 롤백 절차

빌드가 실패하거나 문제가 있는 경우:

```bash
# 1. 로컬 태그 삭제
git tag -d v1.1.1

# 2. 원격 태그 삭제
git push origin :refs/tags/v1.1.1

# 3. GitHub에서 릴리스 삭제
# https://github.com/heishia/ppop_promt/releases

# 4. package.json 버전 되돌리기
# "version": "1.1.0"

# 5. 커밋
git add package.json
git commit -m "revert: rollback to v1.1.0"
git push

# 6. 문제 수정 후 재시도
```

## 모니터링 및 디버깅

### GitHub Actions 로그 확인

1. Actions 탭에서 실패한 워크플로우 클릭
2. 실패한 단계 클릭하여 로그 확인
3. 에러 메시지 복사하여 분석

### 로컬 디버깅

```bash
# 빌드 로그 확인
npm run build:local 2>&1 | tee build.log

# 검증 스크립트 디버깅
node scripts/verify-build.js

# Electron 개발자 도구 열기
# Ctrl+Shift+I (프로덕션 빌드에서도 가능)
```

### 유용한 명령어

```bash
# 현재 버전 확인
node -p "require('./package.json').version"

# Git 태그 목록
git tag -l

# 최근 릴리스 확인
gh release list  # GitHub CLI 필요

# 워크플로우 상태 확인
gh run list  # GitHub CLI 필요
```

## 성공 체크리스트

테스트가 완료되면 다음 항목을 확인하세요:

- [ ] 로컬 빌드 성공
- [ ] 빌드 검증 스크립트 통과
- [ ] GitHub Actions 워크플로우 성공
- [ ] GitHub Release 자동 생성
- [ ] 설치 파일 업로드 완료
- [ ] latest.yml 업로드 완료
- [ ] 이전 릴리스 정리 작동
- [ ] 자동 업데이트 알림 표시
- [ ] 업데이트 다운로드 성공
- [ ] 업데이트 설치 성공
- [ ] 새 버전으로 업데이트 확인

## 다음 단계

CI/CD 파이프라인이 정상 작동하면:

1. **정기 릴리스 프로세스 수립**
   - 버전 관리 전략 (Semantic Versioning)
   - 릴리스 노트 작성 가이드
   - 테스트 체크리스트

2. **모니터링 강화**
   - Slack/Discord 알림 추가
   - 빌드 실패 시 자동 이슈 생성 (이미 구현됨)
   - 성능 메트릭 수집

3. **보안 강화**
   - 의존성 자동 업데이트 (Dependabot)
   - 보안 취약점 스캔
   - 코드 품질 검사 (ESLint, Prettier)

4. **사용자 피드백**
   - 업데이트 성공률 추적
   - 사용자 버전 분포 모니터링
   - 크래시 리포팅 시스템

## 참고 문서

- [RELEASE_GUIDE.md](RELEASE_GUIDE.md) - 릴리스 프로세스 상세 가이드
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 배포 설정 가이드
- [BUILD_CHECKLIST.md](BUILD_CHECKLIST.md) - 빌드 체크리스트

## 지원

문제가 발생하면:
1. 이 가이드의 "실패 시나리오 및 해결 방법" 섹션 참조
2. GitHub Issues에 문제 보고
3. GitHub Actions 로그 첨부

