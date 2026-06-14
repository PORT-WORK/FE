import { apiRequest, apiRequestStrict, getCurrentUserId } from './client';
import type { IntegrationProviderKey } from './integrationProviders';

export type Article = {
  id: string;
  title: string;
  category: string;
  projectId: string;
  date?: string;
  readTime?: string;
  preview?: string;
  content?: string;
  blocks?: Array<{ id: string; type: string; content: string; checked?: boolean }>;
  emoji?: string;
  coverImage?: string;
};

export type ConversationCard = {
  id: string;
  latestMessageId: number;
  userId: number;
  user: string;
  role: string;
  lastMsg: string;
  time: string;
  createdAt: string;
  unread: number;
  avatar: string;
};

export type PortfolioSummary = {
  id: number;
  userId?: number;
  title: string;
  jobRole: string;
  thumbnailUrl: string | null;
  summary: string | null;
  skills: string[];
  pptxUrl: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
};

export type PortfolioDetail = {
  id: number;
  userId: number;
  title: string;
  jobRole: string;
  thumbnailUrl: string | null;
  summary: string | null;
  skills: string[];
  templateId: number | null;
  pptxUrl: string | null;
  customDomain: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
};

export type PortfolioDataBlock = {
  id: number;
  documentId: number;
  parentId: number | null;
  blockType: string;
  content: Record<string, unknown>;
  orderIndex: number | null;
};

export type PortfolioDataDocument = {
  document: {
    id: number;
    projectId: number;
    category: string;
    icon: string | null;
    title: string;
    readTimeMinutes: number | null;
    orderIndex: number | null;
  };
  blocks: PortfolioDataBlock[];
};

export type PortfolioDataProject = {
  project: ProjectItem;
  documents: PortfolioDataDocument[];
};

export type PortfolioDataResponse = {
  portfolio: PortfolioDetail;
  projects: PortfolioDataProject[];
};

export type ProjectItem = {
  id: number;
  portfolioId: number;
  name: string;
  role: string;
  summary: string | null;
  thumbnailUrl: string | null;
  skills: string[];
  isSynced: boolean;
  startDate: string | null;
  endDate: string | null;
  orderIndex: number;
};

export type MessageItem = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type IntegrationConnection = {
  id: number;
  provider: string;
  workspaceUrl: string | null;
  expiresAt: string | null;
};

export type IntegrationPreview = {
  provider: string;
  kind?: string;
  title: string;
  subtitle: string;
  url: string;
  description: string;
  imageUrl: string;
  tags: string[];
  raw: unknown;
};

export type IntegrationSourceItem = {
  provider: string;
  resourceId: string;
  kind: string;
  title: string;
  subtitle: string;
  summary: string;
  url: string | null;
  imageUrl: string | null;
  tags: string[];
  raw: Record<string, unknown>;
};

export type UserProfile = {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  tier: string;
  location: string | null;
  experienceYears: number | null;
  bio: string | null;
  language: string | null;
  isEmailPublic: boolean;
};

export type PublicUserProfile = {
  id: number;
  name: string;
  profileImageUrl: string | null;
  location: string | null;
  experienceYears: number | null;
  bio: string | null;
  email: string | null;
};

export type SettingsProfile = {
  language: string;
  notiEmail: boolean;
  notiPush: boolean;
  notiMessage: boolean;
};

export type ProjectWritingSession = {
  projectId: number;
  portfolioId: number;
  projectName: string;
  role: string;
  status: string;
  progress: number;
  sectionDrafts: Record<string, string>;
  sectionStatuses: Record<string, string>;
  sourceSnapshot: Record<string, unknown>;
  selectedProvider: string | null;
  selectedSourceIds: string[];
  selectedProjectIds: number[];
  selectedDocumentIds: number[];
  documentText: string | null;
  reviewedDocument: string | null;
  presentationJson: string | null;
  lastError: string | null;
  lastSavedAt: string | null;
};

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'content' in (value as Record<string, unknown>) && Array.isArray((value as any).content)) {
    return (value as any).content as T[];
  }
  return [];
}

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export async function listExploreUsers() {
  const result = await apiRequest<any>(
    { url: '/portfolios', method: 'GET', params: { page: 0, size: 24 } },
    async () => ({ content: [] }),
  );
  const items = asArray<PortfolioSummary>(result);
  const splitSkills = (value: unknown) => {
    if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
    if (typeof value !== 'string') return [];
    return value
      .split(/[,/|·]/g)
      .map(item => item.trim())
      .filter(Boolean);
  };
  return items.map((item: any) => ({
    id: String(item.userId ?? item.ownerId ?? item.user?.id ?? item.id),
    portfolioId: item.id,
    name: item.name || item.title || 'Portfolio',
    role: item.role || item.jobRole || 'Developer',
    bio: item.bio || item.summary || '',
    skills: splitSkills(item.skills),
    likes: item.likes ?? item.likeCount ?? 0,
    views: item.views ?? item.viewCount ?? 0,
    avatar: item.avatar || item.thumbnailUrl || '',
    thumbnail: item.thumbnail || item.thumbnailUrl || '',
    pptxUrl: item.pptxUrl || '',
    isPublic: item.isPublic ?? true,
  }));
}

export async function listMessages(): Promise<ConversationCard[]> {
  const currentUserId = getCurrentUserId();
  const inbox = asArray<MessageItem>(
    await apiRequest({ url: '/messages/inbox', method: 'GET' }, async () => []),
  );
  const sent = asArray<MessageItem>(
    await apiRequest({ url: '/messages/sent', method: 'GET' }, async () => []),
  );
  const latestByPeer = new Map<number, MessageItem>();
  const unreadByPeer = new Map<number, number>();
  [...inbox, ...sent].forEach(item => {
    const peerId = item.senderId === currentUserId ? item.receiverId : item.senderId;
    const existing = latestByPeer.get(peerId);
    if (!existing || new Date(item.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
      latestByPeer.set(peerId, item);
    }
    if (!item.isRead && item.senderId !== currentUserId) {
      unreadByPeer.set(peerId, (unreadByPeer.get(peerId) || 0) + 1);
    }
  });
  const peers = await Promise.all(
    [...latestByPeer.values()].map(async item => {
      const peerId = item.senderId === currentUserId ? item.receiverId : item.senderId;
      const profile = await fetchPublicProfile(peerId);
      return {
        item,
        peerId,
        profile,
      };
    }),
  );
  return peers.map(({ item, peerId, profile }) => ({
    id: String(peerId),
    latestMessageId: item.id,
    userId: peerId,
    user: profile.name,
    role: profile.location || 'Portfolio contact',
    lastMsg: item.content,
    time: formatTime(item.createdAt),
    createdAt: item.createdAt,
    unread: unreadByPeer.get(peerId) || 0,
    avatar: profile.profileImageUrl || '',
  }));
}

export async function sendMessage(receiverId: number, content: string) {
  return apiRequest(
    { url: '/messages', method: 'POST', data: { receiverId, content } },
    async () => ({ id: `local-${Date.now()}`, receiverId, content }),
  );
}

export async function markMessageRead(messageId: string | number) {
  return apiRequest(
    { url: `/messages/${messageId}/read`, method: 'PUT' },
    async () => undefined,
  );
}

export async function listCurrentUser() {
  return apiRequest<UserProfile>(
    { url: '/users/me', method: 'GET' },
    async () => ({
      id: 0,
      email: '',
      name: 'Guest',
      profileImageUrl: null,
      tier: 'FREE',
      location: null,
      experienceYears: null,
      bio: null,
      language: 'KO',
      isEmailPublic: false,
    }),
  );
}

export async function fetchCurrentUser() {
  return apiRequestStrict<UserProfile>({ url: '/users/me', method: 'GET' });
}

export async function updateCurrentUser(payload: {
  name?: string;
  profileImageUrl?: string | null;
  location?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  language?: string | null;
  isEmailPublic?: boolean;
}) {
  return apiRequestStrict<UserProfile>({ url: '/users/me', method: 'PUT', data: payload });
}

export async function fetchPublicProfile(userId: number) {
  return apiRequest(
    { url: `/users/${userId}`, method: 'GET' },
    async () => ({ id: userId, name: `User ${userId}`, profileImageUrl: null, location: null, experienceYears: null, bio: null, email: null }),
  );
}

export async function fetchPublicUserPortfolios(userId: number) {
  return apiRequestStrict<PortfolioSummary[]>({ url: `/users/${userId}/portfolios`, method: 'GET' });
}

export async function fetchSettings() {
  return apiRequestStrict<SettingsProfile>({ url: '/users/me/settings', method: 'GET' });
}

export async function updateSettings(settings: { language?: string; notiEmail?: boolean; notiPush?: boolean; notiMessage?: boolean }) {
  return apiRequestStrict<SettingsProfile>({ url: '/users/me/settings', method: 'PUT', data: settings });
}

export async function fetchNotifications() {
  return apiRequest<NotificationItem[]>({ url: '/notifications', method: 'GET' }, async () => []);
}

export async function fetchUnreadNotificationCount() {
  return apiRequest<number>({ url: '/notifications/unread-count', method: 'GET' }, async () => 0);
}

export async function markNotificationRead(notificationId: string | number) {
  return apiRequest({ url: `/notifications/${notificationId}/read`, method: 'PUT' }, async () => undefined);
}

export async function logoutAccount() {
  return apiRequestStrict<void>({ url: '/auth/logout', method: 'DELETE', withCredentials: true });
}

export async function refreshAuthToken() {
  return apiRequestStrict<{ accessToken: string; refreshToken: string | null }>({ url: '/auth/refresh', method: 'POST', withCredentials: true });
}

export async function deleteCurrentUser() {
  return apiRequestStrict<void>({ url: '/users/me', method: 'DELETE' });
}

export async function fetchIntegrations() {
  return apiRequestStrict<IntegrationConnection[]>({ url: '/integrations', method: 'GET' });
}

export async function connectIntegration(provider: IntegrationProviderKey, code: string, workspaceUrl?: string) {
  return apiRequest(
    { url: `/integrations/${provider.toUpperCase()}/callback`, method: 'POST', data: { code, workspaceUrl } },
    async () => undefined,
  );
}

export async function fetchIntegrationAuthorizeUrl(provider: IntegrationProviderKey) {
  return apiRequestStrict<string>({ url: `/integrations/${provider.toUpperCase()}/authorize-url`, method: 'GET' });
}

export async function fetchIntegrationSources(provider: IntegrationProviderKey) {
  return apiRequestStrict<IntegrationSourceItem[]>({ url: `/integrations/${provider.toUpperCase()}/sources`, method: 'GET' });
}

export async function disconnectIntegration(provider: IntegrationProviderKey) {
  return apiRequestStrict<void>({ url: `/integrations/${provider.toUpperCase()}`, method: 'DELETE' });
}

export async function fetchIntegrationPreview(provider: IntegrationProviderKey, resourceId?: string) {
  return apiRequest<IntegrationPreview>(
    { url: `/integrations/${provider.toUpperCase()}/preview`, method: 'GET', params: resourceId ? { resourceId } : undefined },
    async () => ({ provider, title: '', subtitle: '', url: '', description: '', imageUrl: '', tags: [], raw: null }),
  );
}

export async function listMyPortfolios() {
  return apiRequestStrict<PortfolioSummary[]>({ url: '/portfolios/me', method: 'GET' });
}

export async function fetchPortfolioDetail(portfolioId: number) {
  return apiRequest<PortfolioDetail>(
    { url: `/portfolios/${portfolioId}`, method: 'GET' },
    async () => ({
      id: portfolioId,
      userId: 0,
      title: '',
      jobRole: '',
      thumbnailUrl: null,
      summary: null,
      skills: [],
      templateId: null,
      pptxUrl: null,
      customDomain: null,
      isPublic: false,
      viewCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
    }),
  );
}

export async function listPortfolioProjects(portfolioId: number) {
  return apiRequestStrict<ProjectItem[]>({ url: `/portfolios/${portfolioId}/projects`, method: 'GET' });
}

export async function createPortfolioProject(
  portfolioId: number,
  payload: {
    name: string;
    role?: string;
    summary?: string;
    startDate?: string | null;
    endDate?: string | null;
    skills?: string;
  },
) {
  return apiRequestStrict<ProjectItem>({ url: `/portfolios/${portfolioId}/projects`, method: 'POST', data: payload });
}

export async function updatePortfolioProject(
  portfolioId: number,
  projectId: number,
  payload: {
    name: string;
    role?: string;
    summary?: string;
    startDate?: string | null;
    endDate?: string | null;
    skills?: string;
  },
) {
  return apiRequestStrict<ProjectItem>({ url: `/portfolios/${portfolioId}/projects/${projectId}`, method: 'PUT', data: payload });
}

export async function deletePortfolioProject(portfolioId: number, projectId: number) {
  return apiRequestStrict<void>({ url: `/portfolios/${portfolioId}/projects/${projectId}`, method: 'DELETE' });
}

export async function exportPortfolioPptx(portfolioId: number, sourceText = '') {
  const hasSource = Boolean(sourceText.trim());
  return apiRequestStrict<Blob>(
    hasSource
      ? { url: `/portfolios/${portfolioId}/export/pptx`, method: 'POST', data: { sourceText }, responseType: 'blob' }
      : { url: `/portfolios/${portfolioId}/export/pptx`, method: 'GET', responseType: 'blob' },
  );
}

export async function fetchPortfolioData(portfolioId: number) {
  return apiRequestStrict<PortfolioDataResponse>({ url: `/ai/portfolios/${portfolioId}/data`, method: 'GET' });
}

export async function fetchProjectWritingSession(projectId: number) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/session`, method: 'GET' });
}

export async function selectProjectWritingSources(
  projectId: number,
  payload: {
    portfolioId: number;
    projectIds?: number[];
    documentIds?: number[];
    provider?: string | null;
    sourceIds?: string[];
    sourceSelections?: Array<{ provider: string; sourceIds: string[] }>;
  },
) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/sources`, method: 'POST', data: payload });
}

export async function saveProjectWritingDraft(
  projectId: number,
  payload: {
    progress?: number;
    sectionDrafts?: Record<string, string>;
    sectionStatuses?: Record<string, string>;
  },
) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/draft`, method: 'PUT', data: payload });
}

export async function createProjectWritingDocument(projectId: number) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/document`, method: 'POST' });
}

export async function reviewProjectWritingDocument(projectId: number) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/review`, method: 'POST' });
}

export async function createProjectWritingPresentation(projectId: number) {
  return apiRequestStrict<ProjectWritingSession>({ url: `/projects/${projectId}/writing/presentation`, method: 'POST' });
}

export async function exportProjectWritingPptx(projectId: number) {
  return apiRequestStrict<Blob>({ url: `/projects/${projectId}/writing/export/pptx`, method: 'GET', responseType: 'blob' });
}

export async function listDocumentBlocks(documentId: number) {
  return apiRequest<any[]>(
    { url: `/documents/${documentId}/blocks`, method: 'GET' },
    async () => [],
  );
}

export async function createDocumentBlock(documentId: number, payload: Record<string, unknown>) {
  return apiRequest(
    { url: `/documents/${documentId}/blocks`, method: 'POST', data: payload },
    async () => payload,
  );
}

export async function updateDocumentBlock(documentId: number, blockId: number, payload: Record<string, unknown>) {
  return apiRequest(
    { url: `/documents/${documentId}/blocks/${blockId}`, method: 'PUT', data: payload },
    async () => payload,
  );
}

export async function deleteDocumentBlock(documentId: number, blockId: number) {
  return apiRequest(
    { url: `/documents/${documentId}/blocks/${blockId}`, method: 'DELETE' },
    async () => undefined,
  );
}

export async function reorderDocumentBlocks(documentId: number, payload: Array<Record<string, unknown>>) {
  return apiRequest(
    { url: `/documents/${documentId}/blocks/order`, method: 'PUT', data: payload },
    async () => payload,
  );
}
