"""
프롬프트 CRUD API 라우터

프롬프트의 생성, 조회, 수정, 삭제를 처리합니다.
JSON 파일 기반으로 동작합니다.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from backend import storage

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


# ============== Pydantic 스키마 ==============

class PromptCreate(BaseModel):
    """프롬프트 생성 스키마"""
    title: str = Field(..., min_length=1, description="프롬프트 제목")
    type: str = Field(default="GPT", description="프롬프트 종류 (GPT, Cursor 등)")
    text: str = Field(..., min_length=1, description="프롬프트 내용")
    autotext: Optional[str] = Field(None, min_length=2, description="자동변환 텍스트 (예: @front)")
    folder_id: Optional[int] = Field(None, description="폴더 ID")


class PromptUpdate(BaseModel):
    """프롬프트 업데이트 스키마"""
    title: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, min_length=1)
    text: Optional[str] = Field(None, min_length=1)
    autotext: Optional[str] = Field(None, min_length=2)
    folder_id: Optional[int] = None
    remove_autotext: bool = False


class AutoTextInfo(BaseModel):
    """자동변환 텍스트 정보"""
    trigger_text: str


class PromptResponse(BaseModel):
    """프롬프트 응답 스키마"""
    id: str
    title: str
    type: str
    text: str
    folder_id: Optional[int]
    created_at: str
    updated_at: str
    autotexts: List[AutoTextInfo] = []


# ============== API 엔드포인트 ==============

@router.get("/", response_model=List[PromptResponse])
def get_prompts(
    folder_id: Optional[int] = Query(None, description="폴더 ID로 필터링"),
    type: Optional[str] = Query(None, description="프롬프트 타입으로 필터링 (GPT, Cursor 등)")
):
    """
    프롬프트 목록 조회
    
    Args:
        folder_id: 폴더 ID (선택사항)
        type: 프롬프트 타입 (선택사항)
    
    Returns:
        List[PromptResponse]: 프롬프트 목록
    """
    prompts = storage.get_prompts(folder_id=folder_id, prompt_type=type)
    
    # autotexts 형식 변환
    for prompt in prompts:
        if 'autotext' in prompt:
            prompt['autotexts'] = [{'trigger_text': prompt['autotext']}]
        else:
            prompt['autotexts'] = []
    
    return prompts


@router.get("/{prompt_id}", response_model=PromptResponse)
def get_prompt(prompt_id: str):
    """
    특정 프롬프트 조회
    
    Args:
        prompt_id: 프롬프트 ID
    
    Returns:
        PromptResponse: 프롬프트 정보
    """
    prompt = storage.get_prompt_by_id(prompt_id)
    
    if not prompt:
        raise HTTPException(status_code=404, detail=f"프롬프트 ID {prompt_id}를 찾을 수 없습니다.")
    
    # autotexts 형식 변환
    if 'autotext' in prompt:
        prompt['autotexts'] = [{'trigger_text': prompt['autotext']}]
    else:
        prompt['autotexts'] = []
    
    return prompt


@router.post("/", response_model=PromptResponse, status_code=201)
def create_prompt(prompt_data: PromptCreate):
    """
    새 프롬프트 생성
    
    Args:
        prompt_data: 프롬프트 생성 데이터
    
    Returns:
        PromptResponse: 생성된 프롬프트 정보
    """
    try:
        prompt = storage.create_prompt(
            title=prompt_data.title,
            prompt_type=prompt_data.type,
            text=prompt_data.text,
            autotext=prompt_data.autotext,
            folder_id=prompt_data.folder_id
        )
        
        # autotexts 형식 변환
        if 'autotext' in prompt:
            prompt['autotexts'] = [{'trigger_text': prompt['autotext']}]
        else:
            prompt['autotexts'] = []
        
        # 자동변환 텍스트 딕셔너리 업데이트 트리거
        try:
            from backend.main import get_watcher
            watcher = get_watcher()
            if watcher:
                watcher.trigger_update()
        except Exception:
            pass  # watcher가 없거나 아직 초기화되지 않은 경우 무시
        
        return prompt
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(prompt_id: str, prompt_data: PromptUpdate):
    """
    프롬프트 수정
    
    Args:
        prompt_id: 프롬프트 ID
        prompt_data: 프롬프트 수정 데이터
    
    Returns:
        PromptResponse: 수정된 프롬프트 정보
    """
    try:
        prompt = storage.update_prompt(
            prompt_id=prompt_id,
            title=prompt_data.title,
            prompt_type=prompt_data.type,
            text=prompt_data.text,
            autotext=prompt_data.autotext,
            folder_id=prompt_data.folder_id,
            remove_autotext=prompt_data.remove_autotext
        )
        
        if not prompt:
            raise HTTPException(status_code=404, detail=f"프롬프트 ID {prompt_id}를 찾을 수 없습니다.")
        
        # autotexts 형식 변환
        if 'autotext' in prompt:
            prompt['autotexts'] = [{'trigger_text': prompt['autotext']}]
        else:
            prompt['autotexts'] = []
        
        # 자동변환 텍스트 딕셔너리 업데이트 트리거
        try:
            from backend.main import get_watcher
            watcher = get_watcher()
            if watcher:
                watcher.trigger_update()
        except Exception:
            pass  # watcher가 없거나 아직 초기화되지 않은 경우 무시
        
        return prompt
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{prompt_id}", status_code=204)
def delete_prompt(prompt_id: str):
    """
    프롬프트 삭제
    
    Args:
        prompt_id: 프롬프트 ID
    """
    success = storage.delete_prompt(prompt_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"프롬프트 ID {prompt_id}를 찾을 수 없습니다.")
    
    # 자동변환 텍스트 딕셔너리 업데이트 트리거
    try:
        from backend.main import get_watcher
        watcher = get_watcher()
        if watcher:
            watcher.trigger_update()
    except Exception:
        pass  # watcher가 없거나 아직 초기화되지 않은 경우 무시
    
    return None

