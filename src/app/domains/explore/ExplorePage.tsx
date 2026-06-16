import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, SlidersHorizontal, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listExploreUsers } from '../../api/contentApi';

type ExploreUser = {
  id: string;
  userId: number;
  portfolioId?: number;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  likes: number;
  views: number;
  avatar: string;
  thumbnail: string;
  pptxUrl?: string;
  isPublic: boolean;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\uac00-\ud7a3]+/g, '');
}

function matchesStackValue(skill: string, target: string) {
  const aliases: Record<string, string[]> = {
    react: ['react'],
    reactnative: ['reactnative'],
    kotlin: ['kotlin'],
    swift: ['swift'],
    typescript: ['typescript', 'ts'],
    javascript: ['javascript', 'js'],
    java: ['java'],
    springboot: ['springboot', 'spring'],
    python: ['python'],
    nodejs: ['nodejs', 'node'],
    nextjs: ['nextjs', 'next'],
  };
  const canonical = (value: string) =>
    Object.entries(aliases).find(([, values]) => values.includes(normalizeText(value)))?.[0] || normalizeText(value);
  return canonical(skill) === canonical(target);
}

function SkeletonCard() {
  return <div className="aspect-[16/9] animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]" />;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { language, followingIds } = useApp();
  const ko = language === 'ko';

  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [activeRole, setActiveRole] = useState(ko ? '전체' : 'All');
  const [activeStack, setActiveStack] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [followOnly, setFollowOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const roleOptions = ko ? ['전체', '개발자', 'PM'] : ['All', 'Developer', 'PM'];
  const sortOptions = ko ? ['최신', '인기', '조회순'] : ['Latest', 'Popular', 'Most viewed'];
  const stackOptions = ['React', 'React Native', 'Kotlin', 'Swift', 'TypeScript', 'JavaScript', 'Java', 'Spring Boot', 'Python', 'Node.js', 'Next.js'];

  useEffect(() => {
    setActiveRole(ko ? '전체' : 'All');
  }, [ko]);

  useEffect(() => {
    if (followingIds.length === 0) setFollowOnly(false);
  }, [followingIds.length]);

  useEffect(() => {
    let alive = true;
    void listExploreUsers()
      .then(data => {
        if (alive) setUsers(data as ExploreUser[]);
      })
      .catch(() => {
        if (alive) setUsers([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const rows = users.filter(user => {
      if (!user.isPublic) return false;
      const role = normalizeText(user.role);
      const matchesRole =
        activeRole === (ko ? '전체' : 'All') ||
        role === normalizeText(activeRole) ||
        (activeRole === '개발자' && role === 'developer');
      const matchesStack = !activeStack || (user.skills || []).some(skill => matchesStackValue(skill, activeStack));
      const matchesFollow = !followOnly || followingIds.includes(String(user.userId));
      return matchesRole && matchesStack && matchesFollow;
    });
    const next = [...rows];
    if (sortIdx === 1) next.sort((a, b) => b.likes - a.likes);
    if (sortIdx === 2) next.sort((a, b) => (b.views || 0) - (a.views || 0));
    return next;
  }, [activeRole, activeStack, followOnly, followingIds, ko, sortIdx, users]);

  return (
    <div className="min-h-full px-8 py-8" style={{ background: '#050505' }} onClick={() => setSortOpen(false)}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-end gap-3">
          <button
            onClick={() => setFollowOnly(prev => !prev)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-all"
            style={{
              background: followOnly ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${followOnly ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`,
              color: followOnly ? '#a78bfa' : '#71717a',
            }}
          >
            <Users size={12} />
            {ko ? '팔로잉만' : 'Following only'}
          </button>

          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-zinc-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SlidersHorizontal size={12} />
              {sortOptions[sortIdx]}
              <ChevronDown size={11} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-xl">
                {sortOptions.map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortIdx(idx);
                      setSortOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {roleOptions.map(option => (
            <button
              key={option}
              onClick={() => setActiveRole(option)}
              className="rounded-full px-4 py-2 text-sm"
              style={{
                background: activeRole === option ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeRole === option ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: activeRole === option ? '#c4b5fd' : '#71717a',
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {stackOptions.map(option => (
            <button
              key={option}
              onClick={() => setActiveStack(prev => (prev === option ? '' : option))}
              className="rounded-full px-4 py-2 text-sm"
              style={{
                background: activeStack === option ? 'rgba(37,99,235,0.14)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeStack === option ? 'rgba(37,99,235,0.35)' : 'rgba(255,255,255,0.07)'}`,
                color: activeStack === option ? '#93c5fd' : '#71717a',
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <p className="mb-6 text-sm text-zinc-600">
          {sorted.length}
          {ko ? '개의 결과' : ' results'}
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, index) => <SkeletonCard key={index} />)
            : sorted.map(user => (
                <div
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      navigate(`/explore/${user.userId}?portfolioId=${user.portfolioId || ''}`);
                    }
                  }}
                  onClick={() => navigate(`/explore/${user.userId}?portfolioId=${user.portfolioId || ''}`)}
                  className="group aspect-[16/9] overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  aria-label={user.name}
                >
                  {user.thumbnail ? (
                    <img
                      src={user.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/25 to-blue-500/20 text-4xl font-black text-white/80">
                      PPT
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
