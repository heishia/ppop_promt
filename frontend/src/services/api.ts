/**
 * API 서비스 레이어
 * 
 * 백엔드 API와 통신하는 함수들을 제공합니다.
 */

// API 기본 URL (동적 포트 감지)
function getApiBaseUrl(): string {
  // 환경 변수에서 API URL 확인
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 기본 포트 범위 (8000-8010)
  return 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

// 포트 자동 감지 및 재시도 로직
async function fetchWithPortRetry(url: string, options?: RequestInit, retries: number = 0): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // 연결 실패 시 다른 포트 시도 (최대 3번)
    if (retries < 3) {
      const currentPort = new URL(url).port || '8000';
      const nextPort = parseInt(currentPort) + 1;
      
      if (nextPort <= 8010) {
        const newUrl = url.replace(`:${currentPort}`, `:${nextPort}`);
        console.log(`포트 ${currentPort} 연결 실패, 포트 ${nextPort} 시도 중...`);
        return fetchWithPortRetry(newUrl, options, retries + 1);
      }
    }
    throw error;
  }
}

// ============== 타입 정의 ==============

export interface AutoText {
  trigger_text: string;
}

export interface Prompt {
  id: string;
  title: string;
  type: string;
  text: string;
  folder_id?: number | null;
  created_at: string;
  updated_at: string;
  autotexts: AutoText[];
}

export interface PromptCreate {
  title: string;
  type?: string;
  text: string;
  autotext?: string;
  folder_id?: number | null;
}

export interface PromptUpdate {
  title?: string;
  type?: string;
  text?: string;
  autotext?: string;
  folder_id?: number | null;
  remove_autotext?: boolean;
}

export interface Folder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FolderCreate {
  name: string;
}

export interface FolderUpdate {
  name: string;
}

// ============== 프롬프트 API ==============

/**
 * 프롬프트 목록 조회
 */
export async function getPrompts(folderId?: number, type?: string): Promise<Prompt[]> {
  const params = new URLSearchParams();
  if (folderId !== undefined) params.append('folder_id', folderId.toString());
  if (type) params.append('type', type);
  
  const url = `${API_BASE_URL}/api/prompts${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetchWithPortRetry(url);
  
  if (!response.ok) {
    throw new Error(`프롬프트 목록 조회 실패: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 특정 프롬프트 조회
 */
export async function getPrompt(id: string): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/api/prompts/${id}`);
  
  if (!response.ok) {
    throw new Error(`프롬프트 조회 실패: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 프롬프트 생성
 */
export async function createPrompt(data: PromptCreate): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/api/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      type: data.type || 'GPT', // 기본값 GPT
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '프롬프트 생성 실패');
  }
  
  return response.json();
}

/**
 * 프롬프트 수정
 */
export async function updatePrompt(id: string, data: PromptUpdate): Promise<Prompt> {
  const response = await fetch(`${API_BASE_URL}/api/prompts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '프롬프트 수정 실패');
  }
  
  return response.json();
}

/**
 * 프롬프트 삭제
 */
export async function deletePrompt(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/prompts/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '프롬프트 삭제 실패');
  }
}

// ============== 폴더 API ==============

/**
 * 폴더 목록 조회
 */
export async function getFolders(): Promise<Folder[]> {
  const response = await fetch(`${API_BASE_URL}/api/folders`);
  
  if (!response.ok) {
    throw new Error(`폴더 목록 조회 실패: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 특정 폴더 조회
 */
export async function getFolder(id: number): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/api/folders/${id}`);
  
  if (!response.ok) {
    throw new Error(`폴더 조회 실패: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 폴더 생성
 */
export async function createFolder(data: FolderCreate): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/api/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '폴더 생성 실패');
  }
  
  return response.json();
}

/**
 * 폴더 수정
 */
export async function updateFolder(id: number, data: FolderUpdate): Promise<Folder> {
  const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '폴더 수정 실패');
  }
  
  return response.json();
}

/**
 * 폴더 삭제
 */
export async function deleteFolder(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/folders/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '폴더 삭제 실패');
  }
}

