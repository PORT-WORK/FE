import { apiRequest } from './client';
import { currentUser, exploreUsers, messages as mockMessages, projects as mockProjects } from '../data/mockData';

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

const defaultNotifications = [
  { id: 'n1', type: 'like', user: 'Sarah Lee', key: 'notif_like', time: '2m ago', read: false },
  { id: 'n2', type: 'message', user: 'David Park', key: 'notif_message', time: '15m ago', read: false },
  { id: 'n3', type: 'follow', user: 'Alice Choi', key: 'notif_follow', time: '1h ago', read: true },
];

export async function listExploreUsers() {
  const result = await apiRequest<any>(
    { url: '/portfolios', method: 'GET', params: { page: 0, size: 24 } },
    async () => exploreUsers,
  );
  const items = Array.isArray(result) ? result : result?.content ?? [];
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
  const inbox = await apiRequest<any[]>({ url: '/messages/inbox', method: 'GET' }, async () => mockMessages as any[]);
  const source = inbox && inbox.length ? inbox : (mockMessages as any[]);
  return source.map((msg: any, index: number) => ({
    id: String(msg.id),
    userId: index + 1,
    user: msg.user,
    role: msg.role,
    lastMsg: msg.lastMsg,
    time: msg.time,
    unread: msg.unread ?? 0,
    avatar: msg.avatar ?? '',
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
  return apiRequest({ url: '/users/me', method: 'GET' }, async () => currentUser);
}

export async function fetchCurrentUser() {
  return apiRequest(
    { url: '/users/me', method: 'GET' },
    async () => ({
      id: 1,
      email: currentUser.email,
      name: currentUser.name,
      profileImageUrl: currentUser.avatar || '',
      tier: 'FREE',
      location: currentUser.location,
      experienceYears: 3,
      bio: currentUser.bio,
      language: 'KO',
      isEmailPublic: false,
    }),
  );
}

export async function fetchPublicProfile(userId: number) {
  return apiRequest(
    { url: `/users/${userId}`, method: 'GET' },
    async () => ({ id: userId, name: `User ${userId}`, profileImageUrl: '', location: '', experienceYears: 0, bio: '', email: '' }),
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
  return apiRequest({ url: '/notifications', method: 'GET' }, async () => defaultNotifications);
}

export async function fetchUnreadNotificationCount() {
  return apiRequest({ url: '/notifications/unread-count', method: 'GET' }, async () => defaultNotifications.filter(item => !item.read).length);
}

export async function markNotificationRead(notificationId: string | number) {
  return apiRequest({ url: `/notifications/${notificationId}/read`, method: 'PUT' }, async () => undefined);
}

export async function fetchIntegrations() {
  return apiRequest(
    { url: '/integrations', method: 'GET' },
    async () => [
      { key: 'github', name: 'GitHub', connected: true },
      { key: 'notion', name: 'Notion', connected: false },
      { key: 'figma', name: 'Figma', connected: false },
    ],
  );
}

export async function listProjects() {
  return apiRequest({ url: '/projects', method: 'GET' }, async () => mockProjects);
}

export async function exportPortfolioPptx(portfolioId: number) {
  return apiRequest(
    { url: `/portfolios/${portfolioId}/export/pptx`, method: 'GET', responseType: 'blob' },
    async () => new Blob([JSON.stringify({ portfolioId, exportedAt: new Date().toISOString() })], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
  );
}
