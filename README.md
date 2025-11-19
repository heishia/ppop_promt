# Blueme - 프롬프트 관리 데스크탑 앱

Blueme는 프롬프트를 저장하고 자동변환 텍스트 기능을 제공하는 Electron 데스크탑 애플리케이션입니다.

## 주요 기능

1. **프롬프트 저장 및 관리** - 프롬프트를 폴더별로 체계적으로 관리
2. **자동변환 텍스트** - 특정 텍스트 입력 시 자동으로 프롬프트로 변환 (예: `@front` 입력 시 자동 변환)
3. **FastAPI 백엔드** - RESTful API를 통한 데이터 관리
4. **SQLite 데이터베이스** - 로컬 데이터베이스로 안전하게 데이터 저장

## 프로젝트 구조

```
blueme/
├── backend/              # FastAPI 백엔드 서버
│   ├── main.py          # FastAPI 앱 진입점
│   ├── db.py            # 데이터베이스 연결 및 초기화
│   ├── models.py        # SQLAlchemy 모델
│   ├── schemas.py       # Pydantic 스키마
│   ├── migrate.py       # 데이터 마이그레이션 스크립트
│   ├── routers/         # API 라우터
│   │   ├── prompts.py   # 프롬프트 CRUD API
│   │   ├── folders.py   # 폴더 CRUD API
│   │   └── autotext.py  # 자동변환 텍스트 API
│   └── services/        # 백엔드 서비스
│       └── autotext_watcher.py  # 자동변환 텍스트 감지 서비스
├── frontend/            # React + Electron 프론트엔드
│   ├── src/             # React 소스 코드
│   ├── electron/        # Electron 메인 프로세스 (예정)
│   └── package.json     # 프론트엔드 의존성
├── requirements.txt     # Python 의존성
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
cd blueme
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

프론트엔드가 실행되면 브라우저에서 http://localhost:3000 (또는 Vite 기본 포트)로 접속할 수 있습니다.

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
- Windows: `%APPDATA%\blueme\blueme.db`
- Linux/Mac: `~/.blueme/blueme.db`

### 환경 변수

필요한 경우 `.env` 파일을 생성하여 설정할 수 있습니다:

```env
DATABASE_URL=sqlite:///./blueme.db
API_HOST=127.0.0.1
API_PORT=8000
```

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

### v2.0.0 (현재)
- FastAPI 백엔드로 마이그레이션
- SQLite 데이터베이스 사용
- Electron 데스크탑 앱 구조로 전환
- 자동변환 텍스트 서비스 분리

### v1.0.0
- PyQt6 기반 데스크탑 앱
- JSON 파일 기반 데이터 저장
- 키보드 단축키 기능
