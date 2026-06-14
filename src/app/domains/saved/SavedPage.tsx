import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, Heart, Archive } from 'lucide-react';
import { listExploreUsers } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';

type SavedTab = 'saved' | 'liked' | 'archived';

type SavedItem = {
  id: string;
  name: string;
  role: string;
  pptxUrl?: string;
};

function officeViewerUrl(url?: string | null) {
  if (!url) return '';
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}

export default function SavedPage() {
  const navigate = useNavigate();
  const { language, savedCollections } = useApp();
  const ko = language === 'ko';
  const [tab, setTab] = useState<SavedTab>('saved');
  const [items, setItems] = useState<SavedItem[]>([]);

  useEffect(() => {
    let alive = true;
    void listExploreUsers()
      .then(rows => {
        if (alive) setItems(rows as SavedItem[]);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const ids = savedCollections[tab];
    return items.filter(item => ids.includes(item.id));
  }, [items, savedCollections, tab]);

  const tabs = [
    { key: 'saved' as const, label: ko ? '저장됨' : 'Saved', icon: Bookmark },
    { key: 'liked' as const, label: ko ? '좋아요' : 'Liked', icon: Heart },
    { key: 'archived' as const, label: ko ? '보관됨' : 'Archived', icon: Archive },
  ];

  return (
    <div className="min-h-full px-8 py-10" style={{ background: '#050505' }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap gap-2">
          {tabs.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
              style={{
                background: tab === item.key ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === item.key ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === item.key ? '#c4b5fd' : '#a1a1aa',
              }}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyStatePanel
            emoji="🔖"
            title={ko ? '저장된 항목이 없습니다' : 'No saved items'}
            description={ko ? '탐색에서 포트폴리오를 저장하면 여기에 표시됩니다.' : 'Saved portfolios from Explore will appear here.'}
            actionLabel={ko ? '탐색으로 이동' : 'Go to Explore'}
            onAction={() => navigate('/explore')}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(item => {
              const viewer = officeViewerUrl(item.pptxUrl);
              return (
                <button
                  key={`${tab}-${item.id}`}
                  type="button"
                  onClick={() => navigate(`/explore/${item.id}`)}
                  className="aspect-[16/9] overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
                >
                  {viewer ? (
                    <iframe title={item.name} src={viewer} loading="lazy" className="pointer-events-none h-full w-full bg-black" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/20 to-blue-500/15 text-sm text-zinc-500">
                      {item.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
