"""
FastAPI 애플리케이션 진입점

백엔드 API 서버의 메인 파일입니다.
JSON 파일 기반으로 동작하며, blueme의 자동변환 텍스트 로직을 통합합니다.
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
    version=config.APP_VERSION
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
    
    # 데이터 디렉토리 확인
    print(f"데이터 디렉토리: {config.DATA_DIR}")
    
    # JSON 파일 초기화 (없으면 빈 배열로 생성)
    if not os.path.exists(config.PROMPTS_FILE):
        import json
        with open(config.PROMPTS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        print(f"프롬프트 파일 생성: {config.PROMPTS_FILE}")
    
    if not os.path.exists(config.FOLDERS_FILE):
        import json
        with open(config.FOLDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
        print(f"폴더 파일 생성: {config.FOLDERS_FILE}")
    
    print("JSON 파일 기반 저장소 준비 완료")
    
    # 환경 변수에서 포트 정보 가져오기 (동적 포트 지원)
    backend_port = os.getenv("BACKEND_PORT", str(config.PORT))
    api_url = f"http://{config.HOST}:{backend_port}"
    
    print(f"[INFO] 자동변환 텍스트 감지 서비스를 백그라운드에서 시작합니다...")
    print(f"[INFO] API URL: {api_url}")
    
    # 자동변환 텍스트 감지 서비스 시작 (별도 스레드에서 서버 준비 대기)
    # 환경 변수로 디버그 모드 제어 (기본값: True - 개발 편의를 위해)
    debug_mode = os.getenv("AUTOTEXT_DEBUG", "true").lower() == "true"
    
    def start_watcher_delayed():
        """서버 준비를 기다린 후 watcher를 시작하는 함수"""
        import time
        global watcher
        
        # 서버가 준비될 때까지 대기 (최대 5초)
        server_ready = False
        for i in range(5):
            try:
                response = requests.get(f"{api_url}/health", timeout=1)
                if response.status_code == 200:
                    print(f"[INFO] 서버 준비 확인 완료")
                    server_ready = True
                    break
            except:
                pass
            time.sleep(1)
        
        if not server_ready:
            print("[WARNING] 서버 준비 확인 실패. 자동변환 텍스트 감지 서비스를 시작하지 않습니다.")
            return
        
        # watcher 시작
        try:
            print(f"[INFO] 자동변환 텍스트 감지 서비스 시작... (디버그 모드: {debug_mode})")
            watcher = start_autotext_watcher(api_url=api_url, debug=debug_mode)
            print("[INFO] 자동변환 텍스트 감지 서비스 시작 완료")
        except Exception as e:
            print(f"[WARNING] 자동변환 텍스트 감지 서비스 시작 실패: {e}")
            print("[INFO] 백엔드 API는 정상 작동하지만, 키보드 자동변환 기능은 비활성화됩니다.")
            print("참고: Windows에서 키보드 후크를 사용하려면 관리자 권한이 필요할 수 있습니다.")
    
    # 별도 스레드에서 watcher 시작
    import threading
    watcher_thread = threading.Thread(target=start_watcher_delayed, daemon=True)
    watcher_thread.start()


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
