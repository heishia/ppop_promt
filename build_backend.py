"""
백엔드 빌드 스크립트

PyInstaller를 사용하여 백엔드를 독립 실행 파일로 빌드합니다.
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

def build_backend():
    """백엔드를 PyInstaller로 빌드"""
    print("🔨 백엔드 빌드를 시작합니다...")
    
    # 프로젝트 루트
    root_dir = Path(__file__).parent
    backend_dir = root_dir / "backend"
    spec_file = backend_dir / "build.spec"
    
    # run.py를 backend 디렉토리로 임시 복사
    run_py_src = root_dir / "run.py"
    run_py_dest = backend_dir / "run.py"
    
    print(f"📋 run.py를 복사합니다: {run_py_src} -> {run_py_dest}")
    shutil.copy2(run_py_src, run_py_dest)
    
    try:
        # PyInstaller 실행
        print(f"🔧 PyInstaller를 실행합니다: {spec_file}")
        result = subprocess.run(
            [sys.executable, "-m", "PyInstaller", str(spec_file), "--clean"],
            cwd=str(backend_dir),
            check=True
        )
        
        # 빌드된 파일 위치
        exe_path = backend_dir / "dist" / "ppop_promt_backend.exe"
        
        if exe_path.exists():
            print(f"✅ 백엔드 빌드 완료: {exe_path}")
            
            # electron-builder가 찾을 수 있도록 루트의 resources 디렉토리로 복사
            resources_dir = root_dir / "resources"
            resources_dir.mkdir(exist_ok=True)
            
            dest_exe = resources_dir / "ppop_promt_backend.exe"
            shutil.copy2(exe_path, dest_exe)
            print(f"📦 실행 파일 복사 완료: {dest_exe}")
        else:
            print("❌ 빌드된 실행 파일을 찾을 수 없습니다.")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ 빌드 실패: {e}")
        return False
    finally:
        # 임시로 복사한 run.py 삭제
        if run_py_dest.exists():
            run_py_dest.unlink()
            print("🧹 임시 파일 정리 완료")
    
    return True

if __name__ == "__main__":
    success = build_backend()
    sys.exit(0 if success else 1)

