/**
 * Electron 메인 프로세스
 * 
 * ppop_promt 데스크탑 애플리케이션의 메인 프로세스입니다.
 */
const { app, BrowserWindow, screen, ipcMain, dialog, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendProcess;
let tray = null;
let isQuitting = false;
let backendPort = 8000; // 기본 포트, 동적으로 업데이트됨
let ipcHandlersRegistered = false; // IPC 핸들러 중복 등록 방지 플래그

// 자동 업데이트 설정
autoUpdater.autoDownload = false; // 자동 다운로드 비활성화 (사용자 확인 후 다운로드)
autoUpdater.autoInstallOnAppQuit = true; // 앱 종료 시 자동 설치

// GitHub API 호출을 위한 헤더 설정 (406 에러 방지)
autoUpdater.requestHeaders = {
    'Accept': 'application/vnd.github.v3+json, application/vnd.github.v3.raw+json, application/json, */*'
};

// 단일 인스턴스 실행 강제 (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 이미 다른 인스턴스가 실행 중이면 종료
    console.log('이미 다른 인스턴스가 실행 중입니다. 종료합니다...');
    app.quit();
} else {
    // 두 번째 인스턴스가 실행되려고 할 때 기존 창을 표시
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('두 번째 인스턴스 감지됨. 기존 창을 표시합니다...');
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        } else {
            // 창이 없으면 새로 생성
            console.log('기존 창이 없습니다. 새 창을 생성합니다...');
            createWindow();
        }
    });
}

// 개발 모드에서는 업데이트 체크 비활성화
if (app.isPackaged) {
    // 프로덕션 환경에서만 업데이트 체크
    autoUpdater.checkForUpdatesAndNotify();
}

// 백엔드 프로세스 강제 종료 함수
function killBackendProcess() {
    if (!backendProcess || backendProcess.killed) {
        return;
    }
    
    console.log('백엔드 프로세스 강제 종료 시도...');
    
    try {
        if (process.platform === 'win32') {
            // Windows: taskkill로 프로세스 트리 전체 종료
            const { execSync } = require('child_process');
            try {
                execSync(`taskkill /pid ${backendProcess.pid} /f /t`, { stdio: 'ignore' });
                console.log('백엔드 프로세스 종료 완료 (taskkill)');
            } catch (e) {
                // 이미 종료된 경우 무시
                console.log('백엔드 프로세스가 이미 종료되었습니다.');
            }
        } else {
            // Unix: SIGTERM 후 SIGKILL
            backendProcess.kill('SIGTERM');
            setTimeout(() => {
                if (backendProcess && !backendProcess.killed) {
                    backendProcess.kill('SIGKILL');
                }
            }, 1000);
            console.log('백엔드 프로세스 종료 완료 (SIGTERM)');
        }
    } catch (error) {
        console.error('백엔드 프로세스 종료 중 오류:', error);
    }
    
    backendProcess = null;
}

// 백엔드 서버 시작
function startBackend() {
    const isDev = !app.isPackaged;
    
    // 이미 백엔드 프로세스가 실행 중이면 재시작하지 않음
    if (backendProcess && !backendProcess.killed) {
        console.log('백엔드 프로세스가 이미 실행 중입니다.');
        return;
    }
    
    // 기존 백엔드 프로세스가 있으면 먼저 종료
    if (backendProcess) {
        console.log('기존 백엔드 프로세스 정리 중...');
        killBackendProcess();
    }
    
    if (isDev) {
        // 개발 모드: Python 백엔드 실행
        // 가상환경이 있으면 우선 사용, 없으면 시스템 Python 사용
        let pythonPath;
        const venvPython = process.platform === 'win32' 
            ? path.join(__dirname, 'venv', 'Scripts', 'python.exe')
            : path.join(__dirname, 'venv', 'bin', 'python');
        
        if (fs.existsSync(venvPython)) {
            pythonPath = venvPython;
            console.log('가상환경 Python 사용:', pythonPath);
        } else {
            pythonPath = process.platform === 'win32' ? 'python' : 'python3';
            console.log('시스템 Python 사용:', pythonPath);
        }
        
        const runPyPath = path.join(__dirname, 'run.py');
        
        console.log(`개발 모드: 백엔드 서버 시작 (${pythonPath} ${runPyPath} prod)`);
        
        backendProcess = spawn(pythonPath, [runPyPath, 'prod'], {
            cwd: __dirname,
            env: { ...process.env, ENV: 'production' },
            shell: true  // Windows에서 경로 문제 해결
        });
    } else {
        // 프로덕션 환경에서 백엔드 실행 (PyInstaller로 빌드된 exe)
        const backendExe = path.join(process.resourcesPath, 'ppop_promt_backend.exe');
        
        console.log(`백엔드 실행: ${backendExe}`);
        
        backendProcess = spawn(backendExe, ['prod'], {
            env: { ...process.env, ENV: 'production' }
        });
    }
    
    backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`Backend: ${output}`);
        
        // 포트 정보 파싱
        // 예: "Address: http://127.0.0.1:8001"
        const portMatch = output.match(/Address:\s*http:\/\/[^:]+:(\d+)/);
        if (portMatch) {
            backendPort = parseInt(portMatch[1], 10);
            console.log(`백엔드 포트 감지: ${backendPort}`);
        }
        
        // 포트 충돌 에러 감지
        if (output.includes('error while attempting to bind') || 
            output.includes('각 소켓 주소') ||
            output.includes('Address already in use')) {
            console.warn('포트 충돌 감지됨. 백엔드가 다른 포트를 시도할 수 있습니다.');
        }
    });
    
    backendProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`Backend Error: ${errorOutput}`);
        
        // 포트 충돌 에러 감지
        if (errorOutput.includes('error while attempting to bind') || 
            errorOutput.includes('각 소켓 주소') ||
            errorOutput.includes('Address already in use')) {
            console.warn('⚠️  포트 충돌이 감지되었습니다. 백엔드가 자동으로 다른 포트를 찾습니다.');
        }
    });
    
    backendProcess.on('error', (error) => {
        console.error(`백엔드 시작 실패: ${error}`);
    });
    
    backendProcess.on('exit', (code, signal) => {
        console.log(`백엔드 프로세스 종료됨: code ${code}, signal ${signal}`);
        backendProcess = null;
        
        // 앱이 종료 중이 아닌데 백엔드가 예기치 않게 종료된 경우
        if (!isQuitting && code !== 0 && code !== null) {
            console.error('백엔드 프로세스가 예기치 않게 종료되었습니다. 앱을 재시작해주세요.');
            
            // 사용자에게 알림
            if (mainWindow) {
                dialog.showErrorBox(
                    '백엔드 오류',
                    '백엔드 서버가 예기치 않게 종료되었습니다.\n앱을 재시작해주세요.'
                );
            }
        }
    });
}

// 메인 윈도우 생성
function createWindow() {
    // 현재 모니터의 해상도 가져오기
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // 6:4 비율 계산 (1.5 비율)
    const aspectRatio = 1.5; // 6:4 = 1.5:1
    
    // 화면의 50%를 기본 너비로 사용
    let windowWidth = Math.round(screenWidth * 0.5);
    let windowHeight = Math.round(windowWidth / aspectRatio);
    
    // 화면 높이를 초과하면 높이 기준으로 재계산
    if (windowHeight > screenHeight * 0.9) {
        windowHeight = Math.round(screenHeight * 0.9);
        windowWidth = Math.round(windowHeight * aspectRatio);
    }
    
    // 최소 크기 설정 (UI가 깨지지 않는 선)
    const minWidth = 800;
    const minHeight = Math.round(minWidth / aspectRatio); // 533px
    
    // 계산된 크기가 최소 크기보다 작으면 최소 크기 사용
    if (windowWidth < minWidth) {
        windowWidth = minWidth;
        windowHeight = minHeight;
    }
    
    console.log(`Screen resolution: ${screenWidth}x${screenHeight}`);
    console.log(`Window size: ${windowWidth}x${windowHeight} (6:4 ratio)`);
    console.log(`Minimum size: ${minWidth}x${minHeight}`);
    
    // 개발 환경 확인
    const isDev = !app.isPackaged;
    
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        minWidth: isDev ? undefined : minWidth,  // Production: enforce minimum size
        minHeight: isDev ? undefined : minHeight,  // Production: enforce minimum size
        resizable: true,  // Allow resizing in both dev and production
        icon: path.join(__dirname, 'public', 'logo.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        autoHideMenuBar: true,  // Hide menu bar
        title: 'ppop_promt',
        show: true,  // Show window immediately
        backgroundColor: '#ffffff'  // Loading background color
    });
    
    // 창이 준비되면 표시
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    
    // 개발 환경과 프로덕션 환경 분기
    if (isDev) {
        // 개발 환경: Vite 개발 서버
        console.log('개발 모드: Vite 개발 서버에 연결 시도 (http://localhost:5173)');
        mainWindow.loadURL('http://localhost:5173').catch((error) => {
            console.error('프론트엔드 로드 실패:', error);
            const errorMsg = `프론트엔드 개발 서버에 연결할 수 없습니다.\n\n프론트엔드 개발 서버를 먼저 실행해주세요:\ncd frontend && npm run dev\n\n오류: ${error.message}`;
            dialog.showErrorBox('프론트엔드 서버 연결 실패', errorMsg);
        });
        mainWindow.webContents.openDevTools();  // 개발자 도구 열기
    } else {
        // 프로덕션 환경: 빌드된 파일
        const indexPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
        
        // 파일 존재 여부 확인
        if (!fs.existsSync(indexPath)) {
            const errorMsg = `프론트엔드 파일을 찾을 수 없습니다.\n경로: ${indexPath}\n\n앱을 다시 빌드해주세요.`;
            console.error(errorMsg);
            dialog.showErrorBox('파일 로드 오류', errorMsg);
            return;
        }
        
        console.log(`프론트엔드 파일 로드 시도: ${indexPath}`);
        
        // 파일 로드 및 에러 핸들링
        mainWindow.loadFile(indexPath).catch((error) => {
            const errorMsg = `프론트엔드를 로드하는 중 오류가 발생했습니다:\n${error.message}\n\n경로: ${indexPath}`;
            console.error(errorMsg, error);
            dialog.showErrorBox('로드 오류', errorMsg);
        });
        
        // 프로덕션 환경에서도 개발자 도구 열기 지원
        // 1. 환경 변수로 활성화 (DEBUG=true)
        if (process.env.DEBUG === 'true') {
            mainWindow.webContents.openDevTools();
            console.log('디버그 모드: 개발자 도구가 자동으로 열렸습니다.');
        }
        
        // 2. 키보드 단축키로 열기 (Ctrl+Shift+I)
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.shift && input.key.toLowerCase() === 'i') {
                mainWindow.webContents.openDevTools();
            }
        });
        
        // 페이지 로드 완료 시 에러 확인
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            const errorMsg = `페이지 로드 실패:\n코드: ${errorCode}\n설명: ${errorDescription}\nURL: ${validatedURL}`;
            console.error(errorMsg);
            dialog.showErrorBox('페이지 로드 오류', errorMsg);
        });
        
        // 콘솔 에러 표시
        mainWindow.webContents.on('console-message', (event, level, message) => {
            if (level >= 2) { // warning 이상
                console.log(`[Renderer ${level}] ${message}`);
            }
        });
    }
    
    // 창 닫기 이벤트 처리
    mainWindow.on('close', (event) => {
        if (process.platform === 'darwin') {
            // macOS: 창을 닫아도 앱은 계속 실행 (기본 동작)
            if (!isQuitting) {
                event.preventDefault();
                mainWindow.hide();
            }
        } else {
            // Windows/Linux: X 버튼 클릭 시 완전 종료
            console.log('창 닫기 버튼 클릭 - 앱 완전 종료');
            isQuitting = true;
            
            // 백엔드 프로세스 종료
            killBackendProcess();
            
            // 앱 종료
            app.quit();
        }
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC 핸들러 설정
function setupIpcHandlers() {
    // 이미 등록되었으면 중복 등록 방지
    if (ipcHandlersRegistered) {
        console.log('IPC 핸들러가 이미 등록되어 있습니다.');
        return;
    }
    
    console.log('IPC 핸들러 등록 중...');
    ipcHandlersRegistered = true;
    
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

    // 외부 링크 열기 (mailto 등)
    ipcMain.handle('open-external', async (event, url) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (error) {
            return { error: error.message };
        }
    });

    // 앱 버전 정보 가져오기
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });
    
    // 백엔드 포트 가져오기
    ipcMain.handle('get-backend-port', () => {
        return backendPort;
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
    console.error('에러 상세 정보:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode
    });
    if (mainWindow) {
        mainWindow.webContents.send('update-error', { 
            message: err.message,
            code: err.code,
            statusCode: err.statusCode
        });
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

// 시스템 트레이 생성
function createTray() {
    try {
        const iconPath = path.join(__dirname, 'public', 'logo.ico');
        const pngPath = path.join(__dirname, 'public', 'logo.png');
        
        // 아이콘 파일 찾기
        let trayIcon;
        if (fs.existsSync(iconPath)) {
            trayIcon = iconPath;
        } else if (fs.existsSync(pngPath)) {
            trayIcon = pngPath;
        } else {
            console.warn('트레이 아이콘을 찾을 수 없습니다. 기본 아이콘을 사용합니다.');
            // 기본 아이콘 사용 (없으면 Electron 기본 아이콘)
            trayIcon = undefined;
        }
        
        if (trayIcon) {
            tray = new Tray(trayIcon);
        } else {
            // 아이콘이 없어도 트레이 생성 시도 (기본 아이콘 사용)
            console.warn('트레이 아이콘이 없습니다. 기본 아이콘을 사용합니다.');
            return; // 아이콘이 없으면 트레이 생성을 건너뜀
        }
        
        tray.setToolTip('ppop_promt');
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '창 표시',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: '창 숨김',
            click: () => {
                if (mainWindow) {
                    mainWindow.hide();
                }
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                console.log('트레이 메뉴에서 종료 선택 - 앱 완전 종료');
                isQuitting = true;
                
                // 백엔드 프로세스 종료
                killBackendProcess();
                
                app.quit();
            }
        }
    ]);
    
        tray.setContextMenu(contextMenu);
        
        // 트레이 아이콘 클릭 시 창 토글
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            } else {
                createWindow();
            }
        });
        
        // 더블 클릭 시 창 표시
        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            } else {
                createWindow();
            }
        });
    } catch (error) {
        console.error('트레이 생성 실패:', error);
        // 트레이 생성 실패해도 앱은 계속 실행
    }
}

// 앱 아이콘 설정 (Windows에서 라운딩 자동 적용)
if (process.platform === 'win32') {
    // Windows에서 앱 아이콘 설정
    app.setAppUserModelId('com.ppop_promt.app');
}

// 앱 준비 완료
app.whenReady().then(() => {
    console.log('Electron 앱 시작 중...');
    
    // IPC 핸들러 등록 (앱 시작 시 한 번만)
    setupIpcHandlers();
    
    try {
        // 시스템 트레이 생성
        createTray();
        console.log('시스템 트레이 생성 완료');
    } catch (error) {
        console.error('시스템 트레이 생성 실패:', error);
        // 트레이 생성 실패해도 계속 진행
    }
    
    // 백엔드 서버 시작
    try {
        startBackend();
        console.log('백엔드 서버 시작 요청 완료');
    } catch (error) {
        console.error('백엔드 서버 시작 실패:', error);
        // 백엔드 시작 실패해도 창은 열기
    }
    
    // 프론트엔드 개발 서버가 시작될 때까지 대기 후 창 생성
    // 개발 서버가 준비될 때까지 최대 10초 대기
    let retryCount = 0;
    const maxRetries = 20; // 20번 시도 (총 10초)
    
    const tryCreateWindow = () => {
        // 프론트엔드 개발 서버 연결 확인
        const http = require('http');
        const checkServer = () => {
            return new Promise((resolve) => {
                const req = http.get('http://localhost:5173', (res) => {
                    resolve(true);
                });
                req.on('error', () => {
                    resolve(false);
                });
                req.setTimeout(500, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        };
        
        checkServer().then((isReady) => {
            if (isReady || retryCount >= maxRetries) {
                try {
                    createWindow();
                    console.log('메인 윈도우 생성 완료');
                } catch (error) {
                    console.error('메인 윈도우 생성 실패:', error);
                    dialog.showErrorBox('앱 시작 오류', `앱을 시작하는 중 오류가 발생했습니다:\n${error.message}`);
                }
            } else {
                retryCount++;
                console.log(`프론트엔드 서버 대기 중... (${retryCount}/${maxRetries})`);
                setTimeout(tryCreateWindow, 500);
            }
        });
    };
    
    // 즉시 시도 시작
    tryCreateWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}).catch((error) => {
    console.error('앱 시작 중 치명적 오류:', error);
    dialog.showErrorBox('앱 시작 오류', `앱을 시작할 수 없습니다:\n${error.message}`);
});

// 모든 윈도우가 닫히면
app.on('window-all-closed', () => {
    // Windows/Linux: 창 닫기(X 버튼)를 누르면 이미 app.quit()이 호출되어 여기로 옴
    // macOS: 기본 동작 유지 (앱은 계속 실행)
    if (process.platform !== 'darwin') {
        // Windows/Linux: 창이 모두 닫히면 앱 종료
        // (이미 close 이벤트에서 app.quit()을 호출했으므로 여기서는 아무것도 하지 않음)
        console.log('모든 창이 닫혔습니다.');
    }
});

// 앱 종료 시 백엔드 프로세스도 종료
app.on('before-quit', (event) => {
    console.log('앱 종료 전 정리 작업 시작...');
    isQuitting = true;
    
    // 백엔드 프로세스 종료
    killBackendProcess();
});

