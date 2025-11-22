import { useState, useEffect } from "react";
import { PromptSidebar } from "./components/PromptSidebar";
import { PromptEditor } from "./components/PromptEditor";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { InfoPage } from "./components/InfoPage";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { GripVertical } from "lucide-react";

interface Prompt {
  id: string;
  name: string;
  prompt: string;
  autoTexts: Array<{ shortcut: string; text: string }>;
  folderId?: string;
}

interface FolderType {
  id: string;
  name: string;
}

export default function App() {
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<'welcome' | 'editor' | 'info'>('welcome');
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([
    { id: "1", name: "작업용 프롬프트" },
    { id: "2", name: "자주 사용" },
  ]);
  const [prompts, setPrompts] = useState<Prompt[]>([
    { id: "p1", name: "이메일 작성", prompt: "이메일을 작성해주세요.", autoTexts: [], folderId: "1" },
    { id: "p2", name: "회의 노트 정리", prompt: "회의 내용을 정리해주세요.", autoTexts: [], folderId: "1" },
    { id: "p3", name: "코드 리뷰", prompt: "코드를 리뷰해주세요.", autoTexts: [], folderId: "2" },
    { id: "p4", name: "번역 요청", prompt: "다음 내용을 번역해주세요.", autoTexts: [], folderId: undefined },
  ]);

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setCurrentView('editor');
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    toast.success("삭제 완료");
    if (selectedPromptId === id) {
      setSelectedPromptId(undefined);
      setCurrentView('welcome');
    }
  };

  const handleNewPrompt = () => {
    setSelectedPromptId(undefined);
    setCurrentView('editor');
    toast.success("새 프롬프트 작성 가능");
  };

  const handleSavePrompt = (data: {
    name: string;
    prompt: string;
    autoTexts: Array<{ shortcut: string; text: string }>;
    folderId?: string;
  }) => {
    if (selectedPromptId) {
      // 기존 프롬프트 수정
      setPrompts(prompts.map(p => 
        p.id === selectedPromptId 
          ? { ...p, ...data }
          : p
      ));
      toast.success("수정 완료");
    } else {
      // 새 프롬프트 생성
      const newPrompt: Prompt = {
        id: `p-${Date.now()}`,
        ...data,
      };
      setPrompts([...prompts, newPrompt]);
      setSelectedPromptId(newPrompt.id);
      setCurrentView('editor');
      toast.success("저장 완료");
    }
  };

  const handleAddFolder = (folderName: string) => {
    const newFolder: FolderType = {
      id: `f-${Date.now()}`,
      name: folderName,
    };
    setFolders([...folders, newFolder]);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    setFolders(folders.map(f => 
      f.id === folderId ? { ...f, name } : f
    ));
  };

  const handleDeleteFolder = (folderId: string) => {
    // 폴더와 함께 폴더 안의 프롬프트들도 모두 삭제
    setPrompts(prompts.filter(p => p.folderId !== folderId));
    setFolders(folders.filter(f => f.id !== folderId));
    toast.success("삭제 완료");
  };

  const handleMovePrompt = (promptId: string, targetFolderId?: string) => {
    setPrompts(prompts.map(p => 
      p.id === promptId ? { ...p, folderId: targetFolderId } : p
    ));
    toast.success("이동 완료");
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // 리사이징 이벤트 리스너 추가
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  const handleLogoClick = () => {
    setCurrentView('info');
  };

  const handleBackToWelcome = () => {
    setCurrentView('welcome');
  };

  const renderMainContent = () => {
    if (currentView === 'info') {
      return <InfoPage onBack={handleBackToWelcome} />;
    }
    
    if (currentView === 'editor') {
      return (
        <PromptEditor 
          promptId={selectedPromptId} 
          promptData={selectedPrompt}
          folders={folders}
          onSave={handleSavePrompt} 
        />
      );
    }
    
    // currentView === 'welcome'
    return <WelcomeScreen onLogoClick={handleLogoClick} />;
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
        <PromptSidebar
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onDeletePrompt={handleDeletePrompt}
          onNewPrompt={handleNewPrompt}
          folders={folders}
          prompts={prompts}
          onAddFolder={handleAddFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
          onMovePrompt={handleMovePrompt}
        />
      </div>
      <div
        className="relative group flex-shrink-0 cursor-col-resize h-full"
        style={{ width: '8px' }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
        <div
          className="absolute inset-0 group-hover:bg-primary/10 transition-colors"
          style={{ userSelect: 'none' }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2"
          style={{ 
            left: '-7px',
            pointerEvents: 'none'
          }}
        >
          <div className={`bg-background border border-border rounded-sm px-0.5 py-4 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${
            isResizing ? 'opacity-100 bg-primary border-primary' : ''
          }`}>
            <GripVertical className={`w-3 h-12 ${isResizing ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {renderMainContent()}
      </div>
      <Toaster />
    </div>
  );
}