/**
 * Preload 스크립트
 * 
 * Electron의 contextIsolation을 사용할 때 렌더러 프로세스와 메인 프로세스 간
 * 안전한 통신을 위한 API를 노출합니다.
 */
const { contextBridge, ipcRenderer } = require('electron');

// 업데이트 관련 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 업데이트 체크
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    
    // 업데이트 다운로드
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    
    // 앱 재시작 및 업데이트 설치
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    
    // 업데이트 이벤트 리스너
    onUpdateChecking: (callback) => {
        ipcRenderer.on('update-checking', callback);
        return () => ipcRenderer.removeListener('update-checking', callback);
    },
    
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (event, data) => callback(data));
        return () => ipcRenderer.removeListener('update-available', callback);
    },
    
    onUpdateNotAvailable: (callback) => {
        ipcRenderer.on('update-not-available', callback);
        return () => ipcRenderer.removeListener('update-not-available', callback);
    },
    
    onUpdateError: (callback) => {
        ipcRenderer.on('update-error', (event, data) => callback(data));
        return () => ipcRenderer.removeListener('update-error', callback);
    },
    
    onUpdateDownloadProgress: (callback) => {
        ipcRenderer.on('update-download-progress', (event, data) => callback(data));
        return () => ipcRenderer.removeListener('update-download-progress', callback);
    },
    
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', (event, data) => callback(data));
        return () => ipcRenderer.removeListener('update-downloaded', callback);
    },
    
    // 외부 링크 열기 (mailto 등)
    shell: {
        openExternal: (url) => ipcRenderer.invoke('open-external', url),
    },
    
    // 앱 버전 정보 가져오기
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // 백엔드 포트 가져오기
    getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
});

