import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Save } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AutoText {
  shortcut: string;
  text: string;
}

interface PromptData {
  id: string;
  name: string;
  prompt: string;
  autoTexts: AutoText[];
  folderId?: string;
}

interface FolderType {
  id: string;
  name: string;
}

interface PromptEditorProps {
  promptId?: string;
  promptData?: PromptData;
  folders: FolderType[];
  onSave: (data: {
    name: string;
    prompt: string;
    autoTexts: AutoText[];
    folderId?: string;
  }) => void;
}

export function PromptEditor({ promptData, folders, onSave }: PromptEditorProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [folderId, setFolderId] = useState<string>("none");
  const [autoTextInput, setAutoTextInput] = useState("");
  const [autoTexts, setAutoTexts] = useState<AutoText[]>([]);

  // 선택된 프롬프트 데이터를 로드
  useEffect(() => {
    if (promptData) {
      setName(promptData.name);
      setPrompt(promptData.prompt);
      setFolderId(promptData.folderId || "none");
      setAutoTexts(promptData.autoTexts || []);
    } else {
      // 새 프롬프트
      setName("");
      setPrompt("");
      setFolderId("none");
      setAutoTexts([]);
    }
  }, [promptData]);

  const handleAddAutoText = () => {
    const trigger = autoTextInput.trim();
    if (!trigger) return;

    if (trigger.length < 2) {
      alert('트리거는 최소 2자 이상이어야 합니다.');
      return;
    }

    // 중복 체크
    if (autoTexts.some(at => at.shortcut === trigger)) {
      alert('이미 등록된 트리거입니다.');
      return;
    }

    setAutoTexts([...autoTexts, { shortcut: trigger, text: prompt }]);
    setAutoTextInput("");
  };

  const handleRemoveAutoText = (index: number) => {
    setAutoTexts(autoTexts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) {
      alert("프롬프트 이름과 내용을 입력해주세요.");
      return;
    }

    onSave({ name, prompt, autoTexts, folderId: folderId === "none" ? undefined : folderId });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAutoText();
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="text-primary">프롬프트 편집</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Prompt Name and Folder */}
        <div className="space-y-2">
          <Label htmlFor="prompt-name">프롬프트 이름</Label>
          <div className="flex gap-2">
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="프롬프트 이름을 입력하세요"
              className="bg-input-background border-border flex-1"
            />
            <Select
              value={folderId}
              onValueChange={(value: string) => setFolderId(value === "none" ? "none" : value)}
            >
              <SelectTrigger className="w-[200px] bg-input-background border-border">
                <SelectValue placeholder="폴더 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">폴더 없음</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt Content */}
        <div className="space-y-2">
          <Label htmlFor="prompt-content">프롬프트 내용</Label>
          <Textarea
            id="prompt-content"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="프롬프트 내용을 입력하세요"
            className="min-h-[200px] bg-input-background border-border resize-none"
          />
        </div>

        {/* Auto Text */}
        <div className="space-y-2">
          <Label htmlFor="auto-text">자동변환 텍스트</Label>
          <div className="flex gap-2">
            <Input
              id="auto-text"
              value={autoTextInput}
              onChange={(e) => setAutoTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='트리거 입력 (예: @h1, @@, front)'
              className="bg-input-background border-border"
            />
            <Button onClick={handleAddAutoText} type="button" variant="outline">
              추가
            </Button>
          </div>

          {autoTexts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">등록된 트리거 (입력 시 프롬프트 전체가 자동 완성됩니다)</p>
              <div className="flex flex-wrap gap-2">
                {autoTexts.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
                  >
                    <span>{item.shortcut}</span>
                    <button
                      onClick={() => handleRemoveAutoText(index)}
                      className="hover:bg-primary-foreground/20 rounded-sm p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}