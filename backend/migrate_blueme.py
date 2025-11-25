"""
blueme 데이터 마이그레이션 스크립트

blueme의 prompts.json 데이터를 새로운 구조로 변환하여 저장합니다.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.config import config


def migrate_blueme_data():
    """
    blueme의 prompts.json 데이터를 마이그레이션합니다.
    
    변환 내용:
    - title, type, text, autotext는 그대로 유지
    - id, folder_id, created_at, updated_at 추가
    """
    # blueme의 prompts.json 경로
    blueme_prompts_path = project_root / "blueme" / "prompts.json"
    
    if not blueme_prompts_path.exists():
        print(f"blueme 프롬프트 파일을 찾을 수 없습니다: {blueme_prompts_path}")
        return False
    
    # blueme 데이터 읽기
    try:
        with open(blueme_prompts_path, 'r', encoding='utf-8') as f:
            blueme_prompts = json.load(f)
        print(f"blueme 프롬프트 파일 읽기 완료: {len(blueme_prompts)}개 프롬프트")
    except Exception as e:
        print(f"blueme 프롬프트 파일 읽기 실패: {e}")
        return False
    
    # 새로운 구조로 변환
    migrated_prompts = []
    now = datetime.now().isoformat()
    
    for i, prompt in enumerate(blueme_prompts):
        # ID 생성 (타임스탬프 기반)
        prompt_id = str(int(datetime.now().timestamp() * 1000000) + i)
        
        migrated_prompt = {
            'id': prompt_id,
            'title': prompt.get('title', ''),
            'type': prompt.get('type', 'GPT'),
            'text': prompt.get('text', ''),
            'folder_id': None,  # 폴더 기능이 없으므로 None
            'created_at': now,
            'updated_at': now
        }
        
        # autotext가 있으면 추가
        if 'autotext' in prompt:
            migrated_prompt['autotext'] = prompt['autotext']
        
        # shortcut은 무시 (자동변환 텍스트만 지원)
        
        migrated_prompts.append(migrated_prompt)
    
    # 새로운 prompts.json에 저장
    try:
        os.makedirs(config.DATA_DIR, exist_ok=True)
        
        with open(config.PROMPTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(migrated_prompts, f, ensure_ascii=False, indent=2)
        
        print(f"마이그레이션 완료: {len(migrated_prompts)}개 프롬프트")
        print(f"   저장 경로: {config.PROMPTS_FILE}")
        
        # 통계 출력
        autotext_count = sum(1 for p in migrated_prompts if 'autotext' in p)
        print(f"   - 자동변환 텍스트가 있는 프롬프트: {autotext_count}개")
        
        # 타입별 통계
        type_stats = {}
        for p in migrated_prompts:
            ptype = p.get('type', 'GPT')
            type_stats[ptype] = type_stats.get(ptype, 0) + 1
        
        print("   - 타입별 통계:")
        for ptype, count in type_stats.items():
            print(f"     * {ptype}: {count}개")
        
        return True
    
    except Exception as e:
        print(f"마이그레이션 실패: {e}")
        import traceback
        print(traceback.format_exc())
        return False


def init_folders():
    """
    빈 폴더 파일을 생성합니다.
    """
    try:
        os.makedirs(config.DATA_DIR, exist_ok=True)
        
        with open(config.FOLDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        
        print(f"폴더 파일 생성 완료: {config.FOLDERS_FILE}")
        return True
    
    except Exception as e:
        print(f"폴더 파일 생성 실패: {e}")
        return False


if __name__ == "__main__":
    # Windows 콘솔 UTF-8 설정
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("=" * 60)
    print("blueme 데이터 마이그레이션")
    print("=" * 60)
    print()
    
    # 기존 데이터 백업 확인
    if os.path.exists(config.PROMPTS_FILE):
        print(f"경고: 기존 프롬프트 파일이 존재합니다: {config.PROMPTS_FILE}")
        response = input("기존 데이터를 덮어쓰시겠습니까? (y/N): ")
        if response.lower() != 'y':
            print("마이그레이션 취소됨")
            sys.exit(0)
        print()
    
    # 마이그레이션 실행
    success = migrate_blueme_data()
    
    if success:
        # 폴더 파일 초기화
        init_folders()
        print()
        print("=" * 60)
        print("마이그레이션 완료!")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("마이그레이션 실패!")
        print("=" * 60)
        sys.exit(1)

