"""
애플리케이션 설정 모듈

환경별 설정을 관리합니다.
"""
import os
from typing import List


def get_data_dir():
    """
    APPDATA 폴더 경로 반환
    
    Returns:
        str: APPDATA/ppop_promt 경로
    """
    if os.name == 'nt':  # Windows
        appdata_dir = os.path.join(os.environ.get('APPDATA', ''), 'ppop_promt')
    else:  # macOS, Linux
        appdata_dir = os.path.join(os.path.expanduser('~'), '.ppop_promt')
    
    os.makedirs(appdata_dir, exist_ok=True)
    return appdata_dir


class BaseConfig:
    """기본 설정 클래스"""
    
    # 앱 기본 정보
    APP_NAME: str = "ppop_promt API"
    APP_DESCRIPTION: str = "ppop_promt 프롬프트 관리 API"
    APP_VERSION: str = "1.0.0"
    
    # 데이터 파일 경로
    DATA_DIR: str = get_data_dir()
    PROMPTS_FILE: str = os.path.join(DATA_DIR, 'prompts.json')
    FOLDERS_FILE: str = os.path.join(DATA_DIR, 'folders.json')
    
    # CORS 설정
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    @staticmethod
    def _get_cors_origins_with_port_range(base_origins: List[str], start_port: int = 8000, end_port: int = 8010) -> List[str]:
        """
        CORS origins에 포트 범위를 추가합니다.
        
        Args:
            base_origins: 기본 CORS origins 리스트
            start_port: 시작 포트 번호
            end_port: 끝 포트 번호
        
        Returns:
            List[str]: 포트 범위가 추가된 CORS origins 리스트
        """
        origins = base_origins.copy()
        # localhost의 포트 범위 추가 (8000-8010)
        for port in range(start_port, end_port + 1):
            origins.append(f"http://localhost:{port}")
            origins.append(f"http://127.0.0.1:{port}")
        return origins


class DevelopmentConfig(BaseConfig):
    """개발 환경 설정"""
    
    # 서버 설정
    HOST: str = "127.0.0.1"
    RELOAD: bool = True
    
    @property
    def PORT(self) -> int:
        """포트 번호 (환경 변수에서 동적으로 읽기)"""
        return int(os.getenv("BACKEND_PORT", "8000"))
    
    # CORS 설정 - 포트 범위(8000-8010) 포함하여 동적 포트 전환 지원
    CORS_ORIGINS: List[str] = BaseConfig._get_cors_origins_with_port_range([
        "http://localhost:3000",
        "http://localhost:5173",
    ])


class ProductionConfig(BaseConfig):
    """프로덕션 환경 설정 (일렉트론 빌드용)"""
    
    # 서버 설정
    HOST: str = "127.0.0.1"  # 일렉트론에서는 로컬호스트만 사용
    RELOAD: bool = False
    
    @property
    def PORT(self) -> int:
        """포트 번호 (환경 변수에서 동적으로 읽기)"""
        return int(os.getenv("BACKEND_PORT", "8000"))
    
    # CORS 설정 - 포트 범위(8000-8010) 포함하여 동적 포트 전환 지원
    CORS_ORIGINS: List[str] = BaseConfig._get_cors_origins_with_port_range([
        "http://localhost:3000",
        "http://localhost:5173",
    ])


def get_config() -> BaseConfig:
    """
    환경에 따라 적절한 설정 객체를 반환합니다.
    
    환경 변수 ENV를 통해 환경을 지정할 수 있습니다.
    - development: 개발 환경
    - production: 프로덕션 환경
    
    기본값은 development입니다.
    
    Returns:
        BaseConfig: 환경에 맞는 설정 객체
    """
    env = os.getenv("ENV", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    else:
        return DevelopmentConfig()


# 전역 설정 객체
config = get_config()
