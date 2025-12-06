"""
FastAPI 애플리케이션 진입점

백엔드 API 서버의 메인 파일입니다.
JSON 파일 기반으로 동작하며, ppop_promt의 자동변환 텍스트 로직을 통합합니다.
"""
import os
import asyncio
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import config
from backend.routers import prompts, folders, autotext
from backend.services.autotext_watcher import start_autotext_watcher

# 전역 watcher 인스턴스 (다른 모듈에서 접근 가능하도록)
watcher = None

def get_watcher():
    """전역 watcher 인스턴스를 반환합니다."""
    return watcher


# FastAPI 앱 생성
app = FastAPI(
    title=config.APP_NAME,
    description=config.APP_DESCRIPTION,
    version=config.APP_VERSION,
    redirect_slashes=False  # trailing slash 리다이렉트 비활성화
)

# CORS 설정 - 포트 범위가 이미 포함되어 있음
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=config.CORS_CREDENTIALS,
    allow_methods=config.CORS_METHODS,
    allow_headers=config.CORS_HEADERS,
)

# 라우터 등록
app.include_router(prompts.router)
app.include_router(folders.router)
app.include_router(autotext.router)


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 데이터 파일 확인 및 자동변환 텍스트 감지 서비스 시작"""
    global watcher
    
    # JSON 파일 초기화 (없으면 빈 배열로 생성)
    if not os.path.exists(config.PROMPTS_FILE):
        import json
        with open(config.PROMPTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    
    if not os.path.exists(config.FOLDERS_FILE):
        import json
        with open(config.FOLDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    
    # 환경 변수에서 포트 정보 가져오기 (동적 포트 지원)
    backend_port = os.getenv("BACKEND_PORT", str(config.PORT))
    api_url = f"http://{config.HOST}:{backend_port}"
    
    # 자동변환 텍스트 감지 서비스 시작 (별도 스레드에서 서버 준비 대기)
    debug_mode = os.getenv("AUTOTEXT_DEBUG", "false").lower() == "true"
    
    def start_watcher_delayed():
        """서버 준비를 기다린 후 watcher를 시작하는 함수"""
        import time
        global watcher
        
        # 서버가 준비될 때까지 대기 (최대 5초)
        for i in range(5):
            try:
                response = requests.get(f"{api_url}/health", timeout=1)
                if response.status_code == 200:
                    break
            except:
                pass
            time.sleep(1)
        
        # watcher 시작
        try:
            watcher = start_autotext_watcher(api_url=api_url, debug=debug_mode)
        except:
            pass
    
    # 별도 스레드에서 watcher 시작
    import threading
    watcher_thread = threading.Thread(target=start_watcher_delayed, daemon=True)
    watcher_thread.start()


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {"message": "ppop_promt API 서버가 실행 중입니다"}


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
