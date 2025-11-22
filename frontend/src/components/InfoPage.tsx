import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ArrowLeft, Mail, Bug, ExternalLink, Send, Download, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useAutoUpdater } from "../hooks/useAutoUpdater";
import { toast } from "sonner";

interface InfoPageProps {
  onBack: () => void;
}

export function InfoPage({ onBack }: InfoPageProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [bugScreenshot, setBugScreenshot] = useState<File | null>(null);
  const [bugSituation, setBugSituation] = useState("");
  const [bugDevice, setBugDevice] = useState("");
  
  const { status, checkForUpdates, downloadUpdate, installUpdate } = useAutoUpdater();

  // 컴포넌트 마운트 시 업데이트 체크 (Electron 환경에서만)
  useEffect(() => {
    if (window.electronAPI) {
      checkForUpdates();
    }
  }, [checkForUpdates]);

  const handleFeedbackSubmit = () => {
    if (!feedbackContent.trim()) {
      alert("건의사항을 입력해주세요.");
      return;
    }

    const subject = encodeURIComponent("PPOP Prompt 피드백");
    const body = encodeURIComponent(`건의사항:\n${feedbackContent}`);
    const mailtoLink = `mailto:bluejin1130@gmail.com?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    setFeedbackOpen(false);
    setFeedbackContent("");
  };

  const handleBugReportSubmit = () => {
    if (!bugSituation.trim()) {
      alert("상황을 입력해주세요.");
      return;
    }

    const subject = encodeURIComponent("PPOP Prompt 버그 제보");
    let body = encodeURIComponent(`상황:\n${bugSituation}\n\n사용 기기: ${bugDevice || "미선택"}\n\n스크린샷: ${bugScreenshot ? bugScreenshot.name : "첨부 안 함"}`);
    const mailtoLink = `mailto:bluejin1130@gmail.com?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
    setBugReportOpen(false);
    setBugScreenshot(null);
    setBugSituation("");
    setBugDevice("");
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBugScreenshot(e.target.files[0]);
    }
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
              onClick={() => setFeedbackOpen(true)}
              variant="outline"
              className="w-auto"
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
              onClick={() => setBugReportOpen(true)}
              variant="outline"
              className="w-auto"
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
            Version 1.0.0
          </p>
        </div>
      </div>

      {/* 피드백 다이얼로그 */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>피드백 보내기</DialogTitle>
            <DialogDescription>
              네이버 또는 구글 이메일로 보내실 수 있습니다.<br />
              이메일 주소(bluejin1130@gmail.com)가 자동으로 입력됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-content">건의사항</Label>
              <Textarea
                id="feedback-content"
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="개선이 필요한 부분이나 새로운 기능에 대한 아이디어를 입력해주세요."
                className="min-h-[200px] bg-input-background border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              취소
            </Button>
            <Button onClick={handleFeedbackSubmit}>
              <Send className="w-4 h-4 mr-2" />
              이메일로 보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 버그 제보 다이얼로그 */}
      <Dialog open={bugReportOpen} onOpenChange={setBugReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>버그 제보</DialogTitle>
            <DialogDescription>
              네이버 또는 구글 이메일로 보내실 수 있습니다.<br />
              이메일 주소(bluejin1130@gmail.com)가 자동으로 입력됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-screenshot">스크린샷 (선택사항)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bug-screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="bg-input-background border-border"
                />
                {bugScreenshot && (
                  <span className="text-sm text-muted-foreground">
                    {bugScreenshot.name}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-situation">상황 *</Label>
              <Textarea
                id="bug-situation"
                value={bugSituation}
                onChange={(e) => setBugSituation(e.target.value)}
                placeholder="발생한 오류나 예상치 못한 동작을 자세히 설명해주세요."
                className="min-h-[150px] bg-input-background border-border resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-device">사용 기기 (선택사항)</Label>
              <Select value={bugDevice} onValueChange={setBugDevice}>
                <SelectTrigger className="bg-input-background border-border">
                  <SelectValue placeholder="사용 기기를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windows">Windows</SelectItem>
                  <SelectItem value="macos">macOS</SelectItem>
                  <SelectItem value="linux">Linux</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBugReportOpen(false)}>
              취소
            </Button>
            <Button onClick={handleBugReportSubmit}>
              <Send className="w-4 h-4 mr-2" />
              이메일로 보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

