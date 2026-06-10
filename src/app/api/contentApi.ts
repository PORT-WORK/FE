import { apiRequest } from './client';

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
  userId: number;
  user: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  avatar: string;
};

export type PortfolioSummary = {
  id: number;
  title: string;
  jobRole: string;
  thumbnailUrl: string | null;
  summary: string | null;
  skills: string[];
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
  customDomain: string | null;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
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
  title: string;
  subtitle: string;
  url: string;
  description: string;
  imageUrl: string;
  tags: string[];
  raw: unknown;
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
  return items.map((item: any) => ({
    id: String(item.id),
    name: item.name || item.title || 'Portfolio',
    role: item.role || item.jobRole || 'Developer',
    bio: item.bio || item.summary || '',
    skills: Array.isArray(item.skills) ? item.skills : [],
    likes: item.likes ?? item.likeCount ?? 0,
    views: item.views ?? item.viewCount ?? 0,
    avatar: item.avatar || item.thumbnailUrl || '',
    thumbnail: item.thumbnail || item.thumbnailUrl || '',
  }));
}

export async function listMessages(): Promise<ConversationCard[]> {
  const currentUserId = Number(import.meta.env.VITE_USER_ID || 1);
  const inbox = asArray<MessageItem>(
    await apiRequest({ url: '/messages/inbox', method: 'GET' }, async () => []),
  );
  const sent = asArray<MessageItem>(
    await apiRequest({ url: '/messages/sent', method: 'GET' }, async () => []),
  );
  const latestByPeer = new Map<number, MessageItem>();
  [...inbox, ...sent].forEach(item => {
    const peerId = item.senderId === currentUserId ? item.receiverId : item.senderId;
    const existing = latestByPeer.get(peerId);
    if (!existing || new Date(item.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
      latestByPeer.set(peerId, item);
    }
  });
  const peers = await Promise.all(
    [...latestByPeer.values()].map(async item => {
      const peerId = item.senderId === currentUserId ? item.receiverId : item.senderId;
      const profile = await fetchPublicProfile(peerId);
      return {
        item,
        profile,
      };
    }),
  );
  return peers.map(({ item, profile }) => ({
    id: String(item.id),
    userId: item.senderId === currentUserId ? item.receiverId : item.senderId,
    user: profile.name,
    role: profile.location || 'Portfolio contact',
    lastMsg: item.content,
    time: formatTime(item.createdAt),
    unread: item.isRead ? 0 : 1,
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
  return listCurrentUser();
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
  return apiRequest<UserProfile>(
    { url: '/users/me', method: 'PUT', data: payload },
    async () => ({
      id: 0,
      email: '',
      name: payload.name || 'Guest',
      profileImageUrl: payload.profileImageUrl || null,
      tier: 'FREE',
      location: payload.location || null,
      experienceYears: payload.experienceYears ?? null,
      bio: payload.bio || null,
      language: payload.language || 'KO',
      isEmailPublic: payload.isEmailPublic ?? false,
    }),
  );
}

export async function fetchPublicProfile(userId: number) {
  return apiRequest(
    { url: `/users/${userId}`, method: 'GET' },
    async () => ({ id: userId, name: `User ${userId}`, profileImageUrl: null, location: null, experienceYears: null, bio: null, email: null }),
  );
}

export async function fetchSettings() {
  return apiRequest(
    { url: '/users/me/settings', method: 'GET' },
    async () => ({ language: 'KO', notiEmail: true, notiPush: false, notiMessage: true }),
  );
}

export async function updateSettings(settings: { language?: string; notiEmail?: boolean; notiPush?: boolean; notiMessage?: boolean }) {
  return apiRequest({ url: '/users/me/settings', method: 'PUT', data: settings }, async () => settings);
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

export async function fetchIntegrations() {
  return apiRequest<IntegrationConnection[]>(
    { url: '/integrations', method: 'GET' },
    async () => [],
  );
}

export async function connectIntegration(provider: string, code: string, workspaceUrl?: string) {
  return apiRequest(
    { url: `/integrations/${provider.toUpperCase()}/callback`, method: 'POST', data: { code, workspaceUrl } },
    async () => undefined,
  );
}

export async function disconnectIntegration(provider: string) {
  return apiRequest(
    { url: `/integrations/${provider.toUpperCase()}`, method: 'DELETE' },
    async () => undefined,
  );
}

export async function fetchIntegrationPreview(provider: string, resourceId?: string) {
  return apiRequest<IntegrationPreview>(
    { url: `/integrations/${provider.toUpperCase()}/preview`, method: 'GET', params: resourceId ? { resourceId } : undefined },
    async () => ({ provider, title: '', subtitle: '', url: '', description: '', imageUrl: '', tags: [], raw: null }),
  );
}

export async function listMyPortfolios() {
  return apiRequest<PortfolioSummary[]>(
    { url: '/portfolios/me', method: 'GET' },
    async () => [],
  );
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
      customDomain: null,
      isPublic: false,
      viewCount: 0,
      likeCount: 0,
      bookmarkCount: 0,
    }),
  );
}

export async function listPortfolioProjects(portfolioId: number) {
  return apiRequest<ProjectItem[]>(
    { url: `/portfolios/${portfolioId}/projects`, method: 'GET' },
    async () => [],
  );
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
  return apiRequest<ProjectItem>(
    { url: `/portfolios/${portfolioId}/projects`, method: 'POST', data: payload },
    async () => ({
      id: Date.now(),
      portfolioId,
      name: payload.name,
      role: payload.role || '',
      summary: payload.summary || null,
      thumbnailUrl: null,
      skills: (payload.skills || '').split(',').map(item => item.trim()).filter(Boolean),
      isSynced: false,
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      orderIndex: 0,
    }),
  );
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
  return apiRequest<ProjectItem>(
    { url: `/portfolios/${portfolioId}/projects/${projectId}`, method: 'PUT', data: payload },
    async () => ({
      id: projectId,
      portfolioId,
      name: payload.name,
      role: payload.role || '',
      summary: payload.summary || null,
      thumbnailUrl: null,
      skills: (payload.skills || '').split(',').map(item => item.trim()).filter(Boolean),
      isSynced: false,
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      orderIndex: 0,
    }),
  );
}

export async function deletePortfolioProject(portfolioId: number, projectId: number) {
  return apiRequest(
    { url: `/portfolios/${portfolioId}/projects/${projectId}`, method: 'DELETE' },
    async () => undefined,
  );
}

export async function exportPortfolioPptx(portfolioId: number, sourceText = '') {
  const hasSource = Boolean(sourceText.trim());
  return apiRequest<Blob>(
    hasSource
      ? { url: `/portfolios/${portfolioId}/export/pptx`, method: 'POST', data: { sourceText }, responseType: 'blob' }
      : { url: `/portfolios/${portfolioId}/export/pptx`, method: 'GET', responseType: 'blob' },
    async () => new Blob([JSON.stringify({ portfolioId, sourceText, exportedAt: new Date().toISOString() })], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
  );
}
