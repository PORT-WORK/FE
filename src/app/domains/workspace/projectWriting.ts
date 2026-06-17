import type { ProjectItem } from '../../api/contentApi';

export type ProjectRole = 'DEVELOPER' | 'PM';

export type ProjectWritingStatus =
  | 'NOT_STARTED'
  | 'WRITING'
  | 'DOCUMENT_CREATED'
  | 'REVIEWED'
  | 'PPT_CREATED';

export type SectionStatus = 'EMPTY' | 'DRAFT' | 'COMPLETED';

export type ProjectSectionKey =
  | 'role'
  | 'problem'
  | 'tech'
  | 'architecture'
  | 'core'
  | 'trouble'
  | 'performance'
  | 'result'
  | 'retrospective'
  | 'market'
  | 'competition'
  | 'user'
  | 'persona'
  | 'hypothesis'
  | 'prd'
  | 'requirements'
  | 'priority'
  | 'ia'
  | 'userFlow'
  | 'wireframe'
  | 'policy'
  | 'roadmap'
  | 'kpi';

export type ProjectSectionTemplate = {
  key: ProjectSectionKey;
  title: string;
  guide: string;
  placeholder: string;
};

export type ProjectWritingDraft = {
  projectId: number;
  portfolioId: number | null;
  projectName: string;
  role: ProjectRole;
  writingStatus: ProjectWritingStatus;
  sections: Record<string, { value: string; status: SectionStatus }>;
  selectedProjectIds: number[];
  selectedArticleIds: string[];
  imageAssets: Array<{ id: string; name: string; url: string }>;
  reviewedDocument: string;
  document: string;
  updatedAt: string | null;
};

type StoredProjectItem = ProjectItem & {
  updatedAt?: string | null;
};

const PROJECT_LIST_STORAGE_KEY = 'port-local-project-list';
const PROJECT_LIST_EVENT = 'port:project-list-updated';

export const WRITING_ROLES: Array<{ key: ProjectRole; label: string; description: string }> = [
  { key: 'DEVELOPER', label: 'DEVELOPER', description: 'GitHub, Notion, Figma 자료를 기반으로 기술 중심 프로젝트를 정리합니다.' },
  { key: 'PM', label: 'PM', description: '기획, 요구사항, IA, KPI 중심으로 문서를 작성합니다.' },
];

export const SECTION_TEMPLATES: Record<ProjectRole, ProjectSectionTemplate[]> = {
  DEVELOPER: [
    { key: 'role', title: '담당 역할', guide: '본인의 책임 범위와 실제 기여를 분리해서 적습니다.', placeholder: '맡은 역할을 적어주세요.' },
    { key: 'problem', title: '문제 정의', guide: '해결하려는 문제를 사용자 관점에서 설명합니다.', placeholder: '문제를 적어주세요.' },
    { key: 'tech', title: '기술 스택', guide: '실제로 사용한 기술만 적습니다.', placeholder: 'React, TypeScript, Node.js...' },
    { key: 'architecture', title: '시스템 아키텍처', guide: '구조와 데이터 흐름을 간단하게 정리합니다.', placeholder: '구조를 적어주세요.' },
    { key: 'core', title: '핵심 구현', guide: '가장 중요한 구현 포인트를 적습니다.', placeholder: '핵심 구현을 적어주세요.' },
    { key: 'trouble', title: '트러블슈팅', guide: '문제-원인-해결-결과 순으로 적습니다.', placeholder: '문제 해결 과정을 적어주세요.' },
    { key: 'performance', title: '성능 개선', guide: '전후 비교가 있으면 좋습니다.', placeholder: '성능 개선 내용을 적어주세요.' },
    { key: 'result', title: '결과', guide: '정량/정성 결과를 적습니다.', placeholder: '결과를 적어주세요.' },
    { key: 'retrospective', title: '회고', guide: '배운 점과 개선점을 적습니다.', placeholder: '회고를 적어주세요.' },
  ],
  PM: [
    { key: 'problem', title: '문제 정의', guide: '해결해야 하는 문제를 명확하게 정의합니다.', placeholder: '문제 정의를 적어주세요.' },
    { key: 'market', title: '시장 분석', guide: '대상 시장과 현재 기회를 요약합니다.', placeholder: '시장 분석 내용을 적어주세요.' },
    { key: 'competition', title: '경쟁사 분석', guide: '비교 대상과 차별 포인트를 정리합니다.', placeholder: '경쟁사 분석을 적어주세요.' },
    { key: 'user', title: '사용자 분석', guide: '주요 사용자 특성과 니즈를 정리합니다.', placeholder: '사용자 분석을 적어주세요.' },
    { key: 'persona', title: '페르소나', guide: '대표 사용자를 한 명 구체적으로 작성합니다.', placeholder: '페르소나를 적어주세요.' },
    { key: 'hypothesis', title: '핵심 가설', guide: '검증 가능한 형태로 가설을 적습니다.', placeholder: '핵심 가설을 적어주세요.' },
    { key: 'prd', title: 'PRD', guide: '목표와 범위를 간단하게 정리합니다.', placeholder: 'PRD 내용을 적어주세요.' },
    { key: 'requirements', title: '요구사항 정의', guide: '기능별 요구사항을 나눠 적습니다.', placeholder: '요구사항을 적어주세요.' },
    { key: 'priority', title: '기능 우선순위', guide: 'MVP 기준의 우선순위를 적습니다.', placeholder: '우선순위를 적어주세요.' },
    { key: 'ia', title: 'IA', guide: '정보 구조를 간단하게 정리합니다.', placeholder: 'IA를 적어주세요.' },
    { key: 'userFlow', title: 'User Flow', guide: '주요 사용자 흐름을 순서대로 적습니다.', placeholder: 'User Flow를 적어주세요.' },
    { key: 'wireframe', title: '와이어프레임', guide: '화면 구조와 의도를 정리합니다.', placeholder: '와이어프레임을 적어주세요.' },
    { key: 'policy', title: '정책 정의', guide: '규칙과 예외를 정리합니다.', placeholder: '정책을 적어주세요.' },
    { key: 'roadmap', title: '로드맵', guide: '진행 순서와 일정 흐름을 적습니다.', placeholder: '로드맵을 적어주세요.' },
    { key: 'kpi', title: 'KPI', guide: '성과를 측정할 수 있는 지표를 적습니다.', placeholder: 'KPI를 적어주세요.' },
    { key: 'result', title: '결과', guide: '기획 결과와 기대 효과를 적습니다.', placeholder: '결과를 적어주세요.' },
    { key: 'retrospective', title: '회고', guide: '배운 점과 다음 개선점을 적습니다.', placeholder: '회고를 적어주세요.' },
  ],
};

export const RECOMMENDED_SOURCES: Record<ProjectRole, string[]> = {
  DEVELOPER: ['README', 'Languages', 'PR', 'Issue', 'Release', '회고'],
  PM: ['기획서', 'PRD', '요구사항', '회의록', 'IA', 'User Flow', 'Wireframe', '정책 문서', 'KPI 문서'],
};

export function createEmptyDraft(projectId: number, portfolioId: number | null, role: ProjectRole, projectName: string): ProjectWritingDraft {
  const sections = SECTION_TEMPLATES[role].reduce<Record<string, { value: string; status: SectionStatus }>>((acc, section) => {
    acc[section.key] = { value: '', status: 'EMPTY' };
    return acc;
  }, {});

  return {
    projectId,
    portfolioId,
    projectName,
    role,
    writingStatus: 'NOT_STARTED',
    sections,
    selectedProjectIds: [],
    selectedArticleIds: [],
    imageAssets: [],
    reviewedDocument: '',
    document: '',
    updatedAt: null,
  };
}

export function getDraftStorageKey(projectId: number) {
  return `port-project-draft:${projectId}`;
}

export function loadDraft(projectId: number): ProjectWritingDraft | null {
  try {
    const raw = localStorage.getItem(getDraftStorageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectWritingDraft>;
    return {
      ...createEmptyDraft(Number(parsed.projectId || projectId), parsed.portfolioId ?? null, (parsed.role === 'PM' ? 'PM' : 'DEVELOPER') as ProjectRole, parsed.projectName || 'New project'),
      ...parsed,
      imageAssets: Array.isArray(parsed.imageAssets) ? parsed.imageAssets.filter(Boolean).map(item => ({
        id: String((item as { id?: unknown }).id || ''),
        name: String((item as { name?: unknown }).name || ''),
        url: String((item as { url?: unknown }).url || ''),
      })).filter(item => item.id && item.name && item.url) : [],
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: ProjectWritingDraft) {
  localStorage.setItem(getDraftStorageKey(draft.projectId), JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
}

function safeWindow() {
  return typeof window === 'undefined' ? null : window;
}

function readStoredProjects(): StoredProjectItem[] {
  const win = safeWindow();
  if (!win) return [];
  try {
    const raw = win.localStorage.getItem(PROJECT_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item === 'object') as StoredProjectItem[];
  } catch {
    return [];
  }
}

function writeStoredProjects(items: StoredProjectItem[]) {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(PROJECT_LIST_STORAGE_KEY, JSON.stringify(items));
  win.dispatchEvent(new Event(PROJECT_LIST_EVENT));
}

function normalizeProjectItem(item: Partial<ProjectItem> & { updatedAt?: string | null }): StoredProjectItem {
  return {
    id: Number(item.id || 0),
    portfolioId: Number(item.portfolioId || 0),
    name: item.name || 'New project',
    role: item.role || 'DEVELOPER',
    summary: item.summary ?? null,
    thumbnailUrl: item.thumbnailUrl ?? null,
    imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean).map(String) : [],
    skills: Array.isArray(item.skills) ? item.skills : [],
    isSynced: Boolean(item.isSynced),
    startDate: item.startDate ?? null,
    endDate: item.endDate ?? null,
    orderIndex: Number(item.orderIndex ?? Date.now()),
    updatedAt: item.updatedAt ?? new Date().toISOString(),
  };
}

export function loadLocalProjectItems(): ProjectItem[] {
  return readStoredProjects()
    .map(item => {
      const { updatedAt: _updatedAt, ...rest } = normalizeProjectItem(item);
      return rest;
    })
    .sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
}

export function upsertLocalProjectItem(item: Partial<ProjectItem> & { updatedAt?: string | null }) {
  const next = normalizeProjectItem(item);
  const current = readStoredProjects();
  const index = current.findIndex(entry => entry.id === next.id);
  if (index >= 0) {
    current[index] = { ...current[index], ...next, updatedAt: next.updatedAt };
  } else {
    current.unshift(next);
  }
  writeStoredProjects(current);
}

export function removeLocalProjectItem(projectId: number) {
  const current = readStoredProjects().filter(item => item.id !== projectId);
  writeStoredProjects(current);
}

export function notifyLocalProjectItemsChanged() {
  const win = safeWindow();
  if (!win) return;
  win.dispatchEvent(new Event(PROJECT_LIST_EVENT));
}

export function getLocalProjectListEventName() {
  return PROJECT_LIST_EVENT;
}
