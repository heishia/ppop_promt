import { useState } from "react";
import { Folder, Plus, ChevronRight, ChevronDown, Trash2, Search } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";

interface Prompt {
  id: string;
  name: string;
  folderId?: number;
}

interface FolderType {
  id: number;
  name: string;
}

interface PromptSidebarProps {
  selectedPromptId?: string;
  onSelectPrompt: (id: string) => void;
  onDeletePrompt: (id: string) => void;
  onNewPrompt: () => void;
  folders: FolderType[];
  prompts: Prompt[];
  onAddFolder: (name: string) => void;
  onUpdateFolder: (folderId: number, name: string) => void;
  onDeleteFolder: (folderId: number) => void;
  onMovePrompt: (promptId: string, targetFolderId?: number) => void;
}

export function PromptSidebar({
  selectedPromptId,
  onSelectPrompt,
  onDeletePrompt,
  onNewPrompt,
  folders,
  prompts,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMovePrompt,
}: PromptSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [draggedPromptId, setDraggedPromptId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | string | null>(null);

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const addNewFolder = () => {
    onAddFolder("새 폴더");
  };

  const handleFolderDoubleClick = (folder: FolderType) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleFolderNameSubmit = (folderId: number) => {
    if (editingFolderName.trim()) {
      onUpdateFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const handleFolderNameKeyDown = (e: React.KeyboardEvent, folderId: number) => {
    if (e.key === "Enter") {
      handleFolderNameSubmit(folderId);
    } else if (e.key === "Escape") {
      setEditingFolderId(null);
      setEditingFolderName("");
    }
  };

  const getPromptsInFolder = (folderId?: number) => {
    return prompts.filter((p) => p.folderId === folderId);
  };

  const filteredPrompts = prompts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isPromptVisible = (prompt: Prompt) => {
    if (!searchQuery) return true;
    return filteredPrompts.some(fp => fp.id === prompt.id);
  };

  const handleDragStart = (e: React.DragEvent, promptId: string) => {
    setDraggedPromptId(promptId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPromptId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId || 'uncategorized');
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId?: number) => {
    e.preventDefault();
    if (draggedPromptId) {
      onMovePrompt(draggedPromptId, targetFolderId);
    }
    setDraggedPromptId(null);
    setDragOverFolderId(null);
  };

  return (
    <div className="w-full border-r border-border bg-sidebar h-full flex flex-col">
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <Button onClick={onNewPrompt} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          새 프롬프트
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="프롬프트 검색..."
            className="pl-9 bg-white border-border"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="mb-1">
              <div
                className={`group w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors ${
                  dragOverFolderId === folder.id ? 'bg-primary/20 ring-2 ring-primary' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
              >
                <button
                  onClick={() => toggleFolder(folder.id)}
                  onDoubleClick={() => handleFolderDoubleClick(folder)}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                  {editingFolderId === folder.id ? (
                    <Input
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleFolderNameSubmit(folder.id)}
                      onKeyDown={(e) => handleFolderNameKeyDown(e, folder.id)}
                      className="flex-1 h-6 px-2 py-0"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>

              {expandedFolders.has(folder.id) && (
                <div className="ml-6 mt-1">
                  {getPromptsInFolder(folder.id).map((prompt) => (
                    isPromptVisible(prompt) && (
                      <div
                        key={prompt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, prompt.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md group cursor-pointer transition-colors ${
                          selectedPromptId === prompt.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-sidebar-accent"
                        } ${draggedPromptId === prompt.id ? 'opacity-50' : ''}`}
                        onClick={() => onSelectPrompt(prompt.id)}
                      >
                        <span className="flex-1 truncate">{prompt.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePrompt(prompt.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity ${
                            selectedPromptId === prompt.id ? "opacity-100" : ""
                          }`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Prompts without folder */}
          {getPromptsInFolder(undefined).length > 0 && (
            <div className="mt-4">
              <div 
                className={`px-3 py-2 text-xs text-muted-foreground ${
                  dragOverFolderId === 'uncategorized' ? 'bg-primary/20 ring-2 ring-primary rounded-md' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, undefined)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, undefined)}
              >
                미분류
              </div>
              {getPromptsInFolder(undefined).map((prompt) => (
                isPromptVisible(prompt) && (
                  <div
                    key={prompt.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prompt.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md group cursor-pointer transition-colors ${
                      selectedPromptId === prompt.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-sidebar-accent"
                    } ${draggedPromptId === prompt.id ? 'opacity-50' : ''}`}
                    onClick={() => onSelectPrompt(prompt.id)}
                  >
                    <span className="flex-1 truncate">{prompt.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(prompt.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity ${
                        selectedPromptId === prompt.id ? "opacity-100" : ""
                      }`}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <Button onClick={addNewFolder} variant="ghost" size="sm" className="w-full">
          <Folder className="w-4 h-4 mr-2" />
          새 폴더
        </Button>
      </div>
    </div>
  );
}