import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { buildOauthLoginUrl, clearAuthTokens, resetCurrentUserId, setCurrentUserId } from '../api/client';
import { fetchCurrentUser, type UserProfile } from '../api/contentApi';
import { INTEGRATION_PROVIDER_KEYS, type IntegrationProviderKey } from '../api/integrationProviders';

export type Lang = 'ko' | 'en';

type Notifs = { email: boolean; push: boolean; message: boolean };
type Privacy = { public: boolean; showEmail: boolean };
type Connections = Record<IntegrationProviderKey, boolean>;
type Following = string[];
type SavedCollections = {
  saved: string[];
  liked: string[];
  archived: string[];
};

export interface AppUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
  provider: 'kakao' | 'google';
  bio?: string;
}

type AppContextValue = {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  isLoggedIn: boolean;
  login: (provider: 'kakao' | 'google') => void;
  logout: () => void;
  authReady: boolean;
  aiCount: number;
  aiLimit: number;
  payModal: boolean;
  setPayModal: (open: boolean) => void;
  notifs: Notifs;
  setNotifs: (value: Notifs) => void;
  privacy: Privacy;
  setPrivacy: (value: Privacy) => void;
  connections: Connections;
  setConnections: (value: Connections) => void;
  followingIds: Following;
  setFollowingIds: Dispatch<SetStateAction<Following>>;
  savedCollections: SavedCollections;
  setSavedCollections: Dispatch<SetStateAction<SavedCollections>>;
};

const STORAGE_KEY = 'port-app-state';
const LOGOUT_FLAG_KEY = 'port-auth-logged-out';

const translations: Record<Lang, Record<string, string>> = {
  ko: {
    nav_home: '홈',
    nav_explore: '탐색',
    nav_portfolio: '포트폴리오',
    nav_messages: '메시지',
    nav_workspace: '워크스페이스',
    nav_profile: '프로필',
    nav_saved: '저장됨',
    nav_analytics: '분석',
    nav_settings: '설정',
    nav_logout: '로그아웃',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    close: '닫기',
    copied: '복사됨',
    copy: '복사',
    share: '공유',
    publish: '발행',
    header_preview: '미리보기',
    header_saved: '저장됨',
    ai_generate: 'AI 생성',
    notif_title: '알림',
    notif_mark_all: '모두 읽음',
    ai_count_user: 'AI {{n}}/3',
    login_title: 'PORT에 로그인',
    login_subtitle: 'AI 기반 포트폴리오 플랫폼',
    login_kakao: '카카오로 계속하기',
    login_google: '구글로 계속하기',
    login_ai_user: '로그인 후 AI 3회 사용 가능',
    login_more: '프로로 업그레이드하면 더 많이 사용할 수 있습니다',
    settings_title: '설정',
    settings_lang: '언어',
    settings_notif: '알림',
    settings_email_notif: '이메일 알림',
    settings_email_desc: '업데이트를 이메일로 받습니다',
    settings_push_notif: '푸시 알림',
    settings_push_desc: '브라우저 알림을 받습니다',
    settings_msg_notif: '메시지 알림',
    settings_msg_desc: '새 메시지를 받을 때 알림을 받습니다',
    settings_privacy: '개인정보',
    settings_public_profile: '공개 프로필',
    settings_public_desc: '다른 사용자가 프로필을 볼 수 있습니다',
    settings_account: '계정',
    settings_logout: '로그아웃',
    settings_withdraw: '회원 탈퇴',
    msg_title: '메시지',
    msg_search: '검색...',
    msg_placeholder: '메시지를 입력하세요...',
    msg_profile: '프로필',
    explore_search: '이름, 직무, 기술로 검색...',
    explore_count: '명의 포트폴리오',
    message_btn: '메시지',
    portfolio_new_article: '새 글',
    portfolio_new_project: '새 프로젝트',
    portfolio_categories: '개 카테고리',
    portfolio_articles: '개 글',
    portfolio_back_projects: '프로젝트 목록',
    portfolio_back_categories: '카테고리 목록',
    portfolio_search: '글 검색...',
    portfolio_reading: '읽는 중',
    portfolio_empty: '아직 글이 없습니다',
    portfolio_first: '첫 글 작성하기',
    portfolio_all: '전체 보기',
    portfolio_new_article_hint: '새 글',
    workspace_placeholder: 'AI에게 무엇을 만들지 물어보세요',
    editor_back: '포트폴리오로 돌아가기',
    editor_save: '임시 저장',
    editor_publish: '발행',
    editor_preview: '미리보기',
    editor_edit_mode: '편집',
    editor_preview_mode: '미리보기',
    editor_title_placeholder: '제목 없음',
    editor_content_placeholder: '내용을 입력하세요',
    editor_delete_block: '블록 삭제',
    editor_change_type: '블록 타입 변경',
    editor_emoji_title: '이모지 선택',
    editor_block_text: '텍스트',
    editor_block_h1: '제목 1',
    editor_block_h2: '제목 2',
    editor_block_h3: '제목 3',
    editor_block_h4: '제목 4',
    editor_block_code: '코드',
    editor_block_quote: '인용문',
    editor_block_bullet: '목록',
    editor_block_check: '체크리스트',
    editor_block_callout: '콜아웃',
    editor_block_image: '이미지',
    editor_block_table: '표',
    editor_block_database: '데이터베이스',
    editor_block_divider: '구분선',
    editor_block_embed: '임베드',
    home_title: 'AI Portfolio Builder',
    home_subtitle: 'AI가 도와주는 포트폴리오 생성',
    home_start: 'AI로 시작',
    home_all_done: '모든 단계 완료',
    home_reset: '처음부터 다시',
    home_step: '단계',
  },
  en: {
    nav_home: 'Home',
    nav_explore: 'Explore',
    nav_portfolio: 'Portfolio',
    nav_messages: 'Messages',
    nav_workspace: 'Workspace',
    nav_profile: 'Profile',
    nav_saved: 'Saved',
    nav_analytics: 'Analytics',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    copied: 'Copied',
    copy: 'Copy',
    share: 'Share',
    publish: 'Publish',
    header_preview: 'Preview',
    header_saved: 'Saved',
    ai_generate: 'AI Generate',
    notif_title: 'Notifications',
    notif_mark_all: 'Mark all read',
    ai_count_user: 'AI {{n}}/3',
    login_title: 'Welcome to PORT',
    login_subtitle: 'AI portfolio platform',
    login_kakao: 'Continue with Kakao',
    login_google: 'Continue with Google',
    login_ai_user: '3 AI uses after sign-in',
    login_more: 'More AI usage with Pro',
    settings_title: 'Settings',
    settings_lang: 'Language',
    settings_notif: 'Notifications',
    settings_email_notif: 'Email notifications',
    settings_email_desc: 'Receive updates by email',
    settings_push_notif: 'Push notifications',
    settings_push_desc: 'Receive browser notifications',
    settings_msg_notif: 'Message notifications',
    settings_msg_desc: 'Get notified on new messages',
    settings_privacy: 'Privacy',
    settings_public_profile: 'Public profile',
    settings_public_desc: 'Allow others to view your profile',
    settings_account: 'Account',
    settings_logout: 'Logout',
    settings_withdraw: 'Delete account',
    msg_title: 'Messages',
    msg_search: 'Search...',
    msg_placeholder: 'Type a message...',
    msg_profile: 'Profile',
    explore_search: 'Search by name, role, skill...',
    explore_count: 'portfolios',
    message_btn: 'Message',
    portfolio_new_article: 'New article',
    portfolio_new_project: 'New project',
    portfolio_categories: 'categories',
    portfolio_articles: 'articles',
    portfolio_back_projects: 'Project list',
    portfolio_back_categories: 'Category list',
    portfolio_search: 'Search articles...',
    portfolio_reading: 'reading',
    portfolio_empty: 'No articles yet',
    portfolio_first: 'Write your first article',
    portfolio_all: 'All',
    portfolio_new_article_hint: 'New article',
    workspace_placeholder: 'Ask AI what to build',
    editor_back: 'Back to portfolio',
    editor_save: 'Save draft',
    editor_publish: 'Publish',
    editor_preview: 'Preview',
    editor_edit_mode: 'Edit',
    editor_preview_mode: 'Preview',
    editor_title_placeholder: 'Untitled',
    editor_content_placeholder: 'Write something',
    editor_delete_block: 'Delete block',
    editor_change_type: 'Change block type',
    editor_emoji_title: 'Pick an emoji',
    editor_block_text: 'Text',
    editor_block_h1: 'Heading 1',
    editor_block_h2: 'Heading 2',
    editor_block_h3: 'Heading 3',
    editor_block_h4: 'Heading 4',
    editor_block_code: 'Code',
    editor_block_quote: 'Quote',
    editor_block_bullet: 'Bullets',
    editor_block_check: 'Checklist',
    editor_block_callout: 'Callout',
    editor_block_image: 'Image',
    editor_block_table: 'Table',
    editor_block_database: 'Database',
    editor_block_divider: 'Divider',
    editor_block_embed: 'Embed',
    home_title: 'AI Portfolio Builder',
    home_subtitle: 'Build a portfolio with AI guidance',
    home_start: 'Start with AI',
    home_all_done: 'All steps done',
    home_reset: 'Start over',
    home_step: 'step',
  },
};

const defaultUser: AppUser = {
  name: 'Minjun Kim',
  email: 'minjun@example.com',
  role: 'Frontend Developer',
  avatar: '',
  provider: 'kakao',
  bio: 'Frontend developer focused on performance, clean architecture, and design systems.',
};

function mapProfileToUser(profile: UserProfile): AppUser {
  return {
    name: profile.name,
    email: profile.email,
    role: profile.tier || 'Member',
    avatar: profile.profileImageUrl || '',
    provider: 'google',
    bio: profile.bio || undefined,
  };
}

const defaultState = {
  language: 'ko' as Lang,
  user: null as AppUser | null,
  aiCount: 1,
  aiLimit: 3,
  payModal: false,
  notifs: { email: true, push: false, message: true },
  privacy: { public: true, showEmail: false },
  connections: Object.fromEntries(INTEGRATION_PROVIDER_KEYS.map(key => [key, key === 'github'])) as Connections,
  followingIds: [] as Following,
  savedCollections: { saved: [], liked: [], archived: [] } as SavedCollections,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Lang>(defaultState.language);
  const [user, setUser] = useState<AppUser | null>(defaultState.user);
  const [aiCount, setAiCount] = useState(defaultState.aiCount);
  const [aiLimit] = useState(defaultState.aiLimit);
  const [payModal, setPayModal] = useState(false);
  const [notifs, setNotifs] = useState(defaultState.notifs);
  const [privacy, setPrivacy] = useState(defaultState.privacy);
  const [connections, setConnections] = useState(defaultState.connections);
  const [followingIds, setFollowingIds] = useState<Following>(defaultState.followingIds);
  const [savedCollections, setSavedCollections] = useState<SavedCollections>(defaultState.savedCollections);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof defaultState> & { user?: AppUser | null };
      if (parsed.language === 'ko' || parsed.language === 'en') setLanguage(parsed.language);
      if (parsed.user) setUser(parsed.user);
      if (typeof parsed.aiCount === 'number') setAiCount(parsed.aiCount);
      if (parsed.notifs) setNotifs(parsed.notifs);
      if (parsed.privacy) setPrivacy(parsed.privacy);
      if (parsed.connections) setConnections(parsed.connections);
      if (Array.isArray(parsed.followingIds)) setFollowingIds(parsed.followingIds.filter(item => typeof item === 'string'));
      if (parsed.savedCollections) {
        setSavedCollections({
          saved: Array.isArray(parsed.savedCollections.saved) ? parsed.savedCollections.saved.filter(item => typeof item === 'string') : [],
          liked: Array.isArray(parsed.savedCollections.liked) ? parsed.savedCollections.liked.filter(item => typeof item === 'string') : [],
          archived: Array.isArray(parsed.savedCollections.archived) ? parsed.savedCollections.archived.filter(item => typeof item === 'string') : [],
        });
      }
    } catch {
      // ignore invalid cache
    }
  }, []);

  useEffect(() => {
    const wasLoggedOut = localStorage.getItem(LOGOUT_FLAG_KEY) === '1';
    if (wasLoggedOut) {
      setAuthReady(true);
      return;
    }

    let alive = true;
    void fetchCurrentUser()
      .then(profile => {
        if (!alive) return;
        const nextUser = mapProfileToUser(profile);
        setCurrentUserId(profile.id);
        setUser(nextUser);
        setFollowingIds(defaultState.followingIds);
        setAiCount((value) => Math.max(value, 1));
      })
      .catch(() => {
        if (!alive) return;
        setUser(null);
      })
      .finally(() => {
        if (alive) setAuthReady(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, user, aiCount, notifs, privacy, connections, followingIds, savedCollections }));
  }, [language, user, aiCount, notifs, privacy, connections, followingIds, savedCollections]);

  const login = (provider: 'kakao' | 'google') => {
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    window.location.assign(buildOauthLoginUrl(provider));
  };

  const logout = () => {
    resetCurrentUserId();
    clearAuthTokens();
    localStorage.setItem(LOGOUT_FLAG_KEY, '1');
    setUser(null);
    setAiCount(0);
    setPayModal(false);
  };

  const value = useMemo<AppContextValue>(() => ({
    language,
    setLanguage,
    t: (key: string) => translations[language][key] ?? translations.en[key] ?? key,
    user,
    setUser,
    isLoggedIn: Boolean(user),
    login,
    logout,
    authReady,
    aiCount,
    aiLimit,
    payModal,
    setPayModal,
    notifs,
    setNotifs,
    privacy,
    setPrivacy,
    connections,
    setConnections,
    followingIds,
    setFollowingIds,
    savedCollections,
    setSavedCollections,
  }), [language, user, authReady, aiCount, aiLimit, payModal, notifs, privacy, connections, followingIds, savedCollections]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
