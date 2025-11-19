"""
애플리케이션 설정 모듈

환경별 설정을 관리합니다.
"""
import os
from typing import List


class BaseConfig:
    """기본 설정 클래스"""
    
    # 앱 기본 정보
    APP_NAME: str = "Blueme API"
    APP_DESCRIPTION: str = "Blueme 프롬프트 관리 API"
    APP_VERSION: str = "1.0.0"
    
    # CORS 설정
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # 데이터베이스 설정
    DB_ECHO: bool = False  # SQLAlchemy 쿼리 로깅


class DevelopmentConfig(BaseConfig):
    """개발 환경 설정"""
    
    # 서버 설정
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    RELOAD: bool = True
    
    # 데이터베이스
    DB_ECHO: bool = True  # 개발 환경에서는 쿼리 로깅 활성화


class ProductionConfig(BaseConfig):
    """프로덕션 환경 설정 (일렉트론 빌드용)"""
    
    # 서버 설정
    HOST: str = "127.0.0.1"  # 일렉트론에서는 로컬호스트만 사용
    PORT: int = 8000
    RELOAD: bool = False
    
    # CORS 설정 - 일렉트론에서는 file:// 프로토콜 허용
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]


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

