import { useState } from "react";
import { PromptSidebar } from "./components/PromptSidebar";
import { PromptEditor } from "./components/PromptEditor";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";

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
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    toast.success("프롬프트가 삭제되었습니다.");
    if (selectedPromptId === id) {
      setSelectedPromptId(undefined);
    }
  };

  const handleNewPrompt = () => {
    setSelectedPromptId(undefined);
    toast.success("새 프롬프트를 작성할 수 있습니다.");
  };

  const handleSavePrompt = (data: {
    name: string;
    prompt: string;
    autoTexts: Array<{ shortcut: string; text: string }>;
  }) => {
    if (selectedPromptId) {
      // 기존 프롬프트 수정
      setPrompts(prompts.map(p => 
        p.id === selectedPromptId 
          ? { ...p, ...data }
          : p
      ));
      toast.success("프롬프트가 수정되었습니다.");
    } else {
      // 새 프롬프트 생성
      const newPrompt: Prompt = {
        id: `p-${Date.now()}`,
        ...data,
        folderId: undefined,
      };
      setPrompts([...prompts, newPrompt]);
      setSelectedPromptId(newPrompt.id);
      toast.success("프롬프트가 저장되었습니다.");
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

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  return (
    <div className="h-screen flex overflow-hidden">
      <PromptSidebar
        selectedPromptId={selectedPromptId}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
        onNewPrompt={handleNewPrompt}
        folders={folders}
        prompts={prompts}
        onAddFolder={handleAddFolder}
        onUpdateFolder={handleUpdateFolder}
      />
      <PromptEditor 
        promptId={selectedPromptId} 
        promptData={selectedPrompt}
        onSave={handleSavePrompt} 
      />
      <Toaster />
    </div>
  );
}