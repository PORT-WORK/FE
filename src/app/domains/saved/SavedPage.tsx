import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, ChevronDown, ExternalLink, Heart, Star } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listExploreUsers } from '../../api/contentApi';

const TABS = [
  { label: 'Saved' },
  { label: 'Liked' },
  { label: 'Archived' },
];

const SORT_OPTIONS = ['Latest', 'A-Z', 'Popular'];

export default function SavedPage() {
  const [tab, setTab] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';

  useEffect(() => {
    listExploreUsers().then(data => setItems(data.slice(0, tab === 2 ? 4 : tab === 1 ? 5 : 3)));
  }, [tab]);

  const displayItems = useMemo(() => {
    const next = [...items];
    if (sortIdx === 1) next.sort((a, b) => a.name.localeCompare(b.name));
    if (sortIdx === 2) next.sort((a, b) => b.likes - a.likes);
    return next;
  }, [items, sortIdx]);

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }} onClick={() => setSortOpen(false)}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-5">Saved</h2>
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map((item, idx) => (
              <button key={item.label} onClick={() => setTab(idx)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all" style={{ background: tab === idx ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === idx ? '#f4f4f5' : '#71717a' }}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSortOpen(prev => !prev)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {SORT_OPTIONS[sortIdx]}<ChevronDown size={11} className="text-zinc-600" />
            </button>
            {sortOpen && (
              <div className="absolute top-full right-0 mt-1 rounded-xl shadow-xl z-50 overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}>
                {SORT_OPTIONS.map((option, idx) => (
                  <button key={option} onClick={() => { setSortIdx(idx); setSortOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs transition-colors" style={{ color: sortIdx === idx ? '#a78bfa' : '#a1a1aa', background: sortIdx === idx ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                {tab === 0 ? <Bookmark size={32} className="text-violet-500 opacity-50" /> : tab === 1 ? <Heart size={32} className="text-red-500 opacity-50" /> : <Star size={32} className="text-yellow-500 opacity-50" />}
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-400 mb-1">{ko ? '저장된 항목이 없습니다' : 'No saved items yet.'}</p>
            <p className="text-xs text-zinc-700 mb-5">{ko ? '탐색에서 포트폴리오를 저장하면 여기 표시됩니다.' : 'Save a portfolio from Explore to see it here.'}</p>
            <button onClick={() => navigate('/explore')} className="px-5 py-2.5 rounded-xl text-xs font-medium text-violet-400 transition-all hover:bg-violet-500/10" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
              {ko ? '탐색으로 이동' : 'Go to Explore'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {displayItems.map(user => (
              <div key={user.id} className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => navigate(`/explore/${user.id}`)}>
                <div className="h-28 overflow-hidden relative">
                  <div className="w-full h-full flex items-center justify-center text-zinc-700" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Bookmark size={28} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{user.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tab === 1 && <Heart size={12} className="text-red-400 fill-red-400" />}
                      {tab === 0 && <Bookmark size={12} className="text-violet-400 fill-violet-400" />}
                      {tab === 2 && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(user.skills || []).slice(0, 3).map((skill: string) => <span key={skill} className="px-2 py-0.5 text-[10px] text-zinc-600 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{skill}</span>)}
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/explore/${user.id}`); }} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-violet-400 transition-colors">
                    <ExternalLink size={11} />View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
