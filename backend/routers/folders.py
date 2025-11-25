"""
폴더 CRUD API 라우터

폴더의 생성, 조회, 수정, 삭제를 처리합니다.
JSON 파일 기반으로 동작합니다.
"""
from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel, Field
from backend import storage

router = APIRouter(prefix="/api/folders", tags=["folders"])


# ============== Pydantic 스키마 ==============

class FolderCreate(BaseModel):
    """폴더 생성 스키마"""
    name: str = Field(..., min_length=1, description="폴더 이름")


class FolderUpdate(BaseModel):
    """폴더 업데이트 스키마"""
    name: str = Field(..., min_length=1, description="폴더 이름")


class FolderResponse(BaseModel):
    """폴더 응답 스키마"""
    id: int
    name: str
    created_at: str
    updated_at: str


# ============== API 엔드포인트 ==============

@router.get("/", response_model=List[FolderResponse])
def get_folders():
    """
    폴더 목록 조회
    
    Returns:
        List[FolderResponse]: 폴더 목록
    """
    folders = storage.get_folders()
    return folders


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(folder_id: int):
    """
    특정 폴더 조회
    
    Args:
        folder_id: 폴더 ID
    
    Returns:
        FolderResponse: 폴더 정보
    """
    folder = storage.get_folder_by_id(folder_id)
    
    if not folder:
        raise HTTPException(status_code=404, detail=f"폴더 ID {folder_id}를 찾을 수 없습니다.")
    
    return folder


@router.post("/", response_model=FolderResponse, status_code=201)
def create_folder(folder_data: FolderCreate):
    """
    새 폴더 생성
    
    Args:
        folder_data: 폴더 생성 데이터
    
    Returns:
        FolderResponse: 생성된 폴더 정보
    """
    folder = storage.create_folder(name=folder_data.name)
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(folder_id: int, folder_data: FolderUpdate):
    """
    폴더 수정
    
    Args:
        folder_id: 폴더 ID
        folder_data: 폴더 수정 데이터
    
    Returns:
        FolderResponse: 수정된 폴더 정보
    """
    folder = storage.update_folder(folder_id=folder_id, name=folder_data.name)
    
    if not folder:
        raise HTTPException(status_code=404, detail=f"폴더 ID {folder_id}를 찾을 수 없습니다.")
    
    return folder


@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int):
    """
    폴더 삭제
    
    Args:
        folder_id: 폴더 ID
    """
    success = storage.delete_folder(folder_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"폴더 ID {folder_id}를 찾을 수 없습니다.")
    
    return None

