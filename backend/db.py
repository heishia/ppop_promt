"""
데이터베이스 연결 및 초기화 모듈

SQLite 데이터베이스 연결을 관리하고 테이블을 생성합니다.
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def get_data_dir():
    """APPDATA 폴더 경로 반환"""
    if sys.platform == "win32":
        appdata_dir = os.path.join(os.environ.get('APPDATA', ''), 'blueme')
    else:
        appdata_dir = os.path.join(os.path.expanduser('~'), '.blueme')
    
    os.makedirs(appdata_dir, exist_ok=True)
    return appdata_dir

# 데이터베이스 파일 경로
DATABASE_URL = f"sqlite:///{os.path.join(get_data_dir(), 'blueme.db')}"

# SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite용 설정
    echo=False  # 디버깅 시 True로 변경
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스
Base = declarative_base()

def get_db():
    """
    데이터베이스 세션 생성 및 반환
    
    Yields:
        Session: SQLAlchemy 세션 객체
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """데이터베이스 테이블 생성"""
    Base.metadata.create_all(bind=engine)

