"""
Pydantic 스키마 정의

API 요청/응답 검증을 위한 스키마입니다.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AutoTextBase(BaseModel):
    """자동변환 텍스트 기본 스키마"""
    trigger_text: str = Field(..., min_length=2, description="트리거 텍스트 (예: @front)")

class AutoTextCreate(AutoTextBase):
    """자동변환 텍스트 생성 스키마"""
    pass

class AutoTextResponse(AutoTextBase):
    """자동변환 텍스트 응답 스키마"""
    id: int
    prompt_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PromptBase(BaseModel):
    """프롬프트 기본 스키마"""
    title: str = Field(..., min_length=1, description="프롬프트 제목")
    type: str = Field(..., min_length=1, description="프롬프트 종류 (GPT, Cursor 등)")
    text: str = Field(..., min_length=1, description="프롬프트 내용")

class PromptCreate(PromptBase):
    """프롬프트 생성 스키마"""
    folder_id: Optional[int] = None
    autotexts: List[AutoTextCreate] = []

class PromptUpdate(BaseModel):
    """프롬프트 업데이트 스키마"""
    title: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, min_length=1)
    text: Optional[str] = Field(None, min_length=1)
    folder_id: Optional[int] = None
    autotexts: Optional[List[AutoTextCreate]] = None

class PromptResponse(PromptBase):
    """프롬프트 응답 스키마"""
    id: int
    folder_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    autotexts: List[AutoTextResponse] = []
    
    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    """폴더 기본 스키마"""
    name: str = Field(..., min_length=1, description="폴더 이름")

class FolderCreate(FolderBase):
    """폴더 생성 스키마"""
    pass

class FolderUpdate(BaseModel):
    """폴더 업데이트 스키마"""
    name: Optional[str] = Field(None, min_length=1)

class FolderResponse(FolderBase):
    """폴더 응답 스키마"""
    id: int
    created_at: datetime
    updated_at: datetime
    prompts: List[PromptResponse] = []
    
    class Config:
        from_attributes = True

