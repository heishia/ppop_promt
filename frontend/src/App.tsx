import { useState, useEffect } from "react";
import { PromptSidebar } from "./components/PromptSidebar";
import { PromptEditor } from "./components/PromptEditor";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { InfoPage } from "./components/InfoPage";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { GripVertical } from "lucide-react";
import * as api from "./services/api";

interface Prompt {
  id: string;
  name: string;
  prompt: string;
  autoTexts: Array<{ shortcut: string; text: string }>;
  folderId?: number;
}

interface FolderType {
  id: number;
  name: string;
}

export default function App() {
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<'welcome' | 'editor' | 'info'>('welcome');
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 폴더 목록 로드
      const foldersData = await api.getFolders();
      setFolders(foldersData.map(f => ({
        id: f.id,
        name: f.name
      })));
      
      // 프롬프트 목록 로드
      const promptsData = await api.getPrompts();
      setPrompts(promptsData.map(p => ({
        id: p.id,
        name: p.title,
        prompt: p.text,
        autoTexts: p.autotexts.map(at => ({ shortcut: at.trigger_text, text: p.text })),
        folderId: p.folder_id || undefined
      })));
      
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setCurrentView('editor');
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await api.deletePrompt(id);
      setPrompts(prompts.filter(p => p.id !== id));
      toast.success("삭제 완료");
      if (selectedPromptId === id) {
        setSelectedPromptId(undefined);
        setCurrentView('welcome');
      }
    } catch (error) {
      console.error('프롬프트 삭제 실패:', error);
      toast.error('프롬프트 삭제에 실패했습니다.');
    }
  };

  const handleNewPrompt = () => {
    setSelectedPromptId(undefined);
    setCurrentView('editor');
    toast.success("새 프롬프트 작성 가능");
  };

  const handleSavePrompt = async (data: {
    name: string;
    prompt: string;
    autoTexts: Array<{ shortcut: string; text: string }>;
    folderId?: number;
  }) => {
    try {
      const autotext = data.autoTexts.length > 0 ? data.autoTexts[0].shortcut : undefined;
      
      if (selectedPromptId) {
        // 기존 프롬프트 수정
        const updated = await api.updatePrompt(selectedPromptId, {
          title: data.name,
          text: data.prompt,
          autotext: autotext,
          folder_id: data.folderId || null,
          remove_autotext: !autotext
        });
        
        setPrompts(prompts.map(p => 
          p.id === selectedPromptId 
            ? {
                id: updated.id,
                name: updated.title,
                prompt: updated.text,
                autoTexts: updated.autotexts.map(at => ({ shortcut: at.trigger_text, text: updated.text })),
                folderId: updated.folder_id || undefined
              }
            : p
        ));
        toast.success("수정 완료");
      } else {
        // 새 프롬프트 생성
        const created = await api.createPrompt({
          title: data.name,
          text: data.prompt,
          autotext: autotext,
          folder_id: data.folderId || null
        });
        
        const newPrompt: Prompt = {
          id: created.id,
          name: created.title,
          prompt: created.text,
          autoTexts: created.autotexts.map(at => ({ shortcut: at.trigger_text, text: created.text })),
          folderId: created.folder_id || undefined
        };
        
        setPrompts([...prompts, newPrompt]);
        setSelectedPromptId(newPrompt.id);
        setCurrentView('editor');
        toast.success("저장 완료");
      }
    } catch (error: any) {
      console.error('프롬프트 저장 실패:', error);
      toast.error(error.message || '프롬프트 저장에 실패했습니다.');
    }
  };

  const handleAddFolder = async (folderName: string) => {
    try {
      const created = await api.createFolder({ name: folderName });
      const newFolder: FolderType = {
        id: created.id,
        name: created.name,
      };
      setFolders([...folders, newFolder]);
    } catch (error) {
      console.error('폴더 생성 실패:', error);
      toast.error('폴더 생성에 실패했습니다.');
    }
  };

  const handleUpdateFolder = async (folderId: number, name: string) => {
    try {
      await api.updateFolder(folderId, { name });
      setFolders(folders.map(f => 
        f.id === folderId ? { ...f, name } : f
      ));
    } catch (error) {
      console.error('폴더 수정 실패:', error);
      toast.error('폴더 수정에 실패했습니다.');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await api.deleteFolder(folderId);
      // 폴더 삭제 시 해당 폴더의 프롬프트들은 folder_id가 null로 설정됨
      setFolders(folders.filter(f => f.id !== folderId));
      // 프롬프트 목록 다시 로드
      await loadData();
      toast.success("삭제 완료");
    } catch (error) {
      console.error('폴더 삭제 실패:', error);
      toast.error('폴더 삭제에 실패했습니다.');
    }
  };

  const handleMovePrompt = async (promptId: string, targetFolderId?: number) => {
    try {
      await api.updatePrompt(promptId, {
        folder_id: targetFolderId || null
      });
      
      setPrompts(prompts.map(p => 
        p.id === promptId ? { ...p, folderId: targetFolderId } : p
      ));
      toast.success("이동 완료");
    } catch (error) {
      console.error('프롬프트 이동 실패:', error);
      toast.error('프롬프트 이동에 실패했습니다.');
    }
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
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      );
    }
    
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
