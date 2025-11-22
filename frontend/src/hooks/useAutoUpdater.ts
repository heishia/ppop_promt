import { useEffect, useState, useCallback } from 'react';

// Electron API 타입 정의
interface ElectronAPI {
  checkForUpdates: () => Promise<{ updateAvailable?: boolean; version?: string; error?: string }>;
  downloadUpdate: () => Promise<{ success?: boolean; error?: string }>;
  quitAndInstall: () => Promise<void>;
  onUpdateChecking: (callback: () => void) => () => void;
  onUpdateAvailable: (callback: (data: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onUpdateError: (callback: (data: { message: string }) => void) => () => void;
  onUpdateDownloadProgress: (callback: (data: { percent: number; transferred: number; total: number }) => void) => () => void;
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  version: string | null;
  progress: number;
}

export function useAutoUpdater() {
  const [status, setStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    version: null,
    progress: 0,
  });

  const checkForUpdates = useCallback(async () => {
    if (!window.electronAPI) {
      setStatus(prev => ({ ...prev, error: 'Electron 환경이 아닙니다.' }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, checking: true, error: null }));
      const result = await window.electronAPI.checkForUpdates();
      
      if (result.error) {
        setStatus(prev => ({ ...prev, checking: false, error: result.error || null }));
      } else {
        setStatus(prev => ({
          ...prev,
          checking: false,
          available: result.updateAvailable || false,
          version: result.version || null,
        }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        checking: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      }));
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!window.electronAPI) {
      setStatus(prev => ({ ...prev, error: 'Electron 환경이 아닙니다.' }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, downloading: true, error: null }));
      const result = await window.electronAPI.downloadUpdate();
      
      if (result.error) {
        setStatus(prev => ({ ...prev, downloading: false, error: result.error || null }));
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.',
      }));
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!window.electronAPI) {
      setStatus(prev => ({ ...prev, error: 'Electron 환경이 아닙니다.' }));
      return;
    }

    try {
      await window.electronAPI.quitAndInstall();
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '설치 중 오류가 발생했습니다.',
      }));
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    // 이벤트 리스너 등록
    const cleanupChecking = window.electronAPI.onUpdateChecking(() => {
      setStatus(prev => ({ ...prev, checking: true }));
    });

    const cleanupAvailable = window.electronAPI.onUpdateAvailable((data) => {
      setStatus(prev => ({
        ...prev,
        checking: false,
        available: true,
        version: data.version,
      }));
    });

    const cleanupNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setStatus(prev => ({
        ...prev,
        checking: false,
        available: false,
      }));
    });

    const cleanupError = window.electronAPI.onUpdateError((data) => {
      setStatus(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error: data.message,
      }));
    });

    const cleanupProgress = window.electronAPI.onUpdateDownloadProgress((data) => {
      setStatus(prev => ({
        ...prev,
        downloading: true,
        progress: data.percent,
      }));
    });

    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded((data) => {
      setStatus(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        version: data.version,
      }));
    });

    // 정리 함수
    return () => {
      cleanupChecking();
      cleanupAvailable();
      cleanupNotAvailable();
      cleanupError();
      cleanupProgress();
      cleanupDownloaded();
    };
  }, []);

  return {
    status,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}

