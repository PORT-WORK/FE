import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Check, FileText, Figma, Github, Loader2, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  disconnectIntegration,
  fetchCurrentUser,
  fetchIntegrations,
  fetchIntegrationAuthorizeUrl,
  fetchSettings,
  updateCurrentUser,
  updateSettings,
} from '../../api/contentApi';

const INTEGRATION_META = [
  { key: 'github', name: { ko: 'GitHub', en: 'GitHub' }, desc: { ko: '저장소와 커밋 동기화', en: 'Repo and commit sync' }, icon: <Github size={16} /> },
  { key: 'notion', name: { ko: 'Notion', en: 'Notion' }, desc: { ko: '문서와 페이지 가져오기', en: 'Import documents and pages' }, icon: <FileText size={16} /> },
  { key: 'figma', name: { ko: 'Figma', en: 'Figma' }, desc: { ko: '디자인 파일 연결', en: 'Bring in design files' }, icon: <Figma size={16} /> },
] as const;

type NotifKey = 'email' | 'push' | 'message';

export default function SettingsPage() {
  const { language, setLanguage, setNotifs, setPrivacy, connections, setConnections } = useApp();
  const [profileName, setProfileName] = useState('PORT User');
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [notifsState, setNotifsState] = useState({ email: true, push: false, message: true });
  const [error, setError] = useState<string | null>(null);

  const ko = language === 'ko';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [settings, currentUser, rows] = await Promise.all([fetchSettings(), fetchCurrentUser(), fetchIntegrations()]);
      if (!alive) return;

      setLanguage(settings.language === 'en' ? 'en' : 'ko');
      setProfileName(currentUser.name || 'PORT User');
      const nextNotifs = { email: settings.notiEmail, push: settings.notiPush, message: settings.notiMessage };
      setNotifs(nextNotifs);
      setNotifsState(nextNotifs);
      setShowEmail(Boolean(currentUser.isEmailPublic));
      setPrivacy(prev => ({ ...prev, showEmail: Boolean(currentUser.isEmailPublic) }));

      const nextConnections: Record<string, boolean> = { github: false, notion: false, figma: false };
      rows.forEach(row => {
        nextConnections[row.provider.toLowerCase()] = true;
      });
      setConnections(nextConnections);
    };

    void load();
    return () => {
      alive = false;
    };
  }, [setConnections, setLanguage, setNotifs, setPrivacy]);

  const connectedList = useMemo(
    () => INTEGRATION_META.filter(item => connections[item.key]),
    [connections],
  );

  const saveSettings = async (patch: { language?: string; notiEmail?: boolean; notiPush?: boolean; notiMessage?: boolean }) => {
    try {
      setError(null);
      await updateSettings(patch);
    } catch {
      setError(ko ? '설정을 저장하지 못했습니다.' : 'Failed to save settings.');
    }
  };

  const connectIntegration = async (provider: string) => {
    setBusyProvider(provider);
    try {
      setError(null);
      const authorizeUrl = await fetchIntegrationAuthorizeUrl(provider);
      if (authorizeUrl) {
        window.location.assign(authorizeUrl);
      }
    } catch {
      setError(ko ? '연동 로그인 화면을 불러오지 못했습니다.' : 'Failed to open the login page.');
    } finally {
      setBusyProvider(null);
    }
  };

  const removeIntegration = async (provider: string) => {
    setBusyProvider(provider);
    try {
      setError(null);
      await disconnectIntegration(provider);
      setConnections(prev => ({ ...prev, [provider]: false }));
      setDisconnectConfirm(null);
    } catch {
      setError(ko ? '연결 해제에 실패했습니다.' : 'Failed to disconnect.');
    } finally {
      setBusyProvider(null);
    }
  };

  const toggleNotification = async (key: NotifKey) => {
    const next = { ...notifsState, [key]: !notifsState[key] };
    setNotifsState(next);
    setNotifs(next);
    await saveSettings({ notiEmail: next.email, notiPush: next.push, notiMessage: next.message });
  };

  return (
    <div className="px-8 py-8" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-2xl mx-auto space-y-5">
        {error && (
          <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '언어' : 'Language'}</h3>
          <div className="flex gap-2">
            {([['ko', '한국어'], ['en', 'English']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={async () => {
                  setLanguage(key);
                  await saveSettings({ language: key });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: language === key ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${language === key ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  color: language === key ? '#a78bfa' : '#71717a',
                }}
              >
                {language === key && <Check size={13} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            onClick={() => setShowConnections(prev => !prev)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{ko ? '연동 상태' : 'Integrations'}</h3>
              <p className="mt-1 text-xs text-zinc-600">
                {ko ? `${connectedList.length}개 연결됨` : `${connectedList.length} connected`}
              </p>
            </div>
            <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showConnections ? 'rotate-180' : ''}`} />
          </button>

          {showConnections && (
            <div className="mt-4 space-y-2">
              {INTEGRATION_META.map(item => {
                const connected = Boolean(connections[item.key]);
                return (
                  <div key={item.key} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{item.name[language]}</p>
                      <p className="text-xs text-zinc-600">{item.desc[language]}</p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {connected && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                          <span className="text-[10px] text-emerald-500">{ko ? '연결됨' : 'Connected'}</span>
                        </div>
                      )}
                      {connected
                        ? disconnectConfirm === item.key
                          ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => void removeIntegration(item.key)} className="text-[10px] px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">{ko ? '삭제' : 'Remove'}</button>
                              <button onClick={() => setDisconnectConfirm(null)} className="text-[10px] px-2.5 py-1.5 rounded-lg text-zinc-600 hover:bg-white/[0.05] transition-all">{ko ? '취소' : 'Cancel'}</button>
                            </div>
                          )
                          : <button onClick={() => setDisconnectConfirm(item.key)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}>{ko ? '연결 해제' : 'Disconnect'}</button>
                        : <button onClick={() => void connectIntegration(item.key)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>{ko ? '연결' : 'Connect'}</button>}
                      {busyProvider === item.key && <Loader2 size={12} className="text-violet-400 animate-spin" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl text-xs text-zinc-600" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Lock size={11} className="text-zinc-600 flex-shrink-0" />
            OAuth tokens are encrypted and stored securely.
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '알림' : 'Notifications'}</h3>
          <div className="space-y-4">
            {([
              ['email', ko ? '이메일 알림' : 'Email notifications', ko ? '업데이트를 이메일로 받습니다' : 'Receive updates by email'],
              ['push', ko ? '푸시 알림' : 'Push notifications', ko ? '브라우저 알림을 받습니다' : 'Receive browser notifications'],
              ['message', ko ? '메시지 알림' : 'Message notifications', ko ? '새 메시지를 알림으로 받습니다' : 'Get notified on new messages'],
            ] as const).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">{label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => void toggleNotification(key)}
                  className="w-10 h-6 rounded-full transition-all"
                  style={{ background: notifsState[key] ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${notifsState[key] ? '18px' : '2px'})` }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '개인정보' : 'Privacy'}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">{ko ? '이메일 표시' : 'Show email'}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{ko ? '프로필에 이메일을 표시합니다' : 'Display email on profile.'}</p>
              </div>
              <button
                onClick={async () => {
                  const next = !showEmail;
                  setShowEmail(next);
                  setPrivacy(prev => ({ ...prev, showEmail: next }));
                  await updateCurrentUser({ name: profileName, isEmailPublic: next });
                }}
                className="w-10 h-6 rounded-full transition-all"
                style={{ background: showEmail ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${showEmail ? '18px' : '2px'})` }} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <h3 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-4">{ko ? '위험 구역' : 'Danger zone'}</h3>
          <button className="flex items-center justify-between w-full text-sm text-red-400/70 hover:text-red-400 transition-colors">
            {ko ? '계정 삭제' : 'Delete account'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
