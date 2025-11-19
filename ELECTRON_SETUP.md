# ppop_promt 일렉트론 빌드 가이드

## 앱 정보
- **앱 이름**: ppop_promt
- **윈도우 크기**: 900x600
- **아이콘**: `public/icon.ico`

## 개발 환경 설정

### 1. 의존성 설치

#### 프로젝트 루트
```bash
npm install
```

#### 프론트엔드
```bash
cd frontend
npm install
```

#### 백엔드
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**주의**: PyInstaller도 자동으로 설치됩니다.

### 2. 개발 모드 실행

**터미널 1**: 백엔드 서버 시작
```bash
python run.py
```

**터미널 2**: 프론트엔드 개발 서버 시작
```bash
cd frontend
npm run dev
```

**터미널 3**: 일렉트론 실행
```bash
npm run dev
```

## 프로덕션 빌드

### 빌드 명령어
```bash
npm run build
```

이 명령어는 다음을 순차적으로 실행합니다:
1. **백엔드 빌드** (`python build_backend.py`)
   - PyInstaller로 백엔드를 독립 실행 파일로 빌드
   - `resources/ppop_promt_backend.exe` 생성
2. **프론트엔드 빌드** (`frontend/dist`에 생성)
3. **일렉트론 빌드** (`dist`에 설치 파일 생성)

### 개별 빌드 명령어
```bash
# 백엔드만 빌드
npm run build:backend

# 프론트엔드만 빌드
npm run build:frontend

# 일렉트론만 빌드 (백엔드, 프론트엔드 빌드 후)
npm run build:electron
```

### 빌드 결과물
- `resources/ppop_promt_backend.exe` - 백엔드 독립 실행 파일
- `frontend/dist/` - 프론트엔드 정적 파일
- `dist/ppop_promt Setup 1.0.0.exe` - Windows 설치 파일 (최종 배포용)

## 주의사항

### Python 번들링
✅ **PyInstaller 사용**: 백엔드가 독립 실행 파일로 빌드되어 Python 설치 불필요
- `ppop_promt_backend.exe`에 모든 의존성 포함
- 사용자는 Python 설치 없이 앱 사용 가능

### 환경 설정
- 개발 환경: 자동 재시작 활성화, DevTools 활성화
- 프로덕션 환경: 자동 재시작 비활성화, 최적화된 빌드

## 파일 구조
```
ppop_promt/
├── electron.js              # 일렉트론 메인 프로세스
├── package.json             # 루트 package.json (일렉트론 설정)
├── run.py                   # 백엔드 서버 실행 스크립트
├── build_backend.py         # 백엔드 빌드 스크립트
├── public/
│   └── icon.ico            # 앱 아이콘
├── resources/               # 빌드된 리소스 (빌드 후 생성)
│   └── ppop_promt_backend.exe
├── frontend/
│   ├── package.json        # 프론트엔드 의존성
│   ├── dist/               # 프론트엔드 빌드 결과물
│   └── src/
└── backend/
    ├── main.py             # FastAPI 앱
    ├── config.py           # 환경 설정
    ├── build.spec          # PyInstaller 설정
    ├── requirements.txt    # Python 의존성 (pyinstaller 포함)
    └── ...
```

