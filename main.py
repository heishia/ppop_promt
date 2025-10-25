import sys
import os
import json
import keyboard
import pyperclip
import shutil
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                            QPushButton, QTextEdit, QLabel, QLineEdit, QListWidget, QStackedWidget, QHBoxLayout, QComboBox, QKeySequenceEdit)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon
import threading
import time

def resource_path(relative_path):
    """PyInstaller에서 리소스 경로를 올바르게 찾도록 도와줌"""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.dirname(__file__), relative_path)

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(__file__)

def get_data_dir():
    appdata_dir = os.path.join(os.environ['APPDATA'], 'blueme')
    os.makedirs(appdata_dir, exist_ok=True)
    return appdata_dir

def init_data_files():
    """최초 실행 시 기본 데이터 파일을 APPDATA로 복사"""
    data_dir = get_data_dir()
    
    # prompts.json 초기화
    prompt_dest = os.path.join(data_dir, 'prompts.json')
    if not os.path.exists(prompt_dest):
        prompt_src = resource_path('prompts.json')
        if os.path.exists(prompt_src):
            shutil.copy2(prompt_src, prompt_dest)
    
    # educations.json 초기화
    edu_dest = os.path.join(data_dir, 'educations.json')
    if not os.path.exists(edu_dest):
        edu_src = resource_path('educations.json')
        if os.path.exists(edu_src):
            shutil.copy2(edu_src, edu_dest)

PROMPT_PATH = os.path.join(get_data_dir(), 'prompts.json')
EDU_PATH = os.path.join(get_data_dir(), 'educations.json')

class MainMenu(QWidget):
    def __init__(self, switch_func):
        super().__init__()
        layout = QVBoxLayout()
        self.prompt_btn = QPushButton("프롬프트 저장")
        layout.addWidget(QLabel("뭐 할건디?"))
        layout.addWidget(self.prompt_btn)
        layout.addSpacing(20)  # 20픽셀만큼 빈 공간 추가
        self.setLayout(layout)
        self.prompt_btn.clicked.connect(lambda: switch_func(1))

class PromptPage(QWidget):
    def __init__(self, go_home_func):
        super().__init__()
        layout = QVBoxLayout()
        
        # 키 이벤트 처리를 위한 설정
        self.setFocusPolicy(Qt.FocusPolicy.StrongFocus)

        # 홈 버튼
        self.home_btn = QPushButton()
        self.home_btn.setIcon(QIcon("ui/home.png"))
        self.home_btn.setFixedSize(40, 40)
        self.home_btn.clicked.connect(go_home_func)
        layout.addWidget(self.home_btn, alignment=Qt.AlignmentFlag.AlignLeft)

        # 종류 선택 및 추가
        self.type_label = QLabel("종류:")
        self.type_combo = QComboBox()
        self.type_combo.addItems(["GPT", "Cursor"])
        self.add_type_btn = QPushButton("종류 추가")
        self.type_input = QLineEdit()
        self.type_input.setPlaceholderText("새 종류 입력 후 엔터")
        self.type_input.hide()
        type_layout = QHBoxLayout()
        type_layout.addWidget(self.type_combo)
        type_layout.addWidget(self.type_input)
        type_layout.addWidget(self.add_type_btn)
        layout.addWidget(self.type_label)
        layout.addLayout(type_layout)
        self.add_type_btn.clicked.connect(self.toggle_type_input)
        self.type_input.returnPressed.connect(self.add_type)

        # 제목 입력
        self.title_label = QLabel("제목:")
        self.title_input = QLineEdit()
        layout.addWidget(self.title_label)
        layout.addWidget(self.title_input)

        # 프롬프트 입력
        self.prompt_label = QLabel("프롬프트 적으삼:")
        self.prompt_input = QTextEdit()
        layout.addWidget(self.prompt_label)
        layout.addWidget(self.prompt_input)

        # 단축키 입력
        shortcut_layout = QHBoxLayout()
        self.shortcut_label = QLabel("단축키 셋팅 (예: ctrl+shift+p):")
        self.shortcut_input = QKeySequenceEdit()
        self.clear_shortcut_btn = QPushButton("비워두기")
        self.clear_shortcut_btn.clicked.connect(lambda: self.shortcut_input.clear())
        self.autotext_label = QLabel("자동변환 텍스트:")
        self.autotext_input = QLineEdit()
        self.autotext_input.setPlaceholderText("예: /hello")
        shortcut_layout.addWidget(self.shortcut_label)
        shortcut_layout.addWidget(self.shortcut_input)
        shortcut_layout.addWidget(self.clear_shortcut_btn)
        shortcut_layout.addWidget(self.autotext_label)
        shortcut_layout.addWidget(self.autotext_input)
        layout.addLayout(shortcut_layout)

        # stretch로 아래로 밀기
        layout.addStretch()

        # ======= 아래쪽에 종류별 보기 + 목록 묶어서 추가 =======
        list_layout = QVBoxLayout()
        self.filter_label = QLabel("종류별 보기:")
        self.filter_combo = QComboBox()
        self.filter_combo.addItem("전체")
        self.filter_combo.addItems(["GPT", "Cursor"])
        self.filter_combo.currentTextChanged.connect(self.load_prompts)
        list_layout.addWidget(self.filter_label)
        list_layout.addWidget(self.filter_combo)

        self.prompt_list = QListWidget()
        list_layout.addWidget(self.prompt_list)
        self.prompt_list.itemDoubleClicked.connect(self.load_selected_prompt)

        layout.addLayout(list_layout)

        # 추가 버튼
        self.new_prompt_btn = QPushButton("추가")
        self.new_prompt_btn.clicked.connect(self.clear_inputs)
        layout.addWidget(self.new_prompt_btn)

        # 저장/삭제 버튼
        self.save_button = QPushButton("저장")
        self.delete_button = QPushButton("선택 삭제")
        layout.addWidget(self.save_button)
        layout.addWidget(self.delete_button)

        self.setLayout(layout)
        self.save_button.clicked.connect(self.save_prompt)
        self.delete_button.clicked.connect(self.delete_prompt)

        self.load_prompts()

        # 자동변환 텍스트 관리를 위한 변수 추가
        self.autotext_handlers = {}  # 자동변환 텍스트 핸들러 저장
        self.current_handler = None  # 현재 활성화된 핸들러

    def toggle_type_input(self):
        if self.type_input.isVisible():
            self.type_input.hide()
        else:
            self.type_input.show()
            self.type_input.setFocus()

    def add_type(self):
        new_type = self.type_input.text().strip()
        if new_type and new_type not in [self.type_combo.itemText(i) for i in range(self.type_combo.count())]:
            self.type_combo.addItem(new_type)
            self.filter_combo.addItem(new_type)
        self.type_input.clear()
        self.type_input.hide()

    def save_prompt(self):
        title = self.title_input.text().strip()
        prompt_type = self.type_combo.currentText()
        prompt_text = self.prompt_input.toPlainText()
        shortcut = self.shortcut_input.keySequence().toString()
        autotext = self.autotext_input.text().strip()

        print(f"title: '{title}', type: '{prompt_type}', text: '{prompt_text}', shortcut: '{shortcut}', autotext: '{autotext}'")

        if not title or not prompt_text or not prompt_type:
            print("필수값 누락")
            return

        # 단축키나 자동변환 텍스트 중 하나는 있어야 함
        if not shortcut and not autotext:
            return

        # 자동변환 텍스트 유효성 검사
        if autotext:
            if len(autotext) < 2:
                return

        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
        except FileNotFoundError:
            prompts = []

        # 기존 title+type이 같은 프롬프트 제거 (덮어쓰기)
        prompts = [p for p in prompts if not (p.get('title', '') == title and p.get('type', '') == prompt_type)]

        # 새로운 프롬프트 추가
        prompt_data = {
            'title': title,
            'type': prompt_type,
            'text': prompt_text
        }
        
        # 단축키와 자동변환 텍스트 중 하나만 저장
        if shortcut:
            prompt_data['shortcut'] = shortcut
        elif autotext:
            prompt_data['autotext'] = autotext

        prompts.append(prompt_data)

        with open(PROMPT_PATH, 'w', encoding='utf-8') as f:
            json.dump(prompts, f, ensure_ascii=False, indent=2)

        # 단축키 설정
        if shortcut:
            self.setup_hotkey(shortcut, prompt_text)
        # 자동변환 텍스트 설정
        elif autotext:
            # 중복 체크 및 기존 핸들러 제거
            for p in prompts:
                if p.get('autotext') == autotext:
                    self.remove_autotext(autotext)
                    break
            # 새로운 자동변환 텍스트 설정
            self.setup_autotext(autotext, prompt_text)
        
        self.load_prompts()
        global global_autotext_watcher
        global_autotext_watcher.update_dict(get_autotext_dict())

    def load_prompts(self):
        filter_type = self.filter_combo.currentText() if hasattr(self, 'filter_combo') else "전체"
        self.prompt_list.clear()
        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    prompt_type = item.get('type', '')
                    title = item.get('title', '')
                    if filter_type == "전체" or prompt_type == filter_type:
                        display_text = title  # 제목만 표시
                        self.prompt_list.addItem(display_text)
        except FileNotFoundError:
            pass

    def delete_prompt(self):
        current_item = self.prompt_list.currentItem()
        if not current_item:
            return
        # 제목만 추출 (대괄호 이전까지)
        display_text = current_item.text()
        title = display_text.split(' [')[0].strip()
        filter_type = self.filter_combo.currentText()
        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
            
            # 삭제할 프롬프트의 자동변환 텍스트 제거
            for p in prompts:
                if p.get('title', '') == title and (filter_type == "전체" or p.get('type', '') == filter_type):
                    if 'autotext' in p:
                        self.remove_autotext(p['autotext'])
                    break
                
            # 프롬프트 삭제
            prompts = [p for p in prompts if not (p.get('title', '') == title and 
                      (filter_type == "전체" or p.get('type', '') == filter_type))]
            
            with open(PROMPT_PATH, 'w', encoding='utf-8') as f:
                json.dump(prompts, f, ensure_ascii=False, indent=2)
            
            self.load_prompts()
            global global_autotext_watcher
            global_autotext_watcher.update_dict(get_autotext_dict())
        except FileNotFoundError:
            pass

    def load_selected_prompt(self, item):
        # 제목만 추출 (대괄호 이전까지)
        display_text = item.text()
        title = display_text.split(' [')[0].strip()
        filter_type = self.filter_combo.currentText()
        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
                for p in prompts:
                    if p.get('title', '') == title and (filter_type == "전체" or p.get('type', '') == filter_type):
                        self.title_input.setText(p.get('title', ''))
                        self.type_combo.setCurrentText(p.get('type', ''))
                        self.prompt_input.setText(p['text'])
                        # 단축키와 자동변환 텍스트 중 하나만 설정
                        if 'shortcut' in p:
                            self.shortcut_input.setKeySequence(p['shortcut'])
                            self.autotext_input.clear()
                        elif 'autotext' in p:
                            self.shortcut_input.clear()
                            self.autotext_input.setText(p['autotext'])
                        break
        except FileNotFoundError:
            pass

    def setup_hotkey(self, shortcut, text):
        try:
            keyboard.remove_hotkey(shortcut)
        except:
            pass
        keyboard.add_hotkey(shortcut, lambda: self.paste_text(text))

    def load_hotkeys(self):
        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
                for prompt in prompts:
                    if 'shortcut' in prompt and prompt['shortcut']:
                        self.setup_hotkey(prompt['shortcut'], prompt['text'])
        except FileNotFoundError:
            pass

    def paste_text(self, text):
        pyperclip.copy(text)
        keyboard.send('ctrl+v')

    def setup_autotext(self, trigger_text, replacement_text):
        # 이미 등록된 트리거 텍스트가 있는지 확인
        if trigger_text in self.autotext_handlers:
            # 기존 핸들러 제거
            self.remove_autotext(trigger_text)
        
        def on_text_change(event):
            try:
                if event.event_type == keyboard.KEY_DOWN:
                    focused_widget = QApplication.focusWidget()
                    if not focused_widget:
                        return
                    # 안전하게 텍스트 추출
                    if isinstance(focused_widget, QLineEdit):
                        current_text = focused_widget.text()
                    elif hasattr(focused_widget, 'toPlainText'):
                        current_text = focused_widget.toPlainText()
                    else:
                        return
                    
                    # 트리거 텍스트가 포함되어 있는지 확인
                    if trigger_text in current_text:
                        # 트리거 텍스트를 대체 텍스트로 교체
                        new_text = current_text.replace(trigger_text, replacement_text)
                        
                        # 현재 입력 중인 텍스트를 대체
                        if isinstance(focused_widget, QLineEdit):
                            focused_widget.setText(new_text)
                        else:
                            focused_widget.setPlainText(new_text)
                        
                        # 커서를 텍스트 끝으로 이동
                        focused_widget.setCursorPosition(len(new_text))
            except Exception:
                return
        
        # 핸들러 저장
        self.autotext_handlers[trigger_text] = keyboard.hook(on_text_change)

    def remove_autotext(self, trigger_text):
        if trigger_text in self.autotext_handlers:
            keyboard.unhook(self.autotext_handlers[trigger_text])
            del self.autotext_handlers[trigger_text]

    def load_autotexts(self):
        try:
            with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
                prompts = json.load(f)
                for prompt in prompts:
                    if 'autotext' in prompt and prompt['autotext']:
                        self.setup_autotext(prompt['autotext'], prompt['text'])
        except FileNotFoundError:
            pass

    def cleanup_autotexts(self):
        for trigger_text in list(self.autotext_handlers.keys()):
            self.remove_autotext(trigger_text)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Delete:
            self.delete_prompt()
        super().keyPressEvent(event)

    def clear_inputs(self):
        """입력 필드들을 초기화하는 함수"""
        self.title_input.clear()
        self.type_combo.setCurrentIndex(0)
        self.prompt_input.clear()
        self.shortcut_input.clear()
        self.autotext_input.clear()

class BluemeApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Blueme made with 김뽀삐")
        self.setGeometry(100, 100, 800, 600)
        
        self.stacked = QStackedWidget()
        self.setCentralWidget(self.stacked)
        
        # 각 페이지 생성
        self.menu = MainMenu(self.switch_page)
        self.prompt_page = PromptPage(lambda: self.switch_page(0))

        self.stacked.addWidget(self.menu)
        self.stacked.addWidget(self.prompt_page)
        
        # 저장된 단축키 로드 및 설정
        self.prompt_page.load_hotkeys()
        self.prompt_page.load_autotexts()
        
        self.stacked.setCurrentIndex(0)  # 0번(메인 메뉴) 화면을 처음에 보여줌
        
    def switch_page(self, idx):
        self.stacked.setCurrentIndex(idx)

    def closeEvent(self, event):
        # 프로그램 종료 시 정리
        self.prompt_page.cleanup_autotexts()
        super().closeEvent(event)

def get_autotext_dict():
    try:
        with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
            prompts = json.load(f)
            return {p['autotext']: p['text'] for p in prompts if 'autotext' in p}
    except Exception:
        return {}

class GlobalAutoTextWatcher:
    def __init__(self):
        self.autotext_dict = {}
        self.typed = ""
        self.running = True
        self.lock = threading.Lock()
        self.thread = threading.Thread(target=self._watch, daemon=True)
        self.thread.start()

    def update_dict(self, new_dict):
        with self.lock:
            self.autotext_dict = new_dict

    def stop(self):
        self.running = False

    def _watch(self):
        def on_key(e):
            if not self.running:
                return
            if e.event_type == 'down' and e.name is not None and len(e.name) == 1:
                self.typed += e.name
                with self.lock:
                    for trigger, replacement in self.autotext_dict.items():
                        if self.typed.endswith(trigger):
                            for _ in range(len(trigger)):
                                keyboard.send('backspace')
                            pyperclip.copy(replacement)
                            time.sleep(0.05)
                            keyboard.send('ctrl+v')
                            self.typed = ""
                            break
            elif e.event_type == 'down' and e.name == 'space':
                self.typed += ' '
            elif e.event_type == 'down' and e.name == 'backspace':
                self.typed = self.typed[:-1]
            elif e.event_type == 'down' and e.name == 'enter':
                self.typed = ""

        keyboard.hook(on_key)
        keyboard.wait()

if __name__ == '__main__':
    # 데이터 파일 초기화 (최초 실행 시)
    init_data_files()
    
    global_autotext_watcher = GlobalAutoTextWatcher()
    global_autotext_watcher.update_dict(get_autotext_dict())

    app = QApplication(sys.argv)
    window = BluemeApp()
    window.show()
    sys.exit(app.exec()) 