"""
프롬프트 CRUD API 라우터

프롬프트의 생성, 조회, 수정, 삭제를 처리합니다.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.db import get_db
from backend.models import Prompt, Folder, AutoText
from backend.schemas import PromptCreate, PromptUpdate, PromptResponse, AutoTextCreate
from backend.exceptions import (
    PromptNotFoundError,
    FolderNotFoundError,
    AutoTextDuplicateError
)

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

@router.get("/", response_model=List[PromptResponse])
def get_prompts(
    folder_id: Optional[int] = Query(None, description="폴더 ID로 필터링"),
    type: Optional[str] = Query(None, description="프롬프트 타입으로 필터링 (GPT, Cursor 등)"),
    db: Session = Depends(get_db)
):
    """
    프롬프트 목록 조회
    
    Args:
        folder_id: 폴더 ID (선택사항)
        type: 프롬프트 타입 (선택사항)
        db: 데이터베이스 세션
    
    Returns:
        List[PromptResponse]: 프롬프트 목록
    """
    query = db.query(Prompt)
    
    if folder_id is not None:
        query = query.filter(Prompt.folder_id == folder_id)
    
    if type:
        query = query.filter(Prompt.type == type)
    
    prompts = query.order_by(Prompt.created_at.desc()).all()
    return prompts

@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """
    특정 프롬프트 조회
    
    Args:
        prompt_id: 프롬프트 ID
        db: 데이터베이스 세션
    
    Returns:
        PromptResponse: 프롬프트 정보
    
    Raises:
        HTTPException: 프롬프트를 찾을 수 없는 경우
    """
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise PromptNotFoundError(prompt_id)
    return prompt

@router.post("/", response_model=PromptResponse, status_code=201)
def create_prompt(prompt_data: PromptCreate, db: Session = Depends(get_db)):
    """
    새 프롬프트 생성
    
    Args:
        prompt_data: 프롬프트 생성 데이터
        db: 데이터베이스 세션
    
    Returns:
        PromptResponse: 생성된 프롬프트 정보
    
    Raises:
        HTTPException: 폴더를 찾을 수 없는 경우
    """
    # 폴더 ID가 제공된 경우 존재 여부 확인
    if prompt_data.folder_id:
        folder = db.query(Folder).filter(Folder.id == prompt_data.folder_id).first()
        if not folder:
            raise FolderNotFoundError(prompt_data.folder_id)
    
    # 프롬프트 생성
    prompt = Prompt(
        title=prompt_data.title,
        type=prompt_data.type,
        text=prompt_data.text,
        folder_id=prompt_data.folder_id
    )
    
    db.add(prompt)
    db.flush()  # ID를 얻기 위해 flush
    
    # 자동변환 텍스트 추가
    for autotext_data in prompt_data.autotexts:
        # 중복 체크
        existing = db.query(AutoText).filter(
            AutoText.trigger_text == autotext_data.trigger_text
        ).first()
        if existing:
            raise AutoTextDuplicateError(autotext_data.trigger_text)
        
        autotext = AutoText(
            prompt_id=prompt.id,
            trigger_text=autotext_data.trigger_text
        )
        db.add(autotext)
    
    db.commit()
    db.refresh(prompt)
    return prompt

@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(
    prompt_id: int,
    prompt_data: PromptUpdate,
    db: Session = Depends(get_db)
):
    """
    프롬프트 수정
    
    Args:
        prompt_id: 프롬프트 ID
        prompt_data: 프롬프트 수정 데이터
        db: 데이터베이스 세션
    
    Returns:
        PromptResponse: 수정된 프롬프트 정보
    
    Raises:
        HTTPException: 프롬프트를 찾을 수 없는 경우
    """
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise PromptNotFoundError(prompt_id)
    
    # 폴더 ID 업데이트 시 존재 여부 확인
    if prompt_data.folder_id is not None:
        if prompt_data.folder_id != 0:  # 0은 폴더 없음을 의미
            folder = db.query(Folder).filter(Folder.id == prompt_data.folder_id).first()
            if not folder:
                raise FolderNotFoundError(prompt_data.folder_id)
            prompt.folder_id = prompt_data.folder_id
        else:
            prompt.folder_id = None
    
    # 필드 업데이트
    if prompt_data.title is not None:
        prompt.title = prompt_data.title
    if prompt_data.type is not None:
        prompt.type = prompt_data.type
    if prompt_data.text is not None:
        prompt.text = prompt_data.text
    
    # 자동변환 텍스트 업데이트
    if prompt_data.autotexts is not None:
        # 기존 자동변환 텍스트 삭제
        db.query(AutoText).filter(AutoText.prompt_id == prompt_id).delete()
        
        # 새로운 자동변환 텍스트 추가
        for autotext_data in prompt_data.autotexts:
            # 중복 체크 (다른 프롬프트에서 사용 중인지)
            existing = db.query(AutoText).filter(
                AutoText.trigger_text == autotext_data.trigger_text
            ).first()
            if existing:
                raise AutoTextDuplicateError(autotext_data.trigger_text)
            
            autotext = AutoText(
                prompt_id=prompt.id,
                trigger_text=autotext_data.trigger_text
            )
            db.add(autotext)
    
    db.commit()
    db.refresh(prompt)
    return prompt

@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """
    프롬프트 삭제
    
    Args:
        prompt_id: 프롬프트 ID
        db: 데이터베이스 세션
    
    Raises:
        HTTPException: 프롬프트를 찾을 수 없는 경우
    """
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise PromptNotFoundError(prompt_id)
    
    db.delete(prompt)
    db.commit()
    return None

