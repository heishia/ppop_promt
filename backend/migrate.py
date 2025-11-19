"""
기존 prompts.json 데이터를 SQLite 데이터베이스로 마이그레이션하는 스크립트

기존 JSON 파일의 데이터를 읽어서 새로운 데이터베이스 구조로 변환합니다.
"""
import json
import os
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.db import init_db, SessionLocal, get_data_dir
from backend.models import Prompt, Folder, AutoText

def get_legacy_prompts_path():
    """기존 prompts.json 파일 경로 반환"""
    # 먼저 프로젝트 루트 확인
    root_path = Path(__file__).parent.parent / "prompts.json"
    if root_path.exists():
        return root_path
    
    # APPDATA 폴더 확인
    appdata_path = Path(get_data_dir()) / "prompts.json"
    if appdata_path.exists():
        return appdata_path
    
    return None

def load_legacy_prompts():
    """
    기존 prompts.json 파일에서 데이터 로드
    
    Returns:
        list: 프롬프트 데이터 리스트
    """
    prompts_path = get_legacy_prompts_path()
    if not prompts_path:
        print("기존 prompts.json 파일을 찾을 수 없습니다.")
        return []
    
    try:
        with open(prompts_path, 'r', encoding='utf-8') as f:
            prompts = json.load(f)
        print(f"기존 데이터 로드 완료: {len(prompts)}개 프롬프트")
        return prompts
    except Exception as e:
        print(f"기존 데이터 로드 실패: {e}")
        return []

def migrate_prompts():
    """프롬프트 데이터 마이그레이션"""
    db = SessionLocal()
    
    try:
        # 기존 데이터 로드
        legacy_prompts = load_legacy_prompts()
        if not legacy_prompts:
            print("마이그레이션할 데이터가 없습니다.")
            return
        
        # 타입별로 폴더 생성 (기존 type 필드를 폴더로 변환)
        type_folders = {}
        for prompt_data in legacy_prompts:
            prompt_type = prompt_data.get('type', '기타')
            if prompt_type not in type_folders:
                # 폴더가 이미 존재하는지 확인
                existing_folder = db.query(Folder).filter(Folder.name == prompt_type).first()
                if existing_folder:
                    type_folders[prompt_type] = existing_folder
                else:
                    folder = Folder(name=prompt_type)
                    db.add(folder)
                    db.flush()
                    type_folders[prompt_type] = folder
        
        db.commit()
        
        # 프롬프트 마이그레이션
        migrated_count = 0
        skipped_count = 0
        
        for prompt_data in legacy_prompts:
            title = prompt_data.get('title', '').strip()
            prompt_type = prompt_data.get('type', '기타')
            text = prompt_data.get('text', '').strip()
            autotext = prompt_data.get('autotext', '').strip()
            
            if not title or not text:
                skipped_count += 1
                continue
            
            # 이미 존재하는 프롬프트인지 확인 (제목과 타입으로)
            existing = db.query(Prompt).filter(
                Prompt.title == title,
                Prompt.type == prompt_type
            ).first()
            
            if existing:
                skipped_count += 1
                continue
            
            # 프롬프트 생성
            folder = type_folders.get(prompt_type)
            prompt = Prompt(
                title=title,
                type=prompt_type,
                text=text,
                folder_id=folder.id if folder else None
            )
            
            db.add(prompt)
            db.flush()
            
            # 자동변환 텍스트 추가
            if autotext and len(autotext) >= 2:
                # 중복 체크
                existing_autotext = db.query(AutoText).filter(
                    AutoText.trigger_text == autotext
                ).first()
                
                if not existing_autotext:
                    autotext_obj = AutoText(
                        prompt_id=prompt.id,
                        trigger_text=autotext
                    )
                    db.add(autotext_obj)
            
            migrated_count += 1
        
        db.commit()
        print(f"\n마이그레이션 완료:")
        print(f"  - 마이그레이션된 프롬프트: {migrated_count}개")
        print(f"  - 건너뛴 프롬프트: {skipped_count}개")
        print(f"  - 생성된 폴더: {len(type_folders)}개")
        
    except Exception as e:
        db.rollback()
        print(f"마이그레이션 중 오류 발생: {e}")
        raise
    finally:
        db.close()

def main():
    """메인 함수"""
    print("=" * 50)
    print("프롬프트 데이터 마이그레이션 시작")
    print("=" * 50)
    
    # 데이터베이스 초기화
    print("\n데이터베이스 초기화 중...")
    init_db()
    print("데이터베이스 초기화 완료")
    
    # 마이그레이션 실행
    print("\n데이터 마이그레이션 중...")
    migrate_prompts()
    
    print("\n" + "=" * 50)
    print("마이그레이션 완료!")
    print("=" * 50)

if __name__ == "__main__":
    main()

