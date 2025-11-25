"""
Uvicorn 서버 실행 모듈

개발 환경과 프로덕션 환경에 맞게 서버를 실행합니다.
"""
import os
import sys
import socket
from pathlib import Path

# Windows에서 UTF-8 인코딩 설정
if sys.platform == 'win32':
    # Windows 콘솔 인코딩을 UTF-8로 설정
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
            # Python 3.6 이하에서는 reconfigure가 없음
            import codecs
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if sys.stderr.encoding != 'utf-8':
        try:
            sys.stderr.reconfigure(encoding='utf-8')
        except AttributeError:
            import codecs
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import uvicorn
from backend.config import config


def is_port_available(host: str, port: int) -> bool:
    """
    포트가 사용 가능한지 확인합니다.
    
    Args:
        host: 호스트 주소
        port: 확인할 포트 번호
    
    Returns:
        bool: 포트가 사용 가능하면 True, 사용 중이면 False
    """
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex((host, port))
            return result != 0  # 0이면 연결 성공 (포트 사용 중)
    except Exception:
        return False


def find_available_port(host: str, start_port: int = 8000, max_port: int = 8010) -> int:
    """
    사용 가능한 포트를 찾습니다.
    
    Args:
        host: 호스트 주소
        start_port: 시작 포트 번호 (기본값: 8000)
        max_port: 최대 포트 번호 (기본값: 8010)
    
    Returns:
        int: 사용 가능한 포트 번호, 없으면 start_port 반환
    """
    for port in range(start_port, max_port + 1):
        if is_port_available(host, port):
            return port
    
    # 사용 가능한 포트를 찾지 못한 경우 기본 포트 반환
    # (uvicorn이 자체적으로 에러를 발생시킬 것임)
    return start_port


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
    
    # 포트 사용 가능 여부 확인 및 자동 포트 찾기
    host = config.HOST
    preferred_port = config.PORT
    
    if not is_port_available(host, preferred_port):
        print(f"⚠️  포트 {preferred_port}이(가) 이미 사용 중입니다. 사용 가능한 포트를 찾는 중...")
        available_port = find_available_port(host, preferred_port, 8010)
        
        if available_port != preferred_port:
            print(f"✅ 포트 {available_port}을(를) 사용합니다.")
            # 환경 변수로 포트 설정 (다른 모듈에서 사용 가능하도록)
            os.environ["BACKEND_PORT"] = str(available_port)
            actual_port = available_port
        else:
            print(f"⚠️  포트 {preferred_port}-8010 범위에서 사용 가능한 포트를 찾지 못했습니다.")
            print(f"   포트 {preferred_port}을(를) 사용하려고 시도합니다...")
            actual_port = preferred_port
    else:
        actual_port = preferred_port
        os.environ["BACKEND_PORT"] = str(actual_port)
    
    print(f"Starting server in {env} environment...")
    print(f"Address: http://{host}:{actual_port}")
    print(f"Auto reload: {'Enabled' if config.RELOAD else 'Disabled'}")
    
    # uvicorn 서버 실행
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=actual_port,
        reload=config.RELOAD,
        log_level="info"
    )


if __name__ == "__main__":
    run_server()

