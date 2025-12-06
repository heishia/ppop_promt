/**
 * Electron API 타입 정의
 */

interface ElectronAPI {
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  quitAndInstall: () => Promise<any>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (data: any) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateError: (callback: (data: any) => void) => () => void;
  onUpdateDownloadProgress: (callback: (data: any) => void) => () => void;
  onUpdateDownloaded: (callback: (data: any) => void) => () => void;
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  getVersion: () => Promise<string>;
  getBackendPort: () => Promise<number>;
}

interface Window {
  electronAPI?: ElectronAPI;
}

