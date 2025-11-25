"""
자동변환 텍스트 관리 API 라우터

자동변환 텍스트의 조회 및 관리를 처리합니다.
JSON 파일 기반으로 동작합니다.
"""
from fastapi import APIRouter
from typing import Dict
from backend import storage

router = APIRouter(prefix="/api/autotexts", tags=["autotexts"])


@router.get("/dict", response_model=Dict[str, str])
def get_autotext_dict():
    """
    자동변환 텍스트 딕셔너리 조회
    
    자동변환 감지 서비스에서 사용하기 위한 형식으로 반환합니다.
    {trigger_text: prompt_text} 형식
    
    Returns:
        Dict[str, str]: 트리거 텍스트와 프롬프트 텍스트의 매핑
    """
    return storage.get_autotext_dict()

