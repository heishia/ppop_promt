/**
 * Electron 메인 프로세스
 * 
 * ppop_promt 데스크탑 애플리케이션의 메인 프로세스입니다.
 */
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// 백엔드 서버 시작
function startBackend() {
    const isDev = !app.isPackaged;
    
    if (isDev) {
        console.log('개발 모드: 백엔드 서버를 수동으로 시작하세요 (python run.py)');
        return;
    }
    
    // 프로덕션 환경에서 백엔드 실행 (PyInstaller로 빌드된 exe)
    const backendExe = path.join(process.resourcesPath, 'ppop_promt_backend.exe');
    
    console.log(`백엔드 실행: ${backendExe}`);
    
    backendProcess = spawn(backendExe, ['prod'], {
        env: { ...process.env, ENV: 'production' }
    });
    
    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });
    
    backendProcess.on('error', (error) => {
        console.error(`백엔드 시작 실패: ${error}`);
    });
}

// 메인 윈도우 생성
function createWindow() {
    // 현재 모니터의 해상도 가져오기
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // 기준 해상도: 1920x1080에서 950x600
    const baseScreenWidth = 1920;
    const baseScreenHeight = 1080;
    const baseWindowWidth = 950;
    const baseWindowHeight = 600;
    
    // 해상도 비율에 따른 창 크기 계산
    const widthRatio = baseWindowWidth / baseScreenWidth;
    const heightRatio = baseWindowHeight / baseScreenHeight;
    
    let windowWidth = Math.round(screenWidth * widthRatio);
    let windowHeight = Math.round(screenHeight * heightRatio);
    
    // 최대 크기 제한 (화면의 90%)
    const maxWidth = Math.round(screenWidth * 0.9);
    const maxHeight = Math.round(screenHeight * 0.9);
    windowWidth = Math.min(windowWidth, maxWidth);
    windowHeight = Math.min(windowHeight, maxHeight);
    
    console.log(`화면 해상도: ${screenWidth}x${screenHeight}`);
    console.log(`창 크기: ${windowWidth}x${windowHeight}`);
    
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        icon: path.join(__dirname, 'public', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,  // 메뉴바 자동 숨김
        title: 'ppop_promt'
    });
    
    // 개발 환경과 프로덕션 환경 분기
    const isDev = !app.isPackaged;
    
    if (isDev) {
        // 개발 환경: Vite 개발 서버
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();  // 개발자 도구 열기
    } else {
        // 프로덕션 환경: 빌드된 파일
        mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    }
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 앱 준비 완료
app.whenReady().then(() => {
    startBackend();
    
    // 백엔드 서버가 시작될 시간을 주기 위해 약간 대기
    setTimeout(() => {
        createWindow();
    }, 2000);
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 모든 윈도우가 닫히면
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 앱 종료 시 백엔드 프로세스도 종료
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

