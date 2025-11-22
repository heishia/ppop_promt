"""
FastAPI 애플리케이션 진입점

백엔드 API 서버의 메인 파일입니다.
라우터 등록, 예외 핸들러 등록, config 로드만 담당합니다.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import config
from backend.db import init_db
from backend.exceptions import register_exception_handlers
from backend.routers import prompts, folders, autotext
from backend.services.autotext_watcher import start_autotext_watcher

# 전역 watcher 인스턴스
watcher = None


# FastAPI 앱 생성
app = FastAPI(
    title=config.APP_NAME,
    description=config.APP_DESCRIPTION,
    version=config.APP_VERSION
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=config.CORS_CREDENTIALS,
    allow_methods=config.CORS_METHODS,
    allow_headers=config.CORS_HEADERS,
)

# 예외 핸들러 등록
register_exception_handlers(app)

# 라우터 등록
app.include_router(prompts.router)
app.include_router(folders.router)
app.include_router(autotext.router)


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 데이터베이스 테이블 확인 및 생성"""
    global watcher
    init_db()
    print("데이터베이스 연결 완료 (기존 데이터 유지)")
    
    # 자동변환 텍스트 감지 서비스 시작
    watcher = start_autotext_watcher()
    print("자동변환 텍스트 감지 서비스 시작 완료")


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {"message": "Blueme API 서버가 실행 중입니다"}


@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리 작업"""
    global watcher
    if watcher:
        watcher.stop()
        print("자동변환 텍스트 감지 서비스 종료 완료")

