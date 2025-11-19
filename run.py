"""
Uvicorn 서버 실행 모듈

개발 환경과 프로덕션 환경에 맞게 서버를 실행합니다.
"""
import os
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import uvicorn
from backend.config import config


def run_server():
    """
    환경에 맞게 uvicorn 서버를 실행합니다.
    
    환경 변수 ENV를 통해 환경을 지정할 수 있습니다:
    - development: 개발 환경 (기본값)
    - production: 프로덕션 환경 (일렉트론 빌드용)
    
    커맨드 인자로도 지정 가능:
    - python run.py dev
    - python run.py prod
    """
    # 커맨드 인자로 환경 지정
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ["prod", "production"]:
            os.environ["ENV"] = "production"
        elif arg in ["dev", "development"]:
            os.environ["ENV"] = "development"
    
    # 현재 환경 출력
    env = os.getenv("ENV", "development")
    print(f"🚀 서버를 {env} 환경으로 시작합니다...")
    print(f"📍 주소: http://{config.HOST}:{config.PORT}")
    print(f"🔄 자동 재시작: {'활성화' if config.RELOAD else '비활성화'}")
    
    # uvicorn 서버 실행
    uvicorn.run(
        "backend.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.RELOAD,
        log_level="info"
    )


if __name__ == "__main__":
    run_server()

