"""
자동변환 텍스트 관리 API 라우터

자동변환 텍스트의 조회 및 관리를 처리합니다.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from backend.db import get_db
from backend.models import AutoText, Prompt
from backend.schemas import AutoTextResponse

router = APIRouter(prefix="/api/autotexts", tags=["autotexts"])

@router.get("/", response_model=List[AutoTextResponse])
def get_autotexts(db: Session = Depends(get_db)):
    """
    모든 자동변환 텍스트 조회
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        List[AutoTextResponse]: 자동변환 텍스트 목록
    """
    autotexts = db.query(AutoText).order_by(AutoText.created_at.asc()).all()
    return autotexts

@router.get("/dict", response_model=Dict[str, str])
def get_autotext_dict(db: Session = Depends(get_db)):
    """
    자동변환 텍스트 딕셔너리 조회
    
    자동변환 감지 서비스에서 사용하기 위한 형식으로 반환합니다.
    {trigger_text: prompt_text} 형식
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        Dict[str, str]: 트리거 텍스트와 프롬프트 텍스트의 매핑
    """
    autotexts = db.query(AutoText).all()
    result = {}
    for autotext in autotexts:
        prompt = db.query(Prompt).filter(Prompt.id == autotext.prompt_id).first()
        if prompt:
            result[autotext.trigger_text] = prompt.text
    return result

