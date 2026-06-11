import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, Camera, Edit3, Figma, Github, LogOut, Plus, Trash2, X } from 'lucide-react';
import { fetchCurrentUser, logoutAccount, updateCurrentUser, type UserProfile } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';

const CAREER: Array<{ company: string; role: string; period: string; desc: string }> = [];

const LINKS = [
  { icon: <Github size={14} />, label: 'GitHub', key: 'github' },
  { icon: <BookOpen size={14} />, label: 'Notion', key: 'notion' },
  { icon: <Figma size={14} />, label: 'Figma', key: 'figma' },
];

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, language } = useApp();
  const ko = language === 'ko';
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;

    void fetchCurrentUser().then(profile => {
      if (!alive) return;
      setUser(profile);
      setAvatarDraft(profile.profileImageUrl);
      setSkills(Array.isArray((profile as { skills?: string[] }).skills) ? ((profile as { skills?: string[] }).skills || []) : []);
    });

    return () => {
      alive = false;
    };
  }, []);

  const displayName = user?.name || 'Profile';
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);

  const updateField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setUser(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill || skills.includes(skill)) return;
    setSkills(prev => [...prev, skill]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(item => item !== skill));

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateCurrentUser({
        name: user.name,
        profileImageUrl: avatarDraft,
        location: user.location,
        experienceYears: user.experienceYears,
        bio: user.bio,
        isEmailPublic: user.isEmailPublic,
      });
      setUser(updated);
      setAvatarDraft(updated.profileImageUrl);
      setEditing(false);
    } catch {
      setError(ko ? '프로필 저장에 실패했습니다.' : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = async () => {
    try {
      await logoutAccount();
    } catch {
      // ignore logout API failures and clear the local session anyway
    } finally {
      logout();
      navigate('/', { replace: true });
    }
  };

  const fieldLabels: Array<[string, string, keyof UserProfile]> = [
    ['이름', 'Name', 'name'],
    ['지역', 'Location', 'location'],
    ['경력', 'Career years', 'experienceYears'],
    ['이메일', 'Email', 'email'],
  ];

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-end gap-2 mb-6">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5' }}
          >
            <LogOut size={13} />
            {ko ? '로그아웃' : 'Logout'}
          </button>
          <button
            onClick={() => {
              if (editing) void saveProfile();
              else setEditing(true);
            }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all disabled:opacity-60"
            style={{
              background: editing ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${editing ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`,
              color: editing ? '#a78bfa' : '#a1a1aa',
            }}
          >
            <Edit3 size={13} />
            {editing ? (saving ? (ko ? '저장 중' : 'Saving...') : (ko ? '저장' : 'Save')) : (ko ? '편집' : 'Edit')}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        <div className="relative mb-6">
          <div className="h-32 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))' }}>
            {editing && <button className="absolute top-2 right-2 p-2 rounded-lg bg-black/40 text-white"><Camera size={14} /></button>}
          </div>
          <div className="absolute -bottom-6 left-6">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 0 3px #050505' }}>
              {avatarDraft ? (
                <img src={avatarDraft} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black text-white">{initials}</div>
              )}
              {editing && (
                <button onClick={() => fileRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Camera size={14} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const next = await toDataUrl(file);
            setAvatarDraft(next);
            e.target.value = '';
          }}
        />

        <div className="mt-10 space-y-5">
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-2 gap-4">
              {fieldLabels.map(([koLabel, enLabel, key]) => {
                const value = user?.[key];
                const displayValue = key === 'experienceYears' ? String(value ?? '') : (value ?? '') as string;

                return (
                  <div key={String(key)}>
                    <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wider">{ko ? koLabel : enLabel}</p>
                    {editing ? (
                      <input
                        value={displayValue}
                        onChange={e =>
                          updateField(
                            key,
                            (key === 'experienceYears'
                              ? (e.target.value ? Number(e.target.value) : null)
                              : e.target.value) as UserProfile[typeof key],
                          )
                        }
                        className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    ) : (
                      <p className="text-sm text-zinc-300">{displayValue || (ko ? '없음' : 'None')}</p>
                    )}
                  </div>
                );
              })}

              <div className="col-span-2">
                <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wider">Bio</p>
                {editing ? (
                  <textarea
                    value={user?.bio || ''}
                    onChange={e => updateField('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ) : (
                  <p className="text-sm text-zinc-400 leading-relaxed">{user?.bio || (ko ? '소개가 없습니다.' : 'No bio yet.')}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => setAvatarDraft(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400" style={{ border: '1px solid rgba(239,68,68,0.18)' }}>
                  <Trash2 size={12} />
                  {ko ? '사진 삭제' : 'Delete photo'}
                </button>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '스킬' : 'Skills'}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.length === 0 && !editing && <p className="text-xs text-zinc-600">{ko ? '등록된 스킬이 없습니다.' : 'No skills yet.'}</p>}
              {skills.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {skill}
                  {editing && <button onClick={() => removeSkill(skill)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={10} /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-1.5">
                  <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder={ko ? '스킬 추가...' : 'Add skill...'}
                    className="px-3 py-1.5 text-xs text-white rounded-xl focus:outline-none w-28"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                  <button onClick={addSkill} className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400 hover:bg-violet-500/10 transition-colors">
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '경력' : 'Career'}</h3>
            {CAREER.length === 0 ? (
              <p className="text-xs text-zinc-600">{ko ? '등록된 경력이 없습니다.' : 'No career entries yet.'}</p>
            ) : (
              <div className="space-y-4">
                {CAREER.map((item, idx) => (
                  <div key={item.company} className="flex gap-4">
                    <div className="w-1.5 flex-shrink-0 flex flex-col items-center pt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      {idx < CAREER.length - 1 && <div className="flex-1 w-px mt-1" style={{ background: 'rgba(255,255,255,0.07)' }} />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-white">{item.role}</p>
                      <p className="text-xs text-zinc-500 mb-1">{item.company} · {item.period}</p>
                      <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '연결' : 'Links'}</h3>
            <div className="space-y-2.5">
              {LINKS.map(link => (
                <div key={link.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-500" style={{ background: 'rgba(255,255,255,0.04)' }}>{link.icon}</div>
                  <span className="flex-1 text-xs text-zinc-500">{link.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {logoutOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={() => setLogoutOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <p className="text-lg font-black text-white">{ko ? '로그아웃 하시겠습니까?' : 'Do you want to log out?'}</p>
            <p className="mt-2 text-sm text-zinc-600">{ko ? '확인하면 현재 세션을 종료하고 홈으로 돌아갑니다.' : 'This will end your session and return you to the home page.'}</p>
            <div className="mt-6 flex items-center gap-2">
              <button onClick={() => setLogoutOpen(false)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-zinc-300" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {ko ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  setLogoutOpen(false);
                  await confirmLogout();
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)' }}
              >
                {ko ? '확인' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
