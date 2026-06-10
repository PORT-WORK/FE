import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, ChevronDown, SlidersHorizontal, X, Users, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listExploreUsers } from '../../api/contentApi';

const ROLES = ['All', 'Developer', 'Designer', 'PM', 'Data', 'Marketer', 'Founder'];
const STACKS = ['React', 'TypeScript', 'Figma', 'Python', 'Next.js', 'Node.js'];

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="h-36" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="p-4 space-y-3">
        <div className="h-4 rounded-full w-2/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
  const [activeRole, setActiveRole] = useState('All');
  const [activeStack, setActiveStack] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [sortOpen, setSortOpen] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [followOnly, setFollowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const sortOptions = ko ? ['최신순', '인기순', '조회순'] : ['Latest', 'Popular', 'Most Viewed'];

  useEffect(() => {
    let alive = true;
    void listExploreUsers().then(data => {
      if (alive) setUsers(data as any[]);
    });
    const timer = setTimeout(() => setLoading(false), 500);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const filtered = users.filter(user => {
    if (!privacy.public && user.id === 'u1') return false;
    const query = search.toLowerCase();
    const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.role.toLowerCase().includes(query) || (user.skills || []).some((skill: string) => skill.toLowerCase().includes(query));
    const matchesRole = activeRole === 'All' || user.role.toLowerCase().includes(activeRole.toLowerCase());
    const matchesStack = !activeStack || (user.skills || []).includes(activeStack);
    const matchesFollow = !followOnly || ['e1', 'e2'].includes(user.id);
    return matchesSearch && matchesRole && matchesStack && matchesFollow;
  });

  const sorted = [...filtered];
  if (sortIdx === 1) sorted.sort((a, b) => b.likes - a.likes);
  if (sortIdx === 2) sorted.sort((a, b) => (b.views || 0) - (a.views || 0));

  return (
    <div className="px-8 py-8" style={{ background: '#050505', minHeight: '100%' }} onClick={() => setSortOpen(false)}>
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ko ? '이름, 직무, 기술로 검색...' : t('explore_search')}
              className="w-full pl-9 pr-9 py-2.5 text-sm text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none"
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
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all flex-shrink-0"
            style={{ background: followOnly ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${followOnly ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, color: followOnly ? '#a78bfa' : '#71717a' }}
          >
            <Users size={12} />
            {ko ? '팔로잉만' : 'Following only'}
          </button>
          <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSortOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-zinc-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <SlidersHorizontal size={12} />
              {sortOptions[sortIdx]}
              <ChevronDown size={11} className="text-zinc-600" />
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}>
                {sortOptions.map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortIdx(idx);
                      setSortOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs transition-colors"
                    style={{ color: sortIdx === idx ? '#a78bfa' : '#a1a1aa', background: sortIdx === idx ? 'rgba(124,58,237,0.06)' : 'transparent' }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: activeRole === role ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeRole === role ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`, color: activeRole === role ? '#a78bfa' : '#71717a' }}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {STACKS.map(stack => (
            <button
              key={stack}
              onClick={() => setActiveStack(activeStack === stack ? '' : stack)}
              className="px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{ background: activeStack === stack ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeStack === stack ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.05)'}`, color: activeStack === stack ? '#60a5fa' : '#52525b' }}
            >
              {stack}
            </button>
          ))}
        </div>

        {!loading && <p className="text-xs text-zinc-600">{sorted.length} {ko ? '개의 포트폴리오' : t('explore_count')}</p>}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
        ) : sorted.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Search size={24} className="text-zinc-700" />
            </div>
            <p className="text-sm font-medium text-zinc-400 mb-1">{ko ? '검색 결과가 없습니다' : 'No results found'}</p>
            <p className="text-xs text-zinc-700 mb-5">{ko ? '다른 키워드를 사용하거나 필터를 초기화해보세요.' : 'Try different keywords or reset filters.'}</p>
            <button onClick={() => { setSearch(''); setActiveRole('All'); setActiveStack(''); setFollowOnly(false); }} className="px-4 py-2 rounded-xl text-xs font-medium transition-all" style={{ border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              {ko ? '필터 초기화' : 'Reset filters'}
            </button>
          </div>
        ) : (
          sorted.map(user => (
            <div key={user.id} onClick={() => navigate(`/explore/${user.id}`)} className="rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-36 overflow-hidden rounded-t-2xl relative">
                {user.thumbnail
                  ? <img src={user.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.2))' }} />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.3))' }} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ boxShadow: '0 0 0 2px #070707, 0 0 0 3px rgba(124,58,237,0.3)' }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="" className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.role}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(user.skills || []).slice(0, 3).map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 text-[10px] text-zinc-500 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {skill}
                    </span>
                  ))}
                  {(user.skills || []).length > 3 && <span className="px-2 py-0.5 text-[10px] text-zinc-600 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>+{user.skills.length - 3}</span>}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-zinc-600"><Eye size={11} />{(user.views || 0).toLocaleString()}</span>
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
                      {liked.has(user.id) ? 'Liked' : 'Like'}
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
