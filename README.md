# ppop_promt - 프롬프트 관리 데스크탑 앱

ppop_promt는 프롬프트를 저장하고 자동변환 텍스트 기능을 제공하는 Electron 데스크탑 애플리케이션입니다.

## 주요 기능

1. **프롬프트 저장 및 관리** - 프롬프트를 폴더별로 체계적으로 관리
2. **자동변환 텍스트** - 특정 텍스트 입력 시 자동으로 프롬프트로 변환 (예: `@front` 입력 시 자동 변환)
3. **FastAPI 백엔드** - RESTful API를 통한 데이터 관리
4. **SQLite 데이터베이스** - 로컬 데이터베이스로 안전하게 데이터 저장
5. **자동 업데이트** - GitHub Release를 통한 자동 업데이트 지원

## 프로젝트 구조

```
ppop_promt/
├── backend/              # FastAPI 백엔드 서버
│   ├── main.py          # FastAPI 앱 진입점
│   ├── db.py            # 데이터베이스 연결 및 초기화
│   ├── models.py        # SQLAlchemy 모델
│   ├── schemas.py       # Pydantic 스키마
│   ├── migrate.py       # 데이터 마이그레이션 스크립트
│   ├── build.spec       # PyInstaller 빌드 설정
│   ├── build_backend.py # 백엔드 빌드 스크립트
│   ├── routers/         # API 라우터
│   │   ├── prompts.py   # 프롬프트 CRUD API
│   │   ├── folders.py   # 폴더 CRUD API
│   │   └── autotext.py  # 자동변환 텍스트 API
│   └── services/        # 백엔드 서비스
│       └── autotext_watcher.py  # 자동변환 텍스트 감지 서비스
├── frontend/            # React + Vite 프론트엔드
│   ├── src/             # React 소스 코드
│   │   ├── components/  # React 컴포넌트
│   │   └── hooks/       # React 훅 (useAutoUpdater 등)
│   └── package.json     # 프론트엔드 의존성
├── electron.js          # Electron 메인 프로세스
├── preload.js           # Electron preload 스크립트
├── clean.js             # 빌드 결과물 정리 스크립트
├── package.json         # Electron 빌드 설정
├── .env                 # 환경 변수 (GitHub Token 등)
├── .env.example         # 환경 변수 템플릿
└── README.md           # 프로젝트 문서
```

## 설치 및 실행 방법

### 사전 요구사항

- **Python 3.8 이상**
- **Node.js 18 이상** (프론트엔드용)
- **npm** 또는 **yarn**

### 1단계: 프로젝트 클론

```bash
git clone <저장소 주소>
cd ppop_promt
```

### 2단계: 백엔드 설정

#### Python 가상환경 생성 및 활성화

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (PowerShell)
.\venv\Scripts\Activate.ps1

# 가상환경 활성화 (CMD)
venv\Scripts\activate.bat
```

**PowerShell 실행 정책 오류 해결:**

PowerShell에서 실행 정책 오류가 발생하는 경우:

```powershell
# 현재 세션에서만 실행 정책 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 또는 CMD 사용
venv\Scripts\activate.bat
```

#### 백엔드 의존성 설치

```bash
pip install -r requirements.txt
```

#### 데이터베이스 초기화 및 마이그레이션

기존 `prompts.json` 데이터가 있는 경우 마이그레이션:

```bash
python backend/migrate.py
```

### 3단계: 백엔드 서버 실행

```bash
# FastAPI 서버 시작
python backend/main.py

# 또는 uvicorn 직접 실행
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

서버가 실행되면 다음 URL에서 확인할 수 있습니다:
- API 문서: http://127.0.0.1:8000/docs
- API 서버: http://127.0.0.1:8000

### 4단계: 자동변환 텍스트 서비스 실행 (선택사항)

별도 터미널에서 자동변환 텍스트 감지 서비스를 실행합니다:

```bash
python backend/services/autotext_watcher.py
```

이 서비스는 백그라운드에서 키보드 입력을 감지하여 자동변환 텍스트를 처리합니다.

### 5단계: 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 실행되면 브라우저에서 http://localhost:5173 (Vite 기본 포트)로 접속할 수 있습니다.

### 6단계: Electron 앱 실행

```bash
# 프로젝트 루트에서
npm install

# Electron 개발 모드 실행
npm run dev
```

## 프로덕션 빌드 및 배포

### 빌드 전 준비사항

1. **GitHub Token 설정**
   
   `.env` 파일을 생성하고 GitHub Personal Access Token을 설정하세요:
   
   ```env
   GH_TOKEN=your_github_token_here
   ```
   
   GitHub Token 생성 방법:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - `repo` 권한 체크 후 생성
   - `.env.example` 파일을 참고하세요

2. **버전 업데이트**
   
   `package.json`의 `version` 필드를 업데이트하세요:
   ```json
   "version": "1.0.1"
   ```

### 빌드 명령어

```bash
# 전체 빌드 (백엔드 + 프론트엔드 + Electron)
npm run build
```

이 명령어는 다음을 순차적으로 실행합니다:
1. **기존 빌드 결과물 삭제** (`clean`)
2. **백엔드 빌드** → `resources/ppop_promt_backend.exe`
3. **프론트엔드 빌드** → `frontend/dist/`
4. **Electron 빌드 및 GitHub Release 업로드** → `dist/`

### 개별 빌드 명령어

```bash
# 기존 빌드 결과물만 삭제
npm run clean

# 백엔드만 빌드
npm run build:backend

# 프론트엔드만 빌드
npm run build:frontend

# Electron만 빌드 (GitHub Release 업로드 포함)
npm run build:electron
```

### GitHub Release 배포

빌드는 `--publish=always` 옵션으로 설정되어 있어, 빌드할 때마다 자동으로 새 GitHub Release를 생성합니다.

**배포 절차:**

```bash
# 1. 버전 업데이트 (package.json의 version 수정)
# 예: "version": "1.0.1"

# 2. 빌드 및 자동 업로드
npm run build
```

빌드가 완료되면 자동으로 새 GitHub Release가 생성되고 업로드됩니다:
- `https://github.com/heishia/ppop_promt/releases`

**참고**: 
- `package.json`의 `version`이 Release 버전으로 사용됩니다
- 같은 버전으로 다시 빌드하면 기존 Release를 덮어씁니다
- 새 버전으로 빌드하면 새 Release가 생성됩니다

### 빌드 결과물

- `dist/ppop_promt Setup 1.0.0.exe` - Windows 설치 파일 (최종 배포용)
- `dist/latest.yml` - 자동 업데이트 메타데이터
- `resources/ppop_promt_backend.exe` - 백엔드 독립 실행 파일
- `frontend/dist/` - 프론트엔드 정적 파일

## 자동 업데이트

앱은 GitHub Release를 통해 자동 업데이트를 지원합니다.

### 사용자 측

- 앱 시작 시 자동으로 업데이트 확인
- 새 버전 발견 시 사용자에게 알림
- 사용자가 선택하여 다운로드 및 설치 가능
- InfoPage에서 수동으로 업데이트 확인 가능

### 개발자 측

1. `package.json`에서 버전 업데이트
2. Git 태그 생성 및 푸시
3. `npm run build` 실행
4. 자동으로 GitHub Release에 업로드됨

## 개발 가이드

### 백엔드 API 엔드포인트

- `GET /api/prompts` - 프롬프트 목록 조회
- `GET /api/prompts/{id}` - 특정 프롬프트 조회
- `POST /api/prompts` - 새 프롬프트 생성
- `PUT /api/prompts/{id}` - 프롬프트 수정
- `DELETE /api/prompts/{id}` - 프롬프트 삭제

- `GET /api/folders` - 폴더 목록 조회
- `POST /api/folders` - 새 폴더 생성
- `PUT /api/folders/{id}` - 폴더 수정
- `DELETE /api/folders/{id}` - 폴더 삭제

- `GET /api/autotexts` - 자동변환 텍스트 목록 조회
- `GET /api/autotexts/dict` - 자동변환 텍스트 딕셔너리 조회

자세한 API 문서는 http://127.0.0.1:8000/docs 에서 확인할 수 있습니다.

### 데이터베이스 위치

SQLite 데이터베이스는 다음 위치에 저장됩니다:
- Windows: `%APPDATA%\ppop_promt\ppop_promt.db`
- Linux/Mac: `~/.ppop_promt/ppop_promt.db`

### 환경 변수

`.env` 파일을 생성하여 설정할 수 있습니다:

```env
# GitHub Personal Access Token (빌드 및 배포용)
GH_TOKEN=your_github_token_here
```

`.env.example` 파일을 참고하여 `.env` 파일을 생성하세요.

## 문제 해결

### 백엔드 서버가 시작되지 않을 때

1. Python 버전 확인: `python --version` (3.8 이상 필요)
2. 가상환경이 활성화되어 있는지 확인
3. 의존성 설치 확인: `pip list`
4. 포트 8000이 사용 중인지 확인

### 데이터베이스 오류가 발생할 때

1. 데이터베이스 파일 권한 확인
2. APPDATA 폴더 접근 권한 확인
3. 데이터베이스 파일 손상 시 백업에서 복원

### 자동변환 텍스트가 작동하지 않을 때

1. 자동변환 서비스가 실행 중인지 확인
2. 백엔드 API 서버가 실행 중인지 확인
3. 관리자 권한으로 실행 필요할 수 있음 (Windows)
4. 바이러스 백신 프로그램의 차단 여부 확인

### 프론트엔드가 API에 연결되지 않을 때

1. 백엔드 서버가 실행 중인지 확인
2. CORS 설정 확인 (`backend/main.py`)
3. 브라우저 콘솔에서 에러 메시지 확인
4. 네트워크 탭에서 API 요청 상태 확인

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트의 라이선스 정보는 저장소를 확인하세요.

## 업데이트 내역

### v1.0.0 (현재)
- Electron 데스크탑 앱 구조
- FastAPI 백엔드 서버
- SQLite 데이터베이스 사용
- 자동변환 텍스트 서비스
- GitHub Release 자동 업데이트 지원
- PyInstaller를 통한 백엔드 독립 실행 파일 빌드
