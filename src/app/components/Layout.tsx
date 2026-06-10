import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { Home, Compass, Briefcase, LayoutTemplate, MessageSquare, User, Bookmark, Settings, Sparkles, Github, CheckCircle2, Cpu, ChevronRight, Bell, BarChart2, X, Heart, MessageCircle, UserPlus, AtSign, CreditCard, Zap, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { fetchNotifications, fetchUnreadNotificationCount, markNotificationRead } from '../api/contentApi';

const NAV_ITEMS = [
  { icon: Home, key: 'nav_home', path: '/' },
  { icon: Compass, key: 'nav_explore', path: '/explore' },
  { icon: Briefcase, key: 'nav_portfolio', path: '/portfolio' },
  { icon: LayoutTemplate, key: 'nav_workspace', path: '/workspace' },
  { icon: MessageSquare, key: 'nav_messages', path: '/messages' },
  { icon: User, key: 'nav_profile', path: '/profile' },
  { icon: Bookmark, key: 'nav_saved', path: '/saved' },
  { icon: BarChart2, key: 'nav_analytics', path: '/analytics' },
  { icon: Settings, key: 'nav_settings', path: '/settings' },
];

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/': 'nav_home',
  '/explore': 'nav_explore',
  '/portfolio': 'nav_portfolio',
  '/workspace': 'nav_workspace',
  '/messages': 'nav_messages',
  '/profile': 'nav_profile',
  '/saved': 'nav_saved',
  '/settings': 'nav_settings',
  '/analytics': 'nav_analytics',
  '/generate': 'ai_generate',
  '/portfolio/editor': 'publish',
};

type NotifItem = {
  id: string | number;
  type?: string;
  title?: string;
  user?: string;
  content?: string;
  createdAt?: string;
  time?: string;
  read?: boolean;
};

const MOCK_NOTIFS: NotifItem[] = [
  { id: '1', type: 'like', user: 'Sarah Lee', title: 'Sarah Lee', content: 'liked your project.', time: '2m ago', read: false },
  { id: '2', type: 'message', user: 'David Park', title: 'David Park', content: 'sent a message.', time: '15m ago', read: false },
  { id: '3', type: 'follow', user: 'Alice Choi', title: 'Alice Choi', content: 'started following you.', time: '1h ago', read: true },
  { id: '4', type: 'comment', user: 'Jisoo Park', title: 'Jisoo Park', content: 'commented on your post.', time: '3h ago', read: true },
];

const NOTIF_ICON: Record<string, ReactNode> = {
  like: <Heart size={13} className="text-red-400" />,
  message: <MessageCircle size={13} className="text-blue-400" />,
  follow: <UserPlus size={13} className="text-emerald-400" />,
  comment: <AtSign size={13} className="text-violet-400" />,
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isLoggedIn, user, language, aiCount, aiLimit, payModal, setPayModal, connections, authReady } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<NotifItem[]>(MOCK_NOTIFS);
  const [apiUnreadCount, setApiUnreadCount] = useState<number | null>(null);

  const guestHome = !isLoggedIn && location.pathname === '/';

  useEffect(() => {
    let alive = true;
    fetchNotifications().then(data => {
      if (alive && Array.isArray(data) && data.length > 0) {
        setNotifications(data as NotifItem[]);
      }
    });
    fetchUnreadNotificationCount().then(count => {
      if (alive) setApiUnreadCount(Number(count) || 0);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (authReady && !isLoggedIn && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/oauth/success') {
      navigate('/login', { replace: true });
    }
  }, [authReady, isLoggedIn, location.pathname, navigate]);

  const title = location.pathname === '/workspace'
    ? (language === 'ko' ? '프로젝트' : 'Project')
    : t(PAGE_TITLE_KEYS[location.pathname] ?? 'nav_home');
  const unreadCount = apiUnreadCount ?? notifications.filter(n => !n.read && !readIds.has(String(n.id))).length;
  const aiLabel = isLoggedIn ? t('ai_count_user').replace('{{n}}', String(aiCount)) : t('ai_count_guest').replace('{{n}}', String(aiCount));

  if (guestHome) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: '#050505' }}>
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050505' }}>
      <aside className="w-[220px] flex-shrink-0 flex flex-col" style={{ background: '#080808', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5 px-5 h-14 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="font-black text-white tracking-tight text-[15px]">PORT</span>
        </div>

        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, key, path, badge }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all group relative ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`
              }
              style={({ isActive }) => (isActive ? { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)' } : { border: '1px solid transparent' })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={isActive ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                  <span className="flex-1">{key === 'nav_workspace' ? (language === 'ko' ? '프로젝트' : 'Project') : t(key)}</span>
                  {badge && !isActive && <span className="w-4 h-4 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center">{badge}</span>}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-600">
            <Github size={11} />
            <span>{language === 'ko' ? '연동 상태' : 'Integrations'}</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1 space-y-1">
            {Object.entries(connections)
              .filter(([, connected]) => connected)
              .map(([key]) => (
                <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-zinc-600">
                  <span className="capitalize">{key}</span>
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
              ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-700 cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setPayModal(true)}>
            <Cpu size={11} />
            <span>{aiLabel}</span>
            {aiCount >= aiLimit && <span className="ml-auto text-[9px] text-violet-400 font-semibold">PRO</span>}
          </div>
          <button
            onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl mt-1 transition-colors hover:bg-white/[0.04]"
          >
            {isLoggedIn && user?.avatar
              ? <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              : <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>{isLoggedIn ? (user?.name?.[0] ?? 'M') : '?'}</div>}
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-zinc-200 truncate">{isLoggedIn ? user?.name : 'Guest'}</p>
              <p className="text-[10px] text-zinc-600 truncate">{isLoggedIn ? user?.role : 'Sign in for more features'}</p>
            </div>
          </button>
        </div>
      </aside>

      {payModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setPayModal(false)}>
          <div className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">PORT PRO</p>
                <p className="text-xl font-black text-white mt-1">Unlimited AI portfolio generation</p>
              </div>
              <button onClick={() => setPayModal(false)} className="p-2 text-zinc-700 hover:text-zinc-400 rounded-xl hover:bg-white/[0.06] transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-4 mx-6 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.25)' }}>
              <div className="flex items-end gap-1.5 mb-0.5">
                <span className="text-3xl font-black text-white">$12.99</span>
                <span className="text-sm text-zinc-500 mb-1">/month</span>
              </div>
              <p className="text-xs text-zinc-500">Monthly billing with a 20% discount on annual plans.</p>
            </div>
            <div className="px-6 pb-4 space-y-2.5">
              {['Unlimited AI creation', 'Custom themes and templates', 'GitHub, Notion, and Figma integrations', 'Message and voice features', 'Priority support'].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
                    <Check size={9} className="text-violet-400" />
                  </div>
                  <span className="text-xs text-zinc-300">{f}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2.5 mt-2">
              <button onClick={() => setPayModal(false)} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}>
                <CreditCard size={15} />Start subscription
              </button>
              <button onClick={() => setPayModal(false)} className="w-full py-2.5 rounded-xl text-xs font-medium text-zinc-500 transition-all hover:text-zinc-300" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <Zap size={11} className="inline mr-1.5" />Annual billing saves 20%
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-6" style={{ background: '#060606', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-700">PORT</span>
            <ChevronRight size={13} className="text-zinc-700" />
            <span className="text-zinc-300">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <CheckCircle2 size={11} />
              {t('header_saved')}
            </div>
            <button onClick={() => navigate('/generate')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
              <Sparkles size={12} />
              {t('ai_generate')}
            </button>
            <button onClick={() => setNotifOpen(p => !p)} className="relative p-2 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors hover:bg-white/[0.04]">
              <Bell size={15} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">{unreadCount}</span>}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {notifOpen && (
          <div className="absolute inset-0 z-40" onClick={() => setNotifOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-80 flex flex-col shadow-2xl" style={{ background: '#0c0c0c', borderLeft: '1px solid rgba(255,255,255,0.07)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-bold text-white">{t('notif_title')}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReadIds(new Set(notifications.map(n => String(n.id))))} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">{t('notif_mark_all')}</button>
                  <button onClick={() => setNotifOpen(false)} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] transition-colors"><X size={14} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {notifications.map(n => {
                  const isRead = n.read || readIds.has(String(n.id));
                  return (
                    <div
                      key={String(n.id)}
                      className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => {
                        setReadIds(prev => new Set([...prev, String(n.id)]));
                        void markNotificationRead(n.id);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {NOTIF_ICON[String(n.type || '').toLowerCase()] ?? <Bell size={13} className="text-zinc-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${isRead ? 'text-zinc-600' : 'text-zinc-300'}`}>
                          <span className="font-semibold text-zinc-200">{n.title ?? n.user ?? 'PORT'}</span>
                          {n.content ? ` ${n.content}` : ''}
                        </p>
                        <p className="text-[10px] text-zinc-700 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString() : n.time}</p>
                      </div>
                      {!isRead && <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
