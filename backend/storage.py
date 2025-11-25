"""
JSON 파일 기반 데이터 저장소 모듈

프롬프트와 폴더 데이터를 JSON 파일로 관리합니다.
"""
import json
import os
from typing import List, Dict, Optional
from datetime import datetime
from backend.config import config


def _read_json_file(file_path: str) -> List[Dict]:
    """
    JSON 파일 읽기
    
    Args:
        file_path: JSON 파일 경로
    
    Returns:
        List[Dict]: JSON 데이터 리스트
    """
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []


def _write_json_file(file_path: str, data: List[Dict]) -> bool:
    """
    JSON 파일 쓰기
    
    Args:
        file_path: JSON 파일 경로
        data: 저장할 데이터 리스트
    
    Returns:
        bool: 성공 여부
    """
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False


def _generate_id() -> str:
    """
    고유 ID 생성
    
    Returns:
        str: 타임스탬프 기반 고유 ID
    """
    return str(int(datetime.now().timestamp() * 1000000))


# ============== 프롬프트 관련 함수 ==============

def get_prompts(folder_id: Optional[int] = None, prompt_type: Optional[str] = None) -> List[Dict]:
    """
    프롬프트 목록 조회
    
    Args:
        folder_id: 폴더 ID로 필터링 (선택사항)
        prompt_type: 프롬프트 타입으로 필터링 (선택사항)
    
    Returns:
        List[Dict]: 프롬프트 목록
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    if folder_id is not None:
        prompts = [p for p in prompts if p.get('folder_id') == folder_id]
    
    if prompt_type:
        prompts = [p for p in prompts if p.get('type') == prompt_type]
    
    return prompts


def get_prompt_by_id(prompt_id: str) -> Optional[Dict]:
    """
    ID로 프롬프트 조회
    
    Args:
        prompt_id: 프롬프트 ID
    
    Returns:
        Optional[Dict]: 프롬프트 데이터 또는 None
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    for prompt in prompts:
        if prompt.get('id') == prompt_id:
            return prompt
    
    return None


def create_prompt(title: str, prompt_type: str, text: str, 
                 autotext: Optional[str] = None, folder_id: Optional[int] = None) -> Dict:
    """
    프롬프트 생성
    
    Args:
        title: 프롬프트 제목
        prompt_type: 프롬프트 타입 (GPT, Cursor 등)
        text: 프롬프트 내용
        autotext: 자동변환 텍스트 (선택사항)
        folder_id: 폴더 ID (선택사항)
    
    Returns:
        Dict: 생성된 프롬프트 데이터
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    # 자동변환 텍스트 중복 체크
    if autotext:
        for p in prompts:
            if p.get('autotext') == autotext:
                raise ValueError(f"자동변환 텍스트 '{autotext}'는 이미 사용 중입니다.")
    
    prompt_id = _generate_id()
    now = datetime.now().isoformat()
    
    new_prompt = {
        'id': prompt_id,
        'title': title,
        'type': prompt_type,
        'text': text,
        'folder_id': folder_id,
        'created_at': now,
        'updated_at': now
    }
    
    if autotext:
        new_prompt['autotext'] = autotext
    
    prompts.append(new_prompt)
    _write_json_file(config.PROMPTS_FILE, prompts)
    
    return new_prompt


def update_prompt(prompt_id: str, title: Optional[str] = None, 
                 prompt_type: Optional[str] = None, text: Optional[str] = None,
                 autotext: Optional[str] = None, folder_id: Optional[int] = None,
                 remove_autotext: bool = False) -> Optional[Dict]:
    """
    프롬프트 수정
    
    Args:
        prompt_id: 프롬프트 ID
        title: 프롬프트 제목 (선택사항)
        prompt_type: 프롬프트 타입 (선택사항)
        text: 프롬프트 내용 (선택사항)
        autotext: 자동변환 텍스트 (선택사항)
        folder_id: 폴더 ID (선택사항)
        remove_autotext: 자동변환 텍스트 제거 여부
    
    Returns:
        Optional[Dict]: 수정된 프롬프트 데이터 또는 None
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    # 자동변환 텍스트 중복 체크
    if autotext:
        for p in prompts:
            if p.get('id') != prompt_id and p.get('autotext') == autotext:
                raise ValueError(f"자동변환 텍스트 '{autotext}'는 이미 사용 중입니다.")
    
    for i, prompt in enumerate(prompts):
        if prompt.get('id') == prompt_id:
            if title is not None:
                prompt['title'] = title
            if prompt_type is not None:
                prompt['type'] = prompt_type
            if text is not None:
                prompt['text'] = text
            if folder_id is not None:
                prompt['folder_id'] = folder_id
            if autotext is not None:
                prompt['autotext'] = autotext
            if remove_autotext and 'autotext' in prompt:
                del prompt['autotext']
            
            prompt['updated_at'] = datetime.now().isoformat()
            
            _write_json_file(config.PROMPTS_FILE, prompts)
            return prompt
    
    return None


def delete_prompt(prompt_id: str) -> bool:
    """
    프롬프트 삭제
    
    Args:
        prompt_id: 프롬프트 ID
    
    Returns:
        bool: 삭제 성공 여부
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    for i, prompt in enumerate(prompts):
        if prompt.get('id') == prompt_id:
            prompts.pop(i)
            _write_json_file(config.PROMPTS_FILE, prompts)
            return True
    
    return False


def get_autotext_dict() -> Dict[str, str]:
    """
    자동변환 텍스트 딕셔너리 조회
    
    Returns:
        Dict[str, str]: {autotext: text} 형식의 딕셔너리
    """
    prompts = _read_json_file(config.PROMPTS_FILE)
    
    result = {}
    for prompt in prompts:
        autotext = prompt.get('autotext')
        if autotext:
            result[autotext] = prompt.get('text', '')
    
    return result


# ============== 폴더 관련 함수 ==============

def get_folders() -> List[Dict]:
    """
    폴더 목록 조회
    
    Returns:
        List[Dict]: 폴더 목록
    """
    return _read_json_file(config.FOLDERS_FILE)


def get_folder_by_id(folder_id: int) -> Optional[Dict]:
    """
    ID로 폴더 조회
    
    Args:
        folder_id: 폴더 ID
    
    Returns:
        Optional[Dict]: 폴더 데이터 또는 None
    """
    folders = _read_json_file(config.FOLDERS_FILE)
    
    for folder in folders:
        if folder.get('id') == folder_id:
            return folder
    
    return None


def create_folder(name: str) -> Dict:
    """
    폴더 생성
    
    Args:
        name: 폴더 이름
    
    Returns:
        Dict: 생성된 폴더 데이터
    """
    folders = _read_json_file(config.FOLDERS_FILE)
    
    # ID는 정수로 자동 증가
    folder_id = 1
    if folders:
        folder_id = max(f.get('id', 0) for f in folders) + 1
    
    now = datetime.now().isoformat()
    
    new_folder = {
        'id': folder_id,
        'name': name,
        'created_at': now,
        'updated_at': now
    }
    
    folders.append(new_folder)
    _write_json_file(config.FOLDERS_FILE, folders)
    
    return new_folder


def update_folder(folder_id: int, name: str) -> Optional[Dict]:
    """
    폴더 수정
    
    Args:
        folder_id: 폴더 ID
        name: 폴더 이름
    
    Returns:
        Optional[Dict]: 수정된 폴더 데이터 또는 None
    """
    folders = _read_json_file(config.FOLDERS_FILE)
    
    for i, folder in enumerate(folders):
        if folder.get('id') == folder_id:
            folder['name'] = name
            folder['updated_at'] = datetime.now().isoformat()
            
            _write_json_file(config.FOLDERS_FILE, folders)
            return folder
    
    return None


def delete_folder(folder_id: int) -> bool:
    """
    폴더 삭제
    
    Args:
        folder_id: 폴더 ID
    
    Returns:
        bool: 삭제 성공 여부
    """
    folders = _read_json_file(config.FOLDERS_FILE)
    
    for i, folder in enumerate(folders):
        if folder.get('id') == folder_id:
            folders.pop(i)
            _write_json_file(config.FOLDERS_FILE, folders)
            
            # 폴더에 속한 프롬프트의 folder_id 제거
            prompts = _read_json_file(config.PROMPTS_FILE)
            for prompt in prompts:
                if prompt.get('folder_id') == folder_id:
                    prompt['folder_id'] = None
            _write_json_file(config.PROMPTS_FILE, prompts)
            
            return True
    
    return False

