import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, ExternalLink, Figma, FileText, Github, Loader2, Lock, Plus, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  connectIntegration,
  disconnectIntegration,
  fetchCurrentUser,
  fetchIntegrations,
  fetchSettings,
  updateCurrentUser,
  updateSettings,
  type IntegrationConnection,
} from '../../api/contentApi';

type ConnectState = 'idle' | 'connecting' | 'done';

const INTEGRATION_META = [
  { key: 'github', name: 'GitHub', desc: 'Repo and commit sync', icon: <Github size={16} /> },
  { key: 'notion', name: 'Notion', desc: 'Import documents and pages', icon: <FileText size={16} /> },
  { key: 'figma', name: 'Figma', desc: 'Bring in design files', icon: <Figma size={16} /> },
  { key: 'velog', name: 'Velog', desc: 'Sync blog posts', icon: <ExternalLink size={16} /> },
] as const;

export default function SettingsPage() {
  const { language, setLanguage, t, notifs, setNotifs, privacy, setPrivacy } = useApp();
  const [connectModal, setConnectModal] = useState<{ key: string; step: ConnectState; code: string; workspaceUrl: string } | null>(null);
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [integrationRows, setIntegrationRows] = useState<IntegrationConnection[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [settings, currentUser, rows] = await Promise.all([fetchSettings(), fetchCurrentUser(), fetchIntegrations()]);
      if (!alive) return;
      setLanguage(settings.language === 'EN' ? 'en' : 'ko');
      setNotifs({ email: settings.notiEmail, push: settings.notiPush, message: settings.notiMessage });
      setPrivacy(prev => ({ ...prev, showEmail: currentUser.isEmailPublic, public: prev.public }));
      setIntegrationRows(rows);
      const map: Record<string, boolean> = {};
      rows.forEach(row => {
        map[row.provider.toLowerCase()] = true;
      });
      setConnections(map);
    };
    void load();
    return () => {
      alive = false;
    };
  }, [setLanguage, setNotifs, setPrivacy]);

  const integration = useMemo(() => {
    return connectModal ? INTEGRATION_META.find(item => item.key === connectModal.key) ?? null : null;
  }, [connectModal]);

  const openConnect = (key: string) => {
    setConnectModal({ key, step: 'idle', code: '', workspaceUrl: '' });
    setDisconnectConfirm(null);
  };

  const startConnect = async () => {
    if (!connectModal) return;
    setConnectModal(prev => (prev ? { ...prev, step: 'connecting' } : null));
    setBusy(true);
    try {
      await connectIntegration(connectModal.key, connectModal.code || 'manual-code', connectModal.workspaceUrl || undefined);
      const rows = await fetchIntegrations();
      setIntegrationRows(rows);
      setConnections(prev => ({ ...prev, [connectModal.key]: true }));
      setConnectModal(prev => (prev ? { ...prev, step: 'done' } : null));
    } finally {
      setBusy(false);
    }
  };

  const confirmDisconnect = async (key: string) => {
    setBusy(true);
    try {
      await disconnectIntegration(key);
      const rows = await fetchIntegrations();
      setIntegrationRows(rows);
      setConnections(prev => ({ ...prev, [key]: false }));
      setDisconnectConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (patch: { language?: string; notiEmail?: boolean; notiPush?: boolean; notiMessage?: boolean }) => {
    await updateSettings(patch);
  };

  return (
    <div className="px-8 py-8" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <h2 className="text-xl font-bold text-white">{t('settings_title')}</h2>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{t('settings_lang')}</h3>
          <div className="flex gap-2">
            {([['ko', '한국어'], ['en', 'English']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={async () => {
                  setLanguage(key);
                  await saveSettings({ language: key.toUpperCase() });
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: language === key ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${language === key ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, color: language === key ? '#a78bfa' : '#71717a' }}
              >
                {language === key && <Check size={13} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Integrations</h3>
            <span className="text-[10px] text-zinc-600">{Object.values(connections).filter(Boolean).length} connected</span>
          </div>
          <div className="space-y-2">
            {INTEGRATION_META.map(item => {
              const connected = Boolean(connections[item.key]);
              return (
                <div key={item.key} className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-400" style={{ background: 'rgba(255,255,255,0.05)' }}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                    <p className="text-xs text-zinc-600">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {connected && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                        <span className="text-[10px] text-emerald-500">Connected</span>
                      </div>
                    )}
                    {connected
                      ? disconnectConfirm === item.key
                        ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => void confirmDisconnect(item.key)} className="text-[10px] px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">Remove</button>
                            <button onClick={() => setDisconnectConfirm(null)} className="text-[10px] px-2.5 py-1.5 rounded-lg text-zinc-600 hover:bg-white/[0.05] transition-all">Cancel</button>
                          </div>
                        )
                        : <button onClick={() => setDisconnectConfirm(item.key)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#71717a' }}>Disconnect</button>
                      : <button onClick={() => openConnect(item.key)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>Connect</button>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl text-xs text-zinc-600" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Lock size={11} className="text-zinc-600 flex-shrink-0" />
            OAuth tokens are encrypted and stored securely.
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{t('settings_notif')}</h3>
          <div className="space-y-4">
            {([
              ['email', t('settings_email_notif'), t('settings_email_desc')],
              ['push', t('settings_push_notif'), t('settings_push_desc')],
              ['message', t('settings_msg_notif'), t('settings_msg_desc')],
            ] as [keyof typeof notifs, string, string][]).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">{label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={async () => {
                    const next = { ...notifs, [key]: !notifs[key] };
                    setNotifs(next);
                    await saveSettings({ notiEmail: next.email, notiPush: next.push, notiMessage: next.message });
                  }}
                  className="w-10 h-6 rounded-full transition-all"
                  style={{ background: notifs[key] ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${notifs[key] ? '18px' : '2px'})` }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{t('settings_privacy')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">{t('settings_public_profile')}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{t('settings_public_desc')}</p>
              </div>
              <button onClick={() => setPrivacy({ ...privacy, public: !privacy.public })} className="w-10 h-6 rounded-full transition-all" style={{ background: privacy.public ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${privacy.public ? '18px' : '2px'})` }} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-300">Show email</p>
                <p className="text-xs text-zinc-600 mt-0.5">Display email on profile.</p>
              </div>
              <button
                onClick={async () => {
                  const next = !privacy.showEmail;
                  setPrivacy({ ...privacy, showEmail: next });
                  await updateCurrentUser({ isEmailPublic: next });
                }}
                className="w-10 h-6 rounded-full transition-all"
                style={{ background: privacy.showEmail ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: `translateX(${privacy.showEmail ? '18px' : '2px'})` }} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <h3 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-4">Danger zone</h3>
          <button className="flex items-center justify-between w-full text-sm text-red-400/70 hover:text-red-400 transition-colors">
            Delete account
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {connectModal && integration && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => connectModal.step !== 'connecting' && setConnectModal(null)}>
          <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>{integration.icon}</div>
                <div>
                  <p className="text-sm font-bold text-white">{integration.name} connection</p>
                  <p className="text-xs text-zinc-600">{integration.desc}</p>
                </div>
              </div>
              {connectModal.step !== 'connecting' && <button onClick={() => setConnectModal(null)} className="p-2 rounded-xl text-zinc-700 hover:text-zinc-400 transition-colors"><X size={15} /></button>}
            </div>

            <div className="p-6">
              {connectModal.step === 'idle' && (
                <>
                  <div className="space-y-2.5 mb-6">
                    <div className="text-xs text-zinc-500 mb-3">Enter the OAuth code and workspace URL returned by the provider.</div>
                    <div className="space-y-3">
                      <input
                        value={connectModal.code}
                        onChange={e => setConnectModal(prev => (prev ? { ...prev, code: e.target.value } : null))}
                        placeholder="Authorization code"
                        className="w-full px-3.5 py-2.5 text-sm text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                      <input
                        value={connectModal.workspaceUrl}
                        onChange={e => setConnectModal(prev => (prev ? { ...prev, workspaceUrl: e.target.value } : null))}
                        placeholder="Workspace URL"
                        className="w-full px-3.5 py-2.5 text-sm text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                  </div>
                  <button onClick={() => void startConnect()} disabled={busy} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>
                    Connect
                  </button>
                </>
              )}

              {connectModal.step === 'connecting' && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <Loader2 size={24} className="text-violet-500 animate-spin" />
                  <p className="text-sm font-semibold text-white">Connecting...</p>
                </div>
              )}

              {connectModal.step === 'done' && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <Check size={32} className="text-emerald-400" />
                  <p className="text-sm font-bold text-white">Connected successfully</p>
                  <button onClick={() => setConnectModal(null)} className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all mt-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
