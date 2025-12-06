"""
자동변환 텍스트 감지 서비스

키보드 입력을 감지하여 자동변환 텍스트를 처리하는 백그라운드 서비스입니다.
ppop_promt의 GlobalAutoTextWatcher 로직을 기반으로 합니다.
"""
import keyboard
import pyperclip
import threading
import time
import requests
from typing import Dict


class AutoTextWatcher:
    """
    자동변환 텍스트 감지 및 처리 클래스
    
    키보드 입력을 모니터링하여 트리거 텍스트를 감지하고
    해당하는 프롬프트 텍스트로 자동 변환합니다.
    """
    
    def __init__(self, api_url: str = "http://127.0.0.1:8000", debug: bool = False):
        """
        AutoTextWatcher 초기화
        
        Args:
            api_url: FastAPI 서버 URL
            debug: 디버그 모드 활성화 여부
        """
        self.api_url = api_url
        self.autotext_dict: Dict[str, str] = {}
        self.previous_dict: Dict[str, str] = {}  # 이전 딕셔너리 저장 (변경 감지용)
        self.typed = ""
        self.running = False
        self.lock = threading.Lock()
        self.thread: threading.Thread = None
        self.debug = debug  # 디버그 모드
    
    def start(self):
        """자동변환 감지 서비스 시작"""
        if self.running:
            if self.debug:
                print("[WARNING] 자동변환 텍스트 감지 서비스가 이미 실행 중입니다.")
            return
        
        self.running = True
        
        # 딕셔너리 초기 로드
        self.update_dict_from_api(is_initial=True)
        
        # 백그라운드 스레드 시작
        self.thread = threading.Thread(target=self._watch, daemon=True)
        self.thread.start()
    
    def stop(self):
        """자동변환 감지 서비스 중지"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
    
    def _compare_dicts(self, old_dict: Dict[str, str], new_dict: Dict[str, str]) -> dict:
        """
        두 딕셔너리를 비교하여 변경사항을 반환합니다.
        
        Args:
            old_dict: 이전 딕셔너리
            new_dict: 새로운 딕셔너리
        
        Returns:
            dict: 변경사항 정보 (added, removed, modified, unchanged)
        """
        old_keys = set(old_dict.keys())
        new_keys = set(new_dict.keys())
        
        added = new_keys - old_keys
        removed = old_keys - new_keys
        common = old_keys & new_keys
        
        modified = {k for k in common if old_dict[k] != new_dict[k]}
        unchanged = common - modified
        
        return {
            'added': added,
            'removed': removed,
            'modified': modified,
            'unchanged': unchanged,
            'total_old': len(old_dict),
            'total_new': len(new_dict)
        }
    
    def update_dict_from_api(self, is_initial: bool = False):
        """
        API에서 자동변환 텍스트 딕셔너리 업데이트
        
        Args:
            is_initial: 초기 로드 여부 (항상 로그 출력)
        """
        max_retries = 5
        retry_delay = 1
        
        if self.debug:
            print(f"[DEBUG] 딕셔너리 업데이트 시작: {self.api_url}/api/autotexts/dict")
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_url}/api/autotexts/dict", timeout=3)
                elapsed_time = (time.time() - start_time) * 1000  # 밀리초
                
                if response.status_code == 200:
                    new_dict = response.json()
                    
                    with self.lock:
                        # 이전 딕셔너리와 비교
                        changes = self._compare_dicts(self.previous_dict, new_dict)
                        
                        # 딕셔너리 업데이트
                        self.previous_dict = self.autotext_dict.copy()
                        self.autotext_dict = new_dict
                        
                        # 디버그 모드에서만 로그 출력
                        if self.debug:
                            has_changes = (len(changes['added']) > 0 or 
                                         len(changes['removed']) > 0 or 
                                         len(changes['modified']) > 0)
                            
                            if is_initial or has_changes:
                                print(f"✅ 자동변환 텍스트 딕셔너리 업데이트 완료: {len(new_dict)}개 트리거 (응답 시간: {elapsed_time:.1f}ms)")
                                
                                if has_changes and not is_initial:
                                    if changes['added']:
                                        print(f"   ➕ 추가됨: {list(changes['added'])}")
                                    if changes['removed']:
                                        print(f"   ➖ 제거됨: {list(changes['removed'])}")
                                    if changes['modified']:
                                        print(f"   🔄 수정됨: {list(changes['modified'])}")
                                
                                if len(new_dict) > 0:
                                    print(f"   트리거 목록: {list(new_dict.keys())}")
                    
                    return
                else:
                    if self.debug:
                        print(f"[ERROR] 자동변환 텍스트 딕셔너리 업데이트 실패: HTTP {response.status_code}")
            except requests.exceptions.ConnectionError:
                if attempt < max_retries - 1:
                    if self.debug:
                        print(f"[WARNING] API 서버에 연결할 수 없습니다. {retry_delay}초 후 재시도... ({attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # 지수 백오프
            except Exception as e:
                if self.debug:
                    print(f"[ERROR] 자동변환 텍스트 딕셔너리 업데이트 실패: {e}")
                    import traceback
                    print(f"[ERROR] 상세 오류:\n{traceback.format_exc()}")
                break
    
    def trigger_update(self):
        """
        딕셔너리 업데이트를 수동으로 트리거합니다.
        프롬프트가 저장/수정/삭제될 때 호출됩니다.
        """
        if not self.running:
            print("[DEBUG] watcher가 실행 중이 아니므로 업데이트를 건너뜁니다.")
            return
        
        print("[DEBUG] 딕셔너리 업데이트 트리거됨 (프롬프트 변경 감지)")
        
        # 별도 스레드에서 업데이트 실행 (블로킹 방지)
        update_thread = threading.Thread(target=self.update_dict_from_api, args=(False,), daemon=True)
        update_thread.start()
    
    def _watch(self):
        """키보드 입력 감지 및 처리 (ppop_promt의 GlobalAutoTextWatcher 로직 기반)"""
        def on_key(e):
            if not self.running:
                return
            
            try:
                if e.event_type == 'down' and e.name is not None:
                    with self.lock:
                        if len(e.name) == 1 and e.name.isprintable():
                            # 일반 문자 입력
                            self.typed += e.name
                            # 트리거 텍스트 확인 (가장 긴 매칭 우선)
                            matched_trigger = None
                            matched_replacement = None
                            for trigger, replacement in self.autotext_dict.items():
                                if self.typed.endswith(trigger):
                                    if matched_trigger is None or len(trigger) > len(matched_trigger):
                                        matched_trigger = trigger
                                        matched_replacement = replacement
                            
                            if matched_trigger:
                                # 트리거 텍스트 삭제
                                for _ in range(len(matched_trigger)):
                                    keyboard.send('backspace')
                                # 프롬프트 텍스트 붙여넣기
                                pyperclip.copy(matched_replacement)
                                time.sleep(0.1)  # 클립보드 복사 대기 시간 증가
                                keyboard.send('ctrl+v')
                                self.typed = self.typed[:-len(matched_trigger)]
                        elif e.name == 'space':
                            self.typed += ' '
                        elif e.name == 'backspace':
                            self.typed = self.typed[:-1] if len(self.typed) > 0 else ""
                        elif e.name == 'enter':
                            self.typed = ""
                        elif e.name in ['tab', 'shift', 'ctrl', 'alt', 'caps lock', 'esc']:
                            # 특수 키는 무시
                            pass
                        else:
                            # 기타 키 입력 시 typed 초기화 (트리거 매칭 실패)
                            if len(self.typed) > 100:  # 너무 길어지면 초기화
                                self.typed = ""
            except Exception as ex:
                print(f"키보드 이벤트 처리 오류: {ex}")
                self.typed = ""
        
        try:
            print("키보드 후크 등록 중...")
            keyboard.hook(on_key)
            print("✅ 키보드 후크 등록 완료. 키보드 입력 감지 시작.")
            print("💡 다른 애플리케이션에서 트리거 텍스트를 입력하면 자동으로 변환됩니다.")
            keyboard.wait()
        except PermissionError as ex:
            print(f"❌ 키보드 후크 등록 실패: 권한 오류")
            print(f"   오류 상세: {ex}")
            print("⚠️  Windows에서 키보드 후크를 사용하려면 관리자 권한으로 실행해야 합니다.")
            print("   Electron 앱을 관리자 권한으로 실행해주세요.")
        except Exception as ex:
            print(f"❌ 키보드 후크 등록 실패: {ex}")
            print("⚠️  참고: Windows에서 키보드 후크를 사용하려면 관리자 권한이 필요할 수 있습니다.")


def start_autotext_watcher(api_url: str = "http://127.0.0.1:8000", debug: bool = False):
    """
    자동변환 텍스트 감지 서비스 시작 함수
    
    Args:
        api_url: FastAPI 서버 URL
        debug: 디버그 모드 활성화 여부
    
    Returns:
        AutoTextWatcher: 생성된 watcher 인스턴스
    """
    watcher = AutoTextWatcher(api_url, debug=debug)
    watcher.start()
    return watcher


if __name__ == "__main__":
    # 독립 실행 시 테스트
    print("자동변환 텍스트 감지 서비스 시작...")
    watcher = start_autotext_watcher()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n서비스 종료 중...")
        watcher.stop()
        print("서비스 종료 완료")

