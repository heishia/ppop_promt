import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ArrowLeft, Mail, Bug, ExternalLink, Download, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useAutoUpdater } from "../hooks/useAutoUpdater";
import { toast } from "sonner";

interface InfoPageProps {
  onBack: () => void;
}

export function InfoPage({ onBack }: InfoPageProps) {
  const [showEmailButtons, setShowEmailButtons] = useState<'feedback' | 'bug' | null>(null);
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  
  const { status, checkForUpdates, downloadUpdate, installUpdate } = useAutoUpdater();

  // 컴포넌트 마운트 시 업데이트 체크 및 버전 정보 가져오기 (Electron 환경에서만)
  useEffect(() => {
    if (window.electronAPI) {
      checkForUpdates();
      // 앱 버전 정보 가져오기
      window.electronAPI.getVersion?.().then((version: string) => {
        setAppVersion(version);
      }).catch(() => {
        // 버전 정보를 가져올 수 없는 경우 기본값 사용
        setAppVersion('1.0.0');
      });
    }
  }, [checkForUpdates]);

  // 디버깅: showEmailButtons 상태 추적
  useEffect(() => {
    console.log('showEmailButtons 상태 변경:', showEmailButtons);
  }, [showEmailButtons]);

  const handleFeedbackClick = () => {
    // 이메일 선택 버튼 표시
    console.log('피드백 클릭, 현재 상태:', showEmailButtons);
    setShowEmailButtons(showEmailButtons === 'feedback' ? null : 'feedback');
    console.log('피드백 클릭 후 상태:', showEmailButtons === 'feedback' ? null : 'feedback');
  };

  const handleBugReportClick = () => {
    // 이메일 선택 버튼 표시
    console.log('버그 제보 클릭, 현재 상태:', showEmailButtons);
    setShowEmailButtons(showEmailButtons === 'bug' ? null : 'bug');
    console.log('버그 제보 클릭 후 상태:', showEmailButtons === 'bug' ? null : 'bug');
  };

  const openEmailService = (service: 'naver' | 'google', type: 'feedback' | 'bug') => {
    const recipient = 'bluejin1130@gmail.com';
    let emailUrl = '';

    if (type === 'feedback') {
      const subject = encodeURIComponent("PPOP Prompt 피드백");
      const body = encodeURIComponent(
        `안녕하세요.\n\n` +
        `PPOP Prompt 앱에 대한 피드백을 보내드립니다.\n\n` +
        `---\n` +
        `건의내용 :\n` +
        `\n` +
        `---\n` +
        `이 메일은 PPOP Prompt 앱에서 전송되었습니다.`
      );

      if (service === 'naver') {
        emailUrl = `https://mail.naver.com/write/popup?to=${recipient}&subject=${subject}&body=${body}`;
      } else {
        emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
      }
    } else {
      // 버그 제보
      const subject = encodeURIComponent("PPOP Prompt 버그 제보");
      const body = encodeURIComponent(
        `안녕하세요.\n\n` +
        `PPOP Prompt 앱에서 발견한 버그를 제보합니다.\n\n` +
        `---\n` +
        `상황 :\n` +
        `\n` +
        `사용 기기 :\n` +
        `\n` +
        `---\n` +
        `스크린샷이 있다면 이메일에 첨부해주세요.\n` +
        `스크린샷을 첨부하시면 문제 해결에 큰 도움이 됩니다.\n\n` +
        `---\n` +
        `이 메일은 PPOP Prompt 앱에서 전송되었습니다.`
      );

      if (service === 'naver') {
        emailUrl = `https://mail.naver.com/write/popup?to=${recipient}&subject=${subject}&body=${body}`;
      } else {
        emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
      }
    }

    // 버튼 숨기기
    setShowEmailButtons(null);

    // Electron 환경에서는 shell.openExternal 사용
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(emailUrl);
    } else {
      // 웹 환경에서는 새 창으로 열기
      window.open(emailUrl, '_blank');
    }

    toast.success(`${service === 'naver' ? '네이버' : '구글'} 메일로 이동합니다.`);
  };



  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <h2 className="text-primary">정보</h2>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {/* 로고 */}
        <div className="flex justify-center" style={{ paddingTop: '4rem', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <img
            src="/logo.png"
            alt="PPOP Prompt Logo"
            className="object-contain rounded-lg"
            style={{ width: '48px', height: '48px' }}
          />
        </div>

        {/* 피드백 보내기 */}
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                handleFeedbackClick();
              }}
              variant="outline"
              className="w-auto cursor-pointer"
              style={{ pointerEvents: 'auto', zIndex: 10 }}
            >
              <Mail className="w-4 h-4 mr-2" />
              피드백 보내기
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center mx-auto" style={{ textAlign: 'center' }}>
            PPOP Prompt를 사용하시면서 개선이 필요한 부분이나<br />
            새로운 기능에 대한 아이디어가 있으시다면 언제든지 알려주세요.
          </p>
        </div>

        {/* 버그 제보 */}
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                handleBugReportClick();
              }}
              variant="outline"
              className="w-auto cursor-pointer"
              style={{ pointerEvents: 'auto', zIndex: 10 }}
            >
              <Bug className="w-4 h-4 mr-2 text-destructive" />
              버그 제보
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center mx-auto" style={{ textAlign: 'center' }}>
            앱 사용 중 발생한 오류나 예상치 못한 동작을 발견하셨다면<br />
            자세한 내용과 함께 제보해 주시면 빠르게 수정하겠습니다.
          </p>
        </div>

        {/* 개발자 정보 */}
        <div className="text-center" style={{ marginBottom: '0rem' }}>
          <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
            <Button
              onClick={() => {
                // 향후 실제 URL로 교체 예정
                // window.open('https://sharevibe.com', '_blank');
              }}
              variant="default"
              className="w-auto"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              쉐어바이브에서 더 알아보기
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center mx-auto" style={{ textAlign: 'center', marginBottom: '0rem' }}>
            <strong className="text-foreground">김뽑희</strong>는 사용자 경험을 최우선으로 생각하며<br />
            다양한 무료 애플리케이션을 개발하고 배포하고 있습니다.
          </p>
        </div>
      </div>

      {/* 업데이트 체크 섹션 */}
      {window.electronAPI && (
        <div className="text-center" style={{ marginBottom: '2rem', padding: '0 2rem' }}>
          <div className="flex flex-col items-center gap-3">
            {status.checking && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                업데이트 확인 중...
              </div>
            )}
            
            {status.available && !status.downloading && !status.downloaded && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  새 버전 {status.version}이(가) 사용 가능합니다.
                </div>
                <Button
                  onClick={async () => {
                    await downloadUpdate();
                    toast.success('업데이트 다운로드를 시작했습니다.');
                  }}
                  variant="default"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  업데이트 다운로드
                </Button>
              </div>
            )}
            
            {status.downloading && (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Download className="w-4 h-4 animate-bounce" />
                  다운로드 중... {status.progress}%
                </div>
                <Progress value={status.progress} className="w-full" />
              </div>
            )}
            
            {status.downloaded && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  업데이트 다운로드 완료
                </div>
                <Button
                  onClick={async () => {
                    await installUpdate();
                    toast.success('앱을 재시작하여 업데이트를 설치합니다.');
                  }}
                  variant="default"
                  size="sm"
                >
                  지금 재시작
                </Button>
              </div>
            )}
            
            {status.error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {status.error}
              </div>
            )}
            
            {!status.checking && !status.available && !status.downloading && !status.downloaded && !status.error && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">최신 버전을 사용 중입니다.</p>
                <Button
                  onClick={checkForUpdates}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  업데이트 확인
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 푸터 - 라이센스 정보 */}
      <div className="border-t border-border px-6 py-4 mt-auto">
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">PPOP Prompt</strong> © 2025 김뽑희. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            개인 용도로만 무료로 사용할 수 있습니다. 상업적 활용은 불가합니다.
          </p>
          <p className="text-xs text-muted-foreground">
            Version {appVersion}
          </p>
        </div>
      </div>

      {/* 이메일 선택 플로팅 박스 - Portal로 body에 직접 렌더링 */}
      {showEmailButtons && typeof window !== 'undefined' && document.body ? createPortal(
        <>
          {/* 배경 오버레이 */}
          <div
            onClick={() => {
              console.log('배경 클릭 - 플로팅 박스 닫기');
              setShowEmailButtons(null);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              zIndex: 99998,
            }}
          />
          {/* 플로팅 박스 - 뷰포트 정확한 중앙 */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              console.log('플로팅 박스 클릭, showEmailButtons:', showEmailButtons);
            }}
            style={{
              position: 'fixed',
              top: '50vh',
              left: '50vw',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
              padding: '24px',
              minWidth: '280px',
              zIndex: 99999,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('네이버 버튼 클릭, type:', showEmailButtons);
                  openEmailService('naver', showEmailButtons);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '10px 16px',
                  backgroundColor: '#03C75A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#02B350';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#03C75A';
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>N</span>
                네이버로 메일보내기
              </button>
              <button
                type="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('구글 버튼 클릭, type:', showEmailButtons);
                  openEmailService('google', showEmailButtons);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '10px 16px',
                  backgroundColor: '#4285F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#357AE8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#4285F4';
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>G</span>
                구글로 메일보내기
              </button>
            </div>
          </div>
        </>,
        document.body
      ) : null}
    </div>
  );
}

