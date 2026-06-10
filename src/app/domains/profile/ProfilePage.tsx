import { useEffect, useMemo, useState } from 'react';
import { Camera, Edit3, ExternalLink, Figma, Github, Plus, X, BookOpen } from 'lucide-react';
import { fetchCurrentUser, updateCurrentUser, type UserProfile } from '../../api/contentApi';

const CAREER = [
  { company: 'Current company', role: 'Frontend Developer', period: '2022 - present', desc: 'Building React-based product experiences and maintaining a shared UI system.' },
  { company: 'Previous company', role: 'Web Developer', period: '2021 - 2022', desc: 'Migrated legacy views to React and improved release quality.' },
];

const DEFAULT_LINKS = [
  { icon: <Github size={14} />, label: 'GitHub', key: 'github' },
  { icon: <BookOpen size={14} />, label: 'Notion', key: 'notion' },
  { icon: <Figma size={14} />, label: 'Figma', key: 'figma' },
  { icon: <ExternalLink size={14} />, label: 'Blog', key: 'blog' },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Vite', 'Zustand', 'Tailwind CSS']);

  useEffect(() => {
    let alive = true;
    fetchCurrentUser().then(profile => {
      if (!alive) return;
      setUser(profile);
    });
    return () => {
      alive = false;
    };
  }, []);

  const displayName = user?.name || 'Profile';
  const initials = useMemo(() => displayName.slice(0, 1).toUpperCase(), [displayName]);

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill || skills.includes(skill)) return;
    setSkills(prev => [...prev, skill]);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(item => item !== skill));

  const saveProfile = async () => {
    if (!user) return;
    await updateCurrentUser({
      name: user.name,
      location: user.location,
      experienceYears: user.experienceYears,
      bio: user.bio,
      isEmailPublic: user.isEmailPublic,
    });
    setEditing(false);
  };

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <button
            onClick={() => {
              if (editing) void saveProfile();
              else setEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all"
            style={{ background: editing ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${editing ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, color: editing ? '#a78bfa' : '#a1a1aa' }}
          >
            <Edit3 size={13} />
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="h-32 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(37,99,235,0.3))' }}>
            {editing && <button className="absolute top-2 right-2 p-2 rounded-lg bg-black/40 text-white"><Camera size={14} /></button>}
          </div>
          <div className="absolute -bottom-6 left-6">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 0 3px #050505' }}>
              <div className="w-full h-full flex items-center justify-center text-xl font-black text-white">{initials}</div>
              {editing && <button className="absolute inset-0 bg-black/50 flex items-center justify-center"><Camera size={14} className="text-white" /></button>}
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-5">
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Basic info</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Name', user?.name || '', 'name'],
                ['Location', user?.location || '', 'location'],
                ['Career years', String(user?.experienceYears ?? ''), 'experienceYears'],
                ['Email', user?.email || '', 'email'],
              ].map(([label, value, key]) => (
                <div key={key as string}>
                  <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wider">{label}</p>
                  {editing ? (
                    <input
                      value={value as string}
                      onChange={e => setUser(prev => prev ? ({
                        ...prev,
                        [key as string]: key === 'experienceYears' ? Number(e.target.value || 0) : e.target.value,
                      }) : prev)}
                      className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  ) : (
                    <p className="text-sm text-zinc-300">{value as string}</p>
                  )}
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-[10px] text-zinc-600 mb-1.5 uppercase tracking-wider">Bio</p>
                {editing ? (
                  <textarea
                    value={user?.bio || ''}
                    onChange={e => setUser(prev => prev ? ({ ...prev, bio: e.target.value }) : prev)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm text-white rounded-xl focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                ) : (
                  <p className="text-sm text-zinc-400 leading-relaxed">{user?.bio || 'No bio yet.'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {skill}
                  {editing && <button onClick={() => removeSkill(skill)} className="text-zinc-600 hover:text-red-400 transition-colors"><X size={10} /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-1.5">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Add skill..." className="px-3 py-1.5 text-xs text-white rounded-xl focus:outline-none w-28" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button onClick={addSkill} className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-400 hover:bg-violet-500/10 transition-colors"><Plus size={13} /></button>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Career</h3>
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
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Links</h3>
            <div className="space-y-2.5">
              {DEFAULT_LINKS.map(link => (
                <div key={link.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-500" style={{ background: 'rgba(255,255,255,0.04)' }}>{link.icon}</div>
                  <span className="flex-1 text-xs text-zinc-500">Managed in backend integrations</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
