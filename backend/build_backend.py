"""
Backend Build Script

Builds backend as standalone executable using PyInstaller.
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

def build_backend():
    """Build backend using PyInstaller"""
    print("[BUILD] Starting backend build...")
    
    # Current script location (backend directory)
    backend_dir = Path(__file__).parent
    # Project root
    root_dir = backend_dir.parent
    spec_file = backend_dir / "build.spec"
    
    # Temporarily copy run.py to backend directory
    run_py_src = root_dir / "run.py"
    run_py_dest = backend_dir / "run.py"
    
    if not run_py_src.exists():
        print(f"[ERROR] run.py not found: {run_py_src}")
        return False
    
    print(f"[INFO] Copying run.py: {run_py_src} -> {run_py_dest}")
    shutil.copy2(run_py_src, run_py_dest)
    
    try:
        # Run PyInstaller
        print(f"[INFO] Running PyInstaller: {spec_file}")
        result = subprocess.run(
            [sys.executable, "-m", "PyInstaller", str(spec_file), "--clean"],
            cwd=str(backend_dir),
            check=True
        )
        
        # Built file location
        exe_path = backend_dir / "dist" / "ppop_promt_backend.exe"
        
        if exe_path.exists():
            print(f"[SUCCESS] Backend build completed: {exe_path}")
            
            # Copy to resources directory for electron-builder
            resources_dir = root_dir / "resources"
            resources_dir.mkdir(exist_ok=True)
            
            dest_exe = resources_dir / "ppop_promt_backend.exe"
            shutil.copy2(exe_path, dest_exe)
            print(f"[INFO] Executable copied: {dest_exe}")
        else:
            print("[ERROR] Built executable not found.")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Build failed: {e}")
        return False
    finally:
        # Clean up temporarily copied run.py
        if run_py_dest.exists():
            run_py_dest.unlink()
            print("[INFO] Temporary files cleaned up")
    
    return True

if __name__ == "__main__":
    success = build_backend()
    sys.exit(0 if success else 1)
