import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronDown, SlidersHorizontal, X, Users, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listExploreUsers } from '../../api/contentApi';

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '');
}

function matchesStackValue(skill: string, target: string) {
  const s = normalizeText(skill);
  const t = normalizeText(target);
  if (s === t) return true;
  if (s.includes(t) || t.includes(s)) return true;
  const aliases: Record<string, string[]> = {
    reactnative: ['reactnative', 'reactnativeapp'],
    nextjs: ['nextjs', 'nextjsapp', 'next'],
    springboot: ['springboot', 'spring'],
    nodejs: ['nodejs', 'node'],
    typescript: ['typescript', 'ts'],
    javascript: ['javascript', 'js'],
  };
  return Object.entries(aliases).some(([key, arr]) => (key === s || arr.includes(s)) && (key === t || arr.includes(t)));
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="h-36" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 w-1/2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { t, privacy, language } = useApp();
  const ko = language === 'ko';
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState(ko ? '전체' : 'All');
  const [activeStack, setActiveStack] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [sortOpen, setSortOpen] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [followOnly, setFollowOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const roleOptions = ko ? ['전체', '개발자', 'PM'] : ['All', 'Developer', 'PM'];
  const sortOptions = ko ? ['최신', '인기', '조회순'] : ['Latest', 'Popular', 'Most Viewed'];
  const stackOptions = ['React', 'React Native', 'Kotlin', 'Swift', 'TypeScript', 'JavaScript', 'Java', 'Spring Boot', 'Python', 'Node.js', 'Next.js'];

  useEffect(() => {
    let alive = true;
    void listExploreUsers()
      .then(data => {
        if (alive) setUsers(data as any[]);
      })
      .catch(() => {
        if (alive) setUsers([]);
      });
    const timer = setTimeout(() => setLoading(false), 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    return users.filter(user => {
      if (!privacy.public && user.id === 'u1') return false;
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        (user.skills || []).some((skill: string) => skill.toLowerCase().includes(query));
      const matchesRole =
        activeRole === (ko ? '전체' : 'All') ||
        normalizeText(user.role).includes(normalizeText(activeRole));
      const matchesStack = !activeStack || (user.skills || []).some((skill: string) => matchesStackValue(skill, activeStack));
      const matchesFollow = !followOnly || ['e1', 'e2'].includes(user.id);
      return matchesSearch && matchesRole && matchesStack && matchesFollow;
    });
  }, [activeRole, activeStack, followOnly, ko, privacy.public, search, users]);

  const sorted = [...filtered];
  if (sortIdx === 1) sorted.sort((a, b) => b.likes - a.likes);
  if (sortIdx === 2) sorted.sort((a, b) => (b.views || 0) - (a.views || 0));

  return (
    <div className="min-h-full px-8 py-8" style={{ background: '#050505' }} onClick={() => setSortOpen(false)}>
      <div className="mx-auto mb-8 max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ko ? '이름, 직무, 기술로 검색...' : t('explore_search')}
              className="w-full rounded-xl py-2.5 pl-9 pr-9 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFollowOnly(prev => !prev)}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-all"
            style={{ background: followOnly ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${followOnly ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, color: followOnly ? '#a78bfa' : '#71717a' }}
          >
            <Users size={12} />
            {ko ? '팔로잉만' : 'Following only'}
          </button>

          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-zinc-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SlidersHorizontal size={12} />
              {sortOptions[sortIdx]}
              <ChevronDown size={11} className="text-zinc-600" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl shadow-xl" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                {sortOptions.map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortIdx(idx);
                      setSortOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-left text-xs transition-colors"
                    style={{ color: sortIdx === idx ? '#a78bfa' : '#a1a1aa', background: sortIdx === idx ? 'rgba(124,58,237,0.06)' : 'transparent' }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {roleOptions.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
              style={{ background: activeRole === role ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRole === role ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`, color: activeRole === role ? '#a78bfa' : '#71717a' }}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {stackOptions.map(stack => (
            <button
              key={stack}
              onClick={() => setActiveStack(activeStack === stack ? '' : stack)}
              className="rounded-xl px-3 py-1.5 text-xs transition-all"
              style={{ background: activeStack === stack ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeStack === stack ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.05)'}`, color: activeStack === stack ? '#60a5fa' : '#52525b' }}
            >
              {stack}
            </button>
          ))}
        </div>

        {!loading && <p className="text-xs text-zinc-600">{sorted.length} {ko ? '개의 결과' : t('explore_count')}</p>}
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
        ) : sorted.length === 0 ? (
          <div className="col-span-3 flex items-center justify-center py-20">
            <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Search size={24} className="text-violet-400" />
              </div>
              <p className="mb-2 text-lg font-semibold text-white">{ko ? '검색 결과가 없습니다' : 'No results found'}</p>
              <p className="mx-auto mb-6 max-w-sm text-sm text-zinc-600">{ko ? '다른 검색어를 입력하거나 필터를 초기화해 보세요.' : 'Try different keywords or reset filters.'}</p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveRole(ko ? '전체' : 'All');
                  setActiveStack('');
                  setFollowOnly(false);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                {ko ? '필터 초기화' : 'Reset filters'}
              </button>
            </div>
          </div>
        ) : (
          sorted.map(user => (
            <div
              key={user.id}
              onClick={() => navigate(`/explore/${user.id}`)}
              className="group cursor-pointer rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="relative h-36 overflow-hidden rounded-t-2xl">
                {user.thumbnail ? (
                  <img src={user.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.2))' }} />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3))' }} />
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full" style={{ boxShadow: '0 0 0 2px #070707, 0 0 0 3px rgba(124,58,237,0.3)' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover object-top" />
                    ) : (
                      <div className="h-full w-full" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.role}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1">
                  {(user.skills || []).slice(0, 3).map((skill: string) => (
                    <span key={skill} className="rounded-md border border-white/6 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-500">
                      {skill}
                    </span>
                  ))}
                  {(user.skills || []).length > 3 && (
                    <span className="rounded-md border border-white/4 bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-600">
                      +{user.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Eye size={11} />
                      {(user.views || 0).toLocaleString()}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setLiked(prev => {
                          const next = new Set(prev);
                          next.has(user.id) ? next.delete(user.id) : next.add(user.id);
                          return next;
                        });
                      }}
                      className={`flex items-center gap-1 text-xs transition-all hover:scale-110 ${liked.has(user.id) ? 'text-red-400' : 'text-zinc-600 hover:text-zinc-300'}`}
                    >
                      {liked.has(user.id) ? (ko ? '좋아요 취소' : 'Liked') : (ko ? '좋아요' : 'Like')}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-600">{user.likes} likes</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
