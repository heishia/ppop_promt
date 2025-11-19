"""
FastAPI 애플리케이션 진입점

백엔드 API 서버의 메인 파일입니다.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db import init_db
from backend.routers import prompts, folders, autotext

# FastAPI 앱 생성
app = FastAPI(
    title="Blueme API",
    description="Blueme 프롬프트 관리 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite 기본 포트
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(prompts.router)
app.include_router(folders.router)
app.include_router(autotext.router)

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 데이터베이스 초기화"""
    init_db()
    print("데이터베이스 초기화 완료")

@app.get("/")
def root():
    """루트 엔드포인트"""
    return {"message": "Blueme API 서버가 실행 중입니다"}

@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

