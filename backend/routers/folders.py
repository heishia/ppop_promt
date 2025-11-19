"""
폴더 CRUD API 라우터

폴더의 생성, 조회, 수정, 삭제를 처리합니다.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.db import get_db
from backend.models import Folder, Prompt
from backend.schemas import FolderCreate, FolderUpdate, FolderResponse
from backend.exceptions import FolderNotFoundError, FolderNameDuplicateError

router = APIRouter(prefix="/api/folders", tags=["folders"])

@router.get("/", response_model=List[FolderResponse])
def get_folders(db: Session = Depends(get_db)):
    """
    폴더 목록 조회
    
    Args:
        db: 데이터베이스 세션
    
    Returns:
        List[FolderResponse]: 폴더 목록
    """
    folders = db.query(Folder).order_by(Folder.created_at.asc()).all()
    return folders

@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    """
    특정 폴더 조회
    
    Args:
        folder_id: 폴더 ID
        db: 데이터베이스 세션
    
    Returns:
        FolderResponse: 폴더 정보
    
    Raises:
        HTTPException: 폴더를 찾을 수 없는 경우
    """
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise FolderNotFoundError(folder_id)
    return folder

@router.post("/", response_model=FolderResponse, status_code=201)
def create_folder(folder_data: FolderCreate, db: Session = Depends(get_db)):
    """
    새 폴더 생성
    
    Args:
        folder_data: 폴더 생성 데이터
        db: 데이터베이스 세션
    
    Returns:
        FolderResponse: 생성된 폴더 정보
    
    Raises:
        HTTPException: 동일한 이름의 폴더가 이미 존재하는 경우
    """
    # 중복 이름 체크
    existing = db.query(Folder).filter(Folder.name == folder_data.name).first()
    if existing:
        raise FolderNameDuplicateError(folder_data.name)
    
    folder = Folder(name=folder_data.name)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    folder_data: FolderUpdate,
    db: Session = Depends(get_db)
):
    """
    폴더 수정
    
    Args:
        folder_id: 폴더 ID
        folder_data: 폴더 수정 데이터
        db: 데이터베이스 세션
    
    Returns:
        FolderResponse: 수정된 폴더 정보
    
    Raises:
        HTTPException: 폴더를 찾을 수 없거나 동일한 이름의 폴더가 이미 존재하는 경우
    """
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise FolderNotFoundError(folder_id)
    
    if folder_data.name is not None:
        # 중복 이름 체크 (자기 자신 제외)
        existing = db.query(Folder).filter(
            Folder.name == folder_data.name,
            Folder.id != folder_id
        ).first()
        if existing:
            raise FolderNameDuplicateError(folder_data.name)
        
        folder.name = folder_data.name
    
    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    """
    폴더 삭제
    
    Args:
        folder_id: 폴더 ID
        db: 데이터베이스 세션
    
    Raises:
        HTTPException: 폴더를 찾을 수 없는 경우
    
    Note:
        폴더 삭제 시 포함된 프롬프트는 자동으로 삭제됩니다 (cascade).
    """
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise FolderNotFoundError(folder_id)
    
    db.delete(folder)
    db.commit()
    return None

