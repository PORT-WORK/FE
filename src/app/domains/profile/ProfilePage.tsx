import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Camera, Edit3, FileText, Figma, Github, LogOut, Plus, Trash2, X } from 'lucide-react';
import { fetchCurrentUser, logoutAccount, updateCurrentUser, type UserProfile } from '../../api/contentApi';
import { INTEGRATION_PROVIDER_KEYS, integrationProviderLabel, isIntegrationProviderKey, type IntegrationProviderKey } from '../../api/integrationProviders';
import { useApp } from '../../contexts/AppContext';

type CareerEntry = {
  company: string;
  role: string;
  period: string;
  desc: string;
};

type LinkKey = IntegrationProviderKey;

type LinkEntry = {
  key: LinkKey;
  label: string;
  url: string;
};

type ProfileExtras = {
  career: CareerEntry[];
  links: LinkEntry[];
  skills: string[];
};

const STORAGE_KEY = 'port-profile-extras';

const LINK_META: Record<LinkKey, { label: string; icon: ReactNode }> = {
  github: { label: integrationProviderLabel('github'), icon: <Github size={14} /> },
  notion: { label: integrationProviderLabel('notion'), icon: <FileText size={14} /> },
  figma: { label: integrationProviderLabel('figma'), icon: <Figma size={14} /> },
};

const DEFAULT_EXTRAS: ProfileExtras = {
  career: [],
  links: INTEGRATION_PROVIDER_KEYS.map(key => ({ key, label: LINK_META[key].label, url: '' })),
  skills: [],
};

function readExtras(): ProfileExtras {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EXTRAS;

    const parsed = JSON.parse(raw) as Partial<ProfileExtras>;
    const career = Array.isArray(parsed.career) ? parsed.career : [];
    const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
      const links = Array.isArray(parsed.links)
        ? parsed.links.map((item: Partial<LinkEntry>) => {
          const key: LinkKey = isIntegrationProviderKey(item.key) ? item.key : 'github';
          return {
            key,
            label: item.label || LINK_META[key].label,
            url: item.url || '',
          };
        })
      : DEFAULT_EXTRAS.links;

    return { career, links, skills };
  } catch {
    return DEFAULT_EXTRAS;
  }
}

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

  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [career, setCareer] = useState<CareerEntry[]>([]);
  const [links, setLinks] = useState<LinkEntry[]>(DEFAULT_EXTRAS.links);
  const [newCareer, setNewCareer] = useState<CareerEntry>({ company: '', role: '', period: '', desc: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;

    void fetchCurrentUser().then(profile => {
      if (!alive) return;
      setUser(profile);
      setAvatarDraft(profile.profileImageUrl);

      const extras = readExtras();
      setSkills(extras.skills);
      setCareer(extras.career);
      setLinks(extras.links);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skills, career, links }));
  }, [skills, career, links]);

  const displayName = user?.name || 'Profile';
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);

  const updateField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setUser(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const addSkill = () => {
    const next = newSkill.trim();
    if (!next || skills.includes(next)) return;
    setSkills(prev => [...prev, next]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(item => item !== skill));

  const addCareer = () => {
    if (!newCareer.company.trim() && !newCareer.role.trim() && !newCareer.period.trim() && !newCareer.desc.trim()) return;
    setCareer(prev => [...prev, { ...newCareer }]);
    setNewCareer({ company: '', role: '', period: '', desc: '' });
  };

  const updateCareer = (index: number, field: keyof CareerEntry, value: string) => {
    setCareer(prev => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const removeCareer = (index: number) => setCareer(prev => prev.filter((_, itemIndex) => itemIndex !== index));

  const updateLink = (key: LinkKey, value: string) => {
    setLinks(prev => prev.map(item => (item.key === key ? { ...item, url: value } : item)));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateCurrentUser({
        name: user.name?.trim() || 'PORT User',
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
      // ignore logout API failure and clear local session anyway
    } finally {
      logout();
      navigate('/', { replace: true });
    }
  };

  const fieldLabels: Array<[string, string, keyof UserProfile]> = [
    ['이름', 'Name', 'name'],
    ['위치', 'Location', 'location'],
    ['경력 연수', 'Career years', 'experienceYears'],
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
            {editing ? (saving ? (ko ? '저장 중...' : 'Saving...') : (ko ? '저장' : 'Save')) : (ko ? '편집' : 'Edit')}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        <div className="relative mb-6">
          <div className="h-32 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))' }}>
            {editing && (
              <button className="absolute top-2 right-2 p-2 rounded-lg bg-black/40 text-white">
                <Camera size={14} />
              </button>
            )}
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
                <button
                  onClick={() => setAvatarDraft(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-red-400"
                  style={{ border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <Trash2 size={12} />
                  {ko ? '사진 삭제' : 'Delete photo'}
                </button>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{ko ? '경력' : 'Career'}</h3>
              {editing && (
                <button onClick={addCareer} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-violet-300" style={{ border: '1px solid rgba(124,58,237,0.22)' }}>
                  <Plus size={12} />
                  {ko ? '추가' : 'Add'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {career.length === 0 && !editing && <p className="text-xs text-zinc-600">{ko ? '등록된 경력이 없습니다.' : 'No career entries yet.'}</p>}
              {career.map((item, index) => (
                <div key={`${item.company}-${index}`} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {editing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input value={item.company} onChange={e => updateCareer(index, 'company', e.target.value)} placeholder={ko ? '회사' : 'Company'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <input value={item.role} onChange={e => updateCareer(index, 'role', e.target.value)} placeholder={ko ? '직무' : 'Role'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <input value={item.period} onChange={e => updateCareer(index, 'period', e.target.value)} placeholder={ko ? '기간' : 'Period'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <button onClick={() => removeCareer(index)} className="px-3 py-2 rounded-xl text-xs text-red-400" style={{ border: '1px solid rgba(239,68,68,0.18)' }}>
                        {ko ? '삭제' : 'Remove'}
                      </button>
                      <textarea value={item.desc} onChange={e => updateCareer(index, 'desc', e.target.value)} rows={3} placeholder={ko ? '설명' : 'Description'} className="col-span-2 px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-white">{item.role || (ko ? '직무 없음' : 'No role')}</p>
                      <p className="text-xs text-zinc-500 mt-1">{item.company} · {item.period}</p>
                      <p className="text-xs text-zinc-600 mt-2 leading-relaxed">{item.desc}</p>
                    </>
                  )}
                </div>
              ))}

              {editing && (
                <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <input value={newCareer.company} onChange={e => setNewCareer(prev => ({ ...prev, company: e.target.value }))} placeholder={ko ? '회사' : 'Company'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <input value={newCareer.role} onChange={e => setNewCareer(prev => ({ ...prev, role: e.target.value }))} placeholder={ko ? '직무' : 'Role'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <input value={newCareer.period} onChange={e => setNewCareer(prev => ({ ...prev, period: e.target.value }))} placeholder={ko ? '기간' : 'Period'} className="px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button onClick={addCareer} className="px-3 py-2 rounded-xl text-xs text-violet-300" style={{ border: '1px solid rgba(124,58,237,0.22)' }}>
                    {ko ? '추가' : 'Add'}
                  </button>
                  <textarea value={newCareer.desc} onChange={e => setNewCareer(prev => ({ ...prev, desc: e.target.value }))} rows={3} placeholder={ko ? '설명' : 'Description'} className="col-span-2 px-3 py-2 rounded-xl text-sm text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '연결' : 'Connections'}</h3>
            <div className="space-y-3">
              {links.map(link => (
                <div key={link.key} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {LINK_META[link.key].icon}
                    </span>
                    <span>{link.label}</span>
                  </div>
                  {editing ? (
                    <input
                      value={link.url}
                      onChange={e => updateLink(link.key, e.target.value)}
                      placeholder={ko ? 'URL 입력' : 'Enter URL'}
                      className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <p className="text-xs text-zinc-600 break-all">{link.url || (ko ? '연결된 링크가 없습니다.' : 'No link yet.')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{ko ? '기술' : 'Skills'}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.length === 0 && !editing && <p className="text-xs text-zinc-600">{ko ? '등록된 기술이 없습니다.' : 'No skills yet.'}</p>}
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
                    placeholder={ko ? '기술 추가...' : 'Add skill...'}
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
        </div>
      </div>

      {logoutOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={() => setLogoutOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <p className="text-lg font-black text-white">{ko ? '로그아웃 하시겠습니까?' : 'Do you want to log out?'}</p>
            <p className="mt-2 text-sm text-zinc-600">{ko ? '확인하면 현재 세션이 종료되고 홈으로 돌아갑니다.' : 'This will end your session and return you to the home page.'}</p>
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
