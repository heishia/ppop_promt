/**
 * Electron API Type Definitions
 */

interface ElectronAPI {
  checkForUpdates: () => Promise<{ updateAvailable?: boolean; version?: string; error?: string }>;
  downloadUpdate: () => Promise<{ success?: boolean; error?: string }>;
  quitAndInstall: () => Promise<void>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (data: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateError: (callback: (data: { message: string; code?: string; statusCode?: number }) => void) => () => void;
  onUpdateDownloadProgress: (callback: (data: { percent: number; transferred: number; total: number }) => void) => () => void;
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => () => void;
  shell?: {
    openExternal: (url: string) => Promise<{ success?: boolean; error?: string }>;
  };
  getVersion?: () => Promise<string>;
  getBackendPort?: () => Promise<number>;
}

interface Window {
  electronAPI?: ElectronAPI;
}

