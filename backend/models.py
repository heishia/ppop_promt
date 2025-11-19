"""
데이터베이스 모델 정의

프롬프트, 폴더, 자동변환 텍스트를 위한 SQLAlchemy 모델입니다.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.db import Base

class Folder(Base):
    """
    폴더 모델
    
    프롬프트를 그룹화하기 위한 폴더입니다.
    """
    __tablename__ = "folders"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 설정
    prompts = relationship("Prompt", back_populates="folder", cascade="all, delete-orphan")

class Prompt(Base):
    """
    프롬프트 모델
    
    저장된 프롬프트 정보를 담는 모델입니다.
    """
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=False, index=True)  # GPT, Cursor 등
    text = Column(Text, nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계 설정
    folder = relationship("Folder", back_populates="prompts")
    autotexts = relationship("AutoText", back_populates="prompt", cascade="all, delete-orphan")

class AutoText(Base):
    """
    자동변환 텍스트 모델
    
    프롬프트와 연결된 자동변환 텍스트 트리거입니다.
    """
    __tablename__ = "autotexts"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey("prompts.id"), nullable=False, index=True)
    trigger_text = Column(String(255), nullable=False, unique=True, index=True)  # 예: "@front"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    prompt = relationship("Prompt", back_populates="autotexts")

