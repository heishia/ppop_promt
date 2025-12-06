import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface AutoText {
  trigger_text: string;
}

interface PromptData {
  id: string;
  title: string;
  text: string;
  autotexts: AutoText[];
  folder_id?: number | null;
}

interface FolderType {
  id: number;
  name: string;
}

interface PromptEditorProps {
  promptId?: string;
  promptData?: PromptData;
  folders: FolderType[];
  onSave: (data: {
    title: string;
    text: string;
    autotexts: AutoText[];
    folder_id?: number | null;
  }) => void;
  onExit?: () => void;
}

export function PromptEditor({ promptData, folders, onSave, onExit }: PromptEditorProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [folderId, setFolderId] = useState<number | "none">("none");
  const [autoTextInput, setAutoTextInput] = useState("");

  // 선택된 프롬프트 데이터를 로드
  useEffect(() => {
    if (promptData) {
      setTitle(promptData.title);
      setText(promptData.text);
      setFolderId(promptData.folder_id || "none");
      // 자동변환 텍스트는 첫 번째 것만 사용 (하나만 허용)
      setAutoTextInput(promptData.autotexts && promptData.autotexts.length > 0 ? promptData.autotexts[0].trigger_text : "");
    } else {
      // 새 프롬프트
      setTitle("");
      setText("");
      setFolderId("none");
      setAutoTextInput("");
    }
  }, [promptData]);

  const handleSave = () => {
    if (!title.trim() || !text.trim()) {
      alert("프롬프트 이름과 내용을 입력해주세요.");
      return;
    }

    // 자동변환 텍스트 검증
    const trigger = autoTextInput.trim();
    if (trigger && trigger.length < 2) {
      alert('자동변환 텍스트는 최소 2자 이상이어야 합니다.');
      return;
    }

    // 자동변환 텍스트가 있으면 배열에 추가
    const autotexts = trigger ? [{ trigger_text: trigger }] : [];
    onSave({ title, text, autotexts, folder_id: folderId === "none" ? undefined : folderId as number });
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
          <Button onClick={onExit} size="sm" variant="outline">
            <X className="w-4 h-4 mr-2" />
            나가기
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="프롬프트 이름을 입력하세요"
              className="bg-input-background border-border flex-1"
            />
            <Select
              value={folderId.toString()}
              onValueChange={(value: string) => setFolderId(value === "none" ? "none" : parseInt(value))}
            >
              <SelectTrigger className="w-[200px] bg-input-background border-border">
                <SelectValue placeholder="폴더 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">폴더 없음</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="프롬프트 내용을 입력하세요"
            className="min-h-[200px] bg-input-background border-border resize-none"
          />
        </div>

        {/* Auto Text */}
        <div className="space-y-2">
          <Label htmlFor="auto-text">자동변환 텍스트 (선택사항)</Label>
          <Input
            id="auto-text"
            value={autoTextInput}
            onChange={(e) => setAutoTextInput(e.target.value)}
            placeholder='트리거 입력 (예: @1, front, @@) - 최소 2자 이상'
            className="bg-input-background border-border"
          />
          <p className="text-xs text-muted-foreground">
            트리거를 입력하면 다른 앱에서 해당 텍스트 입력 시 프롬프트 전체가 자동 완성됩니다
          </p>
        </div>
      </div>
    </div>
  );
}