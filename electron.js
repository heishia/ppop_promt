/**
 * Electron 메인 프로세스
 * 
 * ppop_promt 데스크탑 애플리케이션의 메인 프로세스입니다.
 */
const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendProcess;

// 자동 업데이트 설정
autoUpdater.autoDownload = false; // 자동 다운로드 비활성화 (사용자 확인 후 다운로드)
autoUpdater.autoInstallOnAppQuit = true; // 앱 종료 시 자동 설치

// 개발 모드에서는 업데이트 체크 비활성화
if (app.isPackaged) {
    // 프로덕션 환경에서만 업데이트 체크
    autoUpdater.checkForUpdatesAndNotify();
}

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
            preload: path.join(__dirname, 'preload.js'),
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

    // IPC 핸들러 설정 (렌더러 프로세스와 통신)
    setupIpcHandlers();
}

// IPC 핸들러 설정
function setupIpcHandlers() {
    // 업데이트 체크 요청
    ipcMain.handle('check-for-updates', async () => {
        if (!app.isPackaged) {
            return { error: '개발 모드에서는 업데이트를 체크할 수 없습니다.' };
        }
        try {
            const result = await autoUpdater.checkForUpdates();
            return { 
                updateAvailable: result !== null,
                version: result?.updateInfo?.version || null
            };
        } catch (error) {
            return { error: error.message };
        }
    });

    // 업데이트 다운로드 요청
    ipcMain.handle('download-update', async () => {
        if (!app.isPackaged) {
            return { error: '개발 모드에서는 업데이트를 다운로드할 수 없습니다.' };
        }
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });

    // 앱 재시작 및 업데이트 설치
    ipcMain.handle('quit-and-install', () => {
        autoUpdater.quitAndInstall(false, true);
    });
}

// 자동 업데이트 이벤트 핸들러
autoUpdater.on('checking-for-update', () => {
    console.log('업데이트 확인 중...');
    if (mainWindow) {
        mainWindow.webContents.send('update-checking');
    }
});

autoUpdater.on('update-available', (info) => {
    console.log('새 업데이트가 있습니다:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes
        });
    }
    
    // 사용자에게 업데이트 알림
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 사용 가능',
        message: `새 버전 ${info.version}이(가) 사용 가능합니다.`,
        detail: '다운로드하시겠습니까?',
        buttons: ['다운로드', '나중에'],
        defaultId: 0,
        cancelId: 1
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-not-available', (info) => {
    console.log('업데이트가 없습니다. 최신 버전입니다.');
    if (mainWindow) {
        mainWindow.webContents.send('update-not-available');
    }
});

autoUpdater.on('error', (err) => {
    console.error('업데이트 오류:', err);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', { message: err.message });
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    const message = `다운로드 진행률: ${Math.round(progressObj.percent)}%`;
    console.log(message);
    if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', {
            percent: Math.round(progressObj.percent),
            transferred: progressObj.transferred,
            total: progressObj.total
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('업데이트 다운로드 완료:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
    }
    
    // 사용자에게 설치 알림
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '업데이트 다운로드 완료',
        message: `버전 ${info.version} 다운로드가 완료되었습니다.`,
        detail: '앱을 재시작하여 업데이트를 설치하시겠습니까?',
        buttons: ['지금 재시작', '나중에'],
        defaultId: 0,
        cancelId: 1
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall(false, true);
        }
    });
});

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

