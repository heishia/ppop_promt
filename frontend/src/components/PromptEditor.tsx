import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Save } from "lucide-react";

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

interface PromptEditorProps {
  promptId?: string;
  promptData?: PromptData;
  onSave: (data: {
    name: string;
    prompt: string;
    autoTexts: AutoText[];
  }) => void;
}

export function PromptEditor({ promptId, promptData, onSave }: PromptEditorProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [autoTextInput, setAutoTextInput] = useState("");
  const [autoTexts, setAutoTexts] = useState<AutoText[]>([]);

  // 선택된 프롬프트 데이터를 로드
  useEffect(() => {
    if (promptData) {
      setName(promptData.name);
      setPrompt(promptData.prompt);
      setAutoTexts(promptData.autoTexts || []);
    } else {
      // 새 프롬프트
      setName("");
      setPrompt("");
      setAutoTexts([]);
    }
  }, [promptData]);

  const handleAddAutoText = () => {
    if (!autoTextInput.trim()) return;

    const parts = autoTextInput.split(":");
    if (parts.length < 2) {
      alert('올바른 형식으로 입력해주세요. 예: "단축키:변환될 텍스트"');
      return;
    }

    const shortcut = parts[0].trim();
    const text = parts.slice(1).join(":").trim();

    if (shortcut && text) {
      setAutoTexts([...autoTexts, { shortcut, text }]);
      setAutoTextInput("");
    }
  };

  const handleRemoveAutoText = (index: number) => {
    setAutoTexts(autoTexts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) {
      alert("프롬프트 이름과 내용을 입력해주세요.");
      return;
    }

    onSave({ name, prompt, autoTexts });
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
        {/* Prompt Name */}
        <div className="space-y-2">
          <Label htmlFor="prompt-name">프롬프트 이름</Label>
          <Input
            id="prompt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프롬프트 이름을 입력하세요"
            className="bg-input-background border-border"
          />
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
              placeholder='예: "이메일:user@example.com"'
              className="bg-input-background border-border"
            />
            <Button onClick={handleAddAutoText} type="button" variant="outline">
              추가
            </Button>
          </div>

          {autoTexts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">등록된 자동변환 텍스트</p>
              <div className="space-y-2">
                {autoTexts.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm">
                        {item.shortcut}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span>{item.text}</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveAutoText(index)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      삭제
                    </Button>
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