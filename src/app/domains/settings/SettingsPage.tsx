import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Check, FileText, Figma, Github, Loader2, Lock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { deleteCurrentUser, disconnectIntegration, fetchCurrentUser, fetchIntegrations, fetchIntegrationAuthorizeUrl, fetchSettings, logoutAccount, updateCurrentUser, updateSettings, type UserProfile } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';

type LanguageCode = 'ko' | 'en';
type NotifKey = 'email' | 'push' | 'message';
type SettingsDraft = {
  language: LanguageCode;
  notiEmail: boolean;
  notiPush: boolean;
  notiMessage: boolean;
};

type ConnectionKey = 'github' | 'notion' | 'figma';

const INTEGRATION_META: Array<{
  key: ConnectionKey;
  name: Record<LanguageCode, string>;
  desc: Record<LanguageCode, string>;
  icon: JSX.Element;
}> = [
  {
    key: 'github',
    name: { ko: 'GitHub', en: 'GitHub' },
    desc: { ko: '레포지토리와 커밋을 동기화합니다.', en: 'Sync repositories and commits.' },
    icon: <Github size={16} />,
  },
  {
    key: 'notion',
    name: { ko: 'Notion', en: 'Notion' },
    desc: { ko: '문서와 페이지를 가져옵니다.', en: 'Import documents and pages.' },
    icon: <FileText size={16} />,
  },
  {
    key: 'figma',
    name: { ko: 'Figma', en: 'Figma' },
    desc: { ko: '디자인 파일과 화면을 연동합니다.', en: 'Connect design files and frames.' },
    icon: <Figma size={16} />,
  },
];

const DEFAULT_SETTINGS: SettingsDraft = {
  language: 'ko',
  notiEmail: true,
  notiPush: false,
  notiMessage: true,
};

const CONNECTION_KEYS: ConnectionKey[] = ['github', 'notion', 'figma'];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { language, setLanguage, setNotifs, setPrivacy, connections, setConnections, logout } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [showEmail, setShowEmail] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState<ConnectionKey | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [busyProvider, setBusyProvider] = useState<ConnectionKey | 'delete' | 'settings' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ko = language === 'ko';

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [settings, currentUser, rows] = await Promise.all([fetchSettings(), fetchCurrentUser(), fetchIntegrations()]);
        if (!alive) return;

        const nextLanguage: LanguageCode = settings.language === 'en' ? 'en' : 'ko';
        const nextSettings: SettingsDraft = {
          language: nextLanguage,
          notiEmail: Boolean(settings.notiEmail),
          notiPush: Boolean(settings.notiPush),
          notiMessage: Boolean(settings.notiMessage),
        };

        setProfile(currentUser);
        setLanguage(nextLanguage);
        setSettingsDraft(nextSettings);
        setNotifs({
          email: nextSettings.notiEmail,
          push: nextSettings.notiPush,
          message: nextSettings.notiMessage,
        });

        const emailPublic = Boolean(currentUser.isEmailPublic);
        setShowEmail(emailPublic);
        setPrivacy(prev => ({ ...prev, showEmail: emailPublic }));

        const nextConnections: Record<string, boolean> = {
          github: false,
          notion: false,
          figma: false,
        };
        rows.forEach(row => {
          const provider = String(row.provider || '').toLowerCase();
          if (provider in nextConnections) {
            nextConnections[provider] = true;
          }
        });
        setConnections(nextConnections);
      } catch {
        if (!alive) return;
        setError(ko ? '설정 정보를 불러오지 못했습니다.' : 'Failed to load settings.');
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [ko, setConnections, setLanguage, setNotifs, setPrivacy]);

  const connectedList = useMemo(
    () => CONNECTION_KEYS.filter(key => Boolean(connections[key])),
    [connections],
  );

  const buildSettingsPayload = (patch: Partial<SettingsDraft> = {}): SettingsDraft => ({
    language: patch.language ?? settingsDraft.language,
    notiEmail: patch.notiEmail ?? settingsDraft.notiEmail,
    notiPush: patch.notiPush ?? settingsDraft.notiPush,
    notiMessage: patch.notiMessage ?? settingsDraft.notiMessage,
  });

  const saveSettings = async (patch: Partial<SettingsDraft> = {}) => {
    const next = buildSettingsPayload(patch);
    setBusyProvider('settings');
    try {
      setError(null);
      await updateSettings(next);
      setSettingsDraft(next);
      setLanguage(next.language);
      setNotifs({
        email: next.notiEmail,
        push: next.notiPush,
        message: next.notiMessage,
      });
    } catch {
      setError(ko ? '설정을 저장하지 못했습니다.' : 'Failed to save settings.');
    } finally {
      setBusyProvider(null);
    }
  };

  const handleConnect = async (provider: ConnectionKey) => {
    setBusyProvider(provider);
    try {
      setError(null);
      const authorizeUrl = await fetchIntegrationAuthorizeUrl(provider);
      if (authorizeUrl) {
        window.location.assign(authorizeUrl);
      }
    } catch {
      setError(ko ? '연동 로그인 창을 여는 데 실패했습니다.' : 'Failed to open the login page.');
    } finally {
      setBusyProvider(null);
    }
  };

  const handleDisconnect = async (provider: ConnectionKey) => {
    setBusyProvider(provider);
    try {
      setError(null);
      await disconnectIntegration(provider);
      setConnections(prev => ({ ...prev, [provider]: false }));
      setDisconnectConfirm(null);
    } catch {
      setError(ko ? '연동 해제에 실패했습니다.' : 'Failed to disconnect.');
    } finally {
      setBusyProvider(null);
    }
  };

  const handleToggleNotification = async (key: NotifKey) => {
    const next = {
      email: key === 'email' ? !settingsDraft.notiEmail : settingsDraft.notiEmail,
      push: key === 'push' ? !settingsDraft.notiPush : settingsDraft.notiPush,
      message: key === 'message' ? !settingsDraft.notiMessage : settingsDraft.notiMessage,
    };
    await saveSettings({
      notiEmail: next.email,
      notiPush: next.push,
      notiMessage: next.message,
    });
  };

  const handleToggleEmailPublic = async () => {
    if (!profile) return;
    const next = !showEmail;
    setBusyProvider('settings');
    try {
      setError(null);
      const updated = await updateCurrentUser({
        name: profile.name,
        profileImageUrl: profile.profileImageUrl,
        location: profile.location,
        experienceYears: profile.experienceYears,
        bio: profile.bio,
        language: profile.language,
        isEmailPublic: next,
      });
      setProfile(updated);
      setShowEmail(Boolean(updated.isEmailPublic));
      setPrivacy(prev => ({ ...prev, showEmail: Boolean(updated.isEmailPublic) }));
    } catch {
      setError(ko ? '이메일 공개 설정을 저장하지 못했습니다.' : 'Failed to save email visibility.');
    } finally {
      setBusyProvider(null);
    }
  };

  const handleDeleteAccount = async () => {
    setBusyProvider('delete');
    try {
      setError(null);
      await deleteCurrentUser();
    } catch {
      // deletion should still end the local session if the server already removed the account
    }

    try {
      await logoutAccount();
    } catch {
      // ignore logout failure
    } finally {
      logout();
      navigate('/', { replace: true });
    }
  };

  const activeConnections = connectedList.length;

  return (
    <div className="px-8 py-8" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="mx-auto max-w-2xl space-y-5">
        {error && (
          <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{ko ? '언어' : 'Language'}</h3>
          <div className="flex gap-2">
            {([['ko', ko ? '한국어' : 'Korean'], ['en', 'English']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => void saveSettings({ language: key })}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all"
                style={{
                  background: settingsDraft.language === key ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${settingsDraft.language === key ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  color: settingsDraft.language === key ? '#a78bfa' : '#71717a',
                }}
              >
                {settingsDraft.language === key && <Check size={13} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setShowConnections(prev => !prev)}
            className="flex w-full items-center justify-between"
          >
            <div className="text-left">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{ko ? '연동 상태' : 'Integrations'}</h3>
              <p className="mt-1 text-xs text-zinc-600">
                {ko ? `${activeConnections}개 연동됨` : `${activeConnections} connected`}
              </p>
            </div>
            <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showConnections ? 'rotate-180' : ''}`} />
          </button>

          {showConnections && (
            <div className="mt-4 space-y-2">
              {INTEGRATION_META.map(item => {
                const connected = Boolean(connections[item.key]);
                return (
                  <div key={item.key} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-zinc-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">{item.name[language]}</p>
                        <p className="text-xs text-zinc-600">{item.desc[language]}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2.5">
                        {connected ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                            <span className="text-[10px] text-emerald-500">{ko ? '연결됨' : 'Connected'}</span>
                          </div>
                        ) : null}
                        {connected ? (
                          disconnectConfirm === item.key ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => void handleDisconnect(item.key)} className="rounded-lg px-2.5 py-1.5 text-[10px] text-red-400 transition-all hover:bg-red-500/10">
                                {ko ? '해제' : 'Remove'}
                              </button>
                              <button onClick={() => setDisconnectConfirm(null)} className="rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-600 transition-all hover:bg-white/[0.05]">
                                {ko ? '취소' : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDisconnectConfirm(item.key)}
                              className="rounded-lg px-3 py-1.5 text-xs transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}
                            >
                              {ko ? '연결 해제' : 'Disconnect'}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => void handleConnect(item.key)}
                            className="rounded-lg px-3 py-1.5 text-xs transition-all"
                            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}
                          >
                            {ko ? '연결' : 'Connect'}
                          </button>
                        )}
                        {busyProvider === item.key && <Loader2 size={12} className="animate-spin text-violet-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 rounded-xl p-3 text-xs text-zinc-600" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Lock size={11} className="flex-shrink-0 text-zinc-600" />
            OAuth tokens are encrypted and stored securely.
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{ko ? '알림' : 'Notifications'}</h3>
          <div className="space-y-4">
            {([
              ['email', ko ? '이메일 알림' : 'Email notifications', ko ? '업데이트를 이메일로 받습니다.' : 'Receive updates by email.'],
              ['push', ko ? '푸시 알림' : 'Push notifications', ko ? '브라우저 알림을 받습니다.' : 'Receive browser notifications.'],
              ['message', ko ? '메시지 알림' : 'Message notifications', ko ? '새 메시지를 받으면 알림을 받습니다.' : 'Get notified on new messages.'],
            ] as const).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-300">{label}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
                </div>
                <button
                  onClick={() => void handleToggleNotification(key as NotifKey)}
                  className="h-6 w-10 rounded-full transition-all"
                  style={{ background: settingsDraft[`noti${key === 'email' ? 'Email' : key === 'push' ? 'Push' : 'Message'}` as keyof SettingsDraft] ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="h-4 w-4 rounded-full bg-white transition-all"
                    style={{ transform: `translateX(${settingsDraft[`noti${key === 'email' ? 'Email' : key === 'push' ? 'Push' : 'Message'}` as keyof SettingsDraft] ? '18px' : '2px'})` }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{ko ? '개인정보' : 'Privacy'}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-300">{ko ? '이메일 공개' : 'Show email'}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{ko ? '프로필에 이메일을 표시합니다.' : 'Display your email on the profile page.'}</p>
              </div>
              <button
                onClick={() => void handleToggleEmailPublic()}
                className="h-6 w-10 rounded-full transition-all"
                style={{ background: showEmail ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="h-4 w-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${showEmail ? '18px' : '2px'})` }} />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-red-500/70">{ko ? '위험 구역' : 'Danger zone'}</h3>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex w-full items-center justify-between rounded-xl text-sm text-red-400/80 transition-colors hover:text-red-400"
          >
            {ko ? '계정 삭제' : 'Delete account'}
            <ChevronRight size={14} />
          </button>
        </div>

        {deleteOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={() => setDeleteOpen(false)}>
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
              <p className="text-lg font-black text-white">{ko ? '정말 계정을 삭제할까요?' : 'Delete your account?'}</p>
              <p className="mt-2 text-sm text-zinc-600">
                {ko ? '삭제하면 다시 복구할 수 없습니다. 계정과 연결 데이터가 제거됩니다.' : 'This action cannot be undone. Your account and linked data will be removed.'}
              </p>
              <div className="mt-6 flex items-center gap-2">
                <button onClick={() => setDeleteOpen(false)} className="flex-1 rounded-2xl py-3 text-sm font-semibold text-zinc-300" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {ko ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={() => void handleDeleteAccount()}
                  disabled={busyProvider === 'delete'}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
                >
                  {busyProvider === 'delete' && <Loader2 size={14} className="animate-spin" />}
                  {ko ? '삭제' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
