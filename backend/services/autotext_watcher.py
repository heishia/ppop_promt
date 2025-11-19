"""
자동변환 텍스트 감지 서비스

키보드 입력을 감지하여 자동변환 텍스트를 처리하는 백그라운드 서비스입니다.
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
    
    def __init__(self, api_url: str = "http://127.0.0.1:8000"):
        """
        AutoTextWatcher 초기화
        
        Args:
            api_url: FastAPI 서버 URL
        """
        self.api_url = api_url
        self.autotext_dict: Dict[str, str] = {}
        self.typed = ""
        self.running = False
        self.lock = threading.Lock()
        self.thread: threading.Thread = None
        self.update_interval = 5  # 5초마다 딕셔너리 업데이트
    
    def start(self):
        """자동변환 감지 서비스 시작"""
        if self.running:
            return
        
        self.running = True
        self.update_dict_from_api()
        
        # 백그라운드 스레드 시작
        self.thread = threading.Thread(target=self._watch, daemon=True)
        self.thread.start()
        
        # 주기적으로 딕셔너리 업데이트하는 스레드
        update_thread = threading.Thread(target=self._periodic_update, daemon=True)
        update_thread.start()
    
    def stop(self):
        """자동변환 감지 서비스 중지"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
    
    def update_dict_from_api(self):
        """API에서 자동변환 텍스트 딕셔너리 업데이트"""
        try:
            response = requests.get(f"{self.api_url}/api/autotexts/dict", timeout=2)
            if response.status_code == 200:
                with self.lock:
                    self.autotext_dict = response.json()
        except Exception as e:
            print(f"자동변환 텍스트 딕셔너리 업데이트 실패: {e}")
    
    def _periodic_update(self):
        """주기적으로 딕셔너리 업데이트"""
        while self.running:
            time.sleep(self.update_interval)
            self.update_dict_from_api()
    
    def _watch(self):
        """키보드 입력 감지 및 처리"""
        def on_key(e):
            if not self.running:
                return
            
            if e.event_type == 'down' and e.name is not None:
                if len(e.name) == 1:
                    # 일반 문자 입력
                    self.typed += e.name
                    with self.lock:
                        for trigger, replacement in self.autotext_dict.items():
                            if self.typed.endswith(trigger):
                                # 트리거 텍스트 삭제
                                for _ in range(len(trigger)):
                                    keyboard.send('backspace')
                                # 프롬프트 텍스트 붙여넣기
                                pyperclip.copy(replacement)
                                time.sleep(0.05)
                                keyboard.send('ctrl+v')
                                self.typed = ""
                                break
                elif e.name == 'space':
                    self.typed += ' '
                elif e.name == 'backspace':
                    self.typed = self.typed[:-1] if len(self.typed) > 0 else ""
                elif e.name == 'enter':
                    self.typed = ""
        
        keyboard.hook(on_key)
        keyboard.wait()

def start_autotext_watcher(api_url: str = "http://127.0.0.1:8000"):
    """
    자동변환 텍스트 감지 서비스 시작 함수
    
    Args:
        api_url: FastAPI 서버 URL
    
    Returns:
        AutoTextWatcher: 생성된 watcher 인스턴스
    """
    watcher = AutoTextWatcher(api_url)
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

