# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller 빌드 설정 파일

백엔드 FastAPI 서버를 독립 실행 파일로 빌드합니다.
"""

block_cipher = None

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=[],
    datas=[
        # 데이터 파일 포함 (필요시)
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'backend.routers.prompts',
        'backend.routers.folders',
        'backend.routers.autotext',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'pysqlite2',      # SQLite 대체 구현 (사용 안 함)
        'MySQLdb',        # MySQL 드라이버 (사용 안 함)
        'psycopg2',       # PostgreSQL 드라이버 (사용 안 함)
        'tzdata',         # 타임존 데이터 (SQLite 기본 포함)
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ppop_promt_backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 콘솔 윈도우 표시 (디버깅용, False로 변경 가능)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='../public/logo.png'
)

