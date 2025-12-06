import { useEffect, useState, useCallback } from 'react';

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
      setStatus(prev => ({ ...prev, error: 'Electron environment not available.' }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, checking: true, error: null }));
      const result = await window.electronAPI.checkForUpdates();
      
      if (result.error) {
        // GitHub 관련 에러는 조용히 처리 (개발 모드 또는 네트워크 문제)
        console.warn('Update check failed:', result.error);
        setStatus(prev => ({ ...prev, checking: false, error: null }));
      } else {
        setStatus(prev => ({
          ...prev,
          checking: false,
          available: result.updateAvailable || false,
          version: result.version || null,
        }));
      }
    } catch (error) {
      // 업데이트 체크 실패는 치명적이지 않으므로 조용히 처리
      console.warn('Update check exception:', error);
      setStatus(prev => ({
        ...prev,
        checking: false,
        error: null, // 사용자에게 에러 표시하지 않음
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
      // GitHub 관련 에러는 조용히 로깅만
      console.warn('Auto-updater error:', data.message);
      setStatus(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error: null, // 사용자에게는 에러 표시하지 않음
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

