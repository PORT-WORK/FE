import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bookmark, Heart, MessageSquare, User } from 'lucide-react';
import {
  fetchPortfolioDetail,
  fetchPublicProfile,
  fetchPublicUserPortfolios,
  type PortfolioDetail,
  type PortfolioSummary,
  type PublicUserProfile,
} from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';
import { buildPptxTabUrl, buildPptxViewerUrl } from '../../utils/pptxViewer';

export default function ExploreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, followingIds, setFollowingIds, savedCollections, setSavedCollections } = useApp();
  const ko = language === 'ko';
  const userId = Number(id);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialPortfolioId = Number(searchParams.get('portfolioId') || 0);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialPortfolioId || null);
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);

  const selectedPortfolio = portfolios.find(item => item.id === selectedId) || null;
  const portfolioKey = selectedPortfolio ? `portfolio:${selectedPortfolio.id}` : initialPortfolioId ? `portfolio:${initialPortfolioId}` : '';
  const targetUserKey = String(userId);
  const following = followingIds.includes(targetUserKey);
  const saved = portfolioKey ? savedCollections.saved.includes(portfolioKey) : false;
  const liked = portfolioKey ? savedCollections.liked.includes(portfolioKey) : false;
  const archived = portfolioKey ? savedCollections.archived.includes(portfolioKey) : false;

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    let alive = true;

    Promise.all([
      fetchPublicProfile(userId),
      fetchPublicUserPortfolios(userId).catch(() => [] as PortfolioSummary[]),
    ]).then(([nextProfile, rows]) => {
      if (!alive) return;
      const publicRows = rows.filter(item => item.isPublic !== false);
      setProfile(nextProfile);
      setPortfolios(publicRows);
      const matchedId = initialPortfolioId && publicRows.some(item => item.id === initialPortfolioId)
        ? initialPortfolioId
        : publicRows[0]?.id ?? null;
      setSelectedId(matchedId);
    });

    return () => {
      alive = false;
    };
  }, [initialPortfolioId, userId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let alive = true;

    fetchPortfolioDetail(selectedId)
      .then(next => {
        if (alive) setDetail(next);
      })
      .catch(() => {
        if (alive) setDetail(null);
      });

    return () => {
      alive = false;
    };
  }, [selectedId]);

  const publicProfile = profile as
    | (PublicUserProfile & {
        githubUrl?: string | null;
        notionUrl?: string | null;
        figmaUrl?: string | null;
      })
    | null;

  const links = [
    { label: 'GitHub', url: publicProfile?.githubUrl },
    { label: 'Notion', url: publicProfile?.notionUrl },
    { label: 'Figma', url: publicProfile?.figmaUrl },
  ];

  const previewSource = {
    pdfUrl: detail?.pdfUrl || selectedPortfolio?.pdfUrl || null,
    pptxUrl: detail?.pptxUrl || selectedPortfolio?.pptxUrl || null,
  };
  const viewerUrl = useMemo(() => buildPptxViewerUrl(previewSource), [previewSource]);
  const openTabUrl = useMemo(() => buildPptxTabUrl(previewSource), [previewSource]);

  const toggleFollow = () => {
    setFollowingIds(prev => (prev.includes(targetUserKey) ? prev.filter(item => item !== targetUserKey) : [...prev, targetUserKey]));
  };

  const toggleCollection = (key: 'saved' | 'liked' | 'archived') => {
    if (!portfolioKey) return;
    setSavedCollections(prev => ({
      ...prev,
      [key]: prev[key].includes(portfolioKey) ? prev[key].filter(item => item !== portfolioKey) : [...prev[key], portfolioKey],
    }));
  };

  return (
    <div className="min-h-full overflow-y-auto px-6 py-6 lg:px-8" style={{ background: '#050505' }}>
      <div className="mx-auto max-w-[1420px] space-y-6">
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          {ko ? '탐색으로 돌아가기' : 'Back to explore'}
        </button>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
              <div className="h-28 bg-gradient-to-br from-violet-500/30 via-blue-500/20 to-cyan-400/10" />
              <div className="-mt-10 px-5 pb-5">
                <div className="flex items-end gap-3">
                  <div
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] ring-4 ring-[#050505]"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={26} className="text-white" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{ko ? '프로필' : 'Profile'}</p>
                    <h1 className="mt-2 text-xl font-black text-white">{profile?.name || '-'}</h1>
                    <p className="text-sm text-zinc-500">{profile?.location || '-'}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {profile?.bio || (ko ? '소개가 없습니다.' : 'No bio available.')}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {links.map(link => (
                    <button
                      key={link.label}
                      type="button"
                      disabled={!link.url}
                      onClick={() => link.url && window.open(link.url, '_blank', 'noopener,noreferrer')}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500">{link.label}</span>
                      {link.url ? (ko ? '연결됨' : 'Connected') : (ko ? '없음' : 'None')}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/messages?userId=${userId}`)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/[0.04]"
                  >
                    <MessageSquare size={14} />
                    {ko ? '메시지' : 'Message'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleFollow}
                    className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: following ? 'rgba(16,185,129,0.18)' : 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    {following ? (ko ? '팔로잉' : 'Following') : (ko ? '팔로우' : 'Follow')}
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <main className="space-y-4">
            <section className="rounded-[30px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{ko ? 'PDF 보기' : 'PDF viewer'}</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {detail?.title || (ko ? '포트폴리오를 선택하세요' : 'Select a portfolio')}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {detail?.jobRole || (ko ? '오른쪽 목록에서 PPT를 선택하면 표시됩니다.' : 'Pick a PPT from the list.')}
              </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="overflow-hidden rounded-[30px] border border-white/8 bg-black/30">
                {viewerUrl ? (
                  <div className="relative h-[680px] bg-[#070707]">
                    <iframe
                      key={viewerUrl}
                      src={viewerUrl}
                      title={detail?.title || 'PPT preview'}
                      className="h-full w-full"
                      allow="fullscreen"
                      loading="eager"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 py-4">
                      <div className="rounded-2xl border border-white/10 bg-black/55 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur">
                        {ko ? '실제 PDF 미리보기' : 'Live PDF preview'}
                      </div>
                      <a
                        href={openTabUrl || detail.pdfUrl || detail.pptxUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto rounded-2xl border border-white/10 bg-black/70 px-4 py-2 text-xs font-semibold text-zinc-100 shadow-lg backdrop-blur"
                      >
                        {ko ? '새 탭으로 열기' : 'Open in new tab'}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[680px] items-center justify-center text-center">
                    <div>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                        <Bookmark size={22} />
                      </div>
                      <p className="text-lg font-black text-white">{ko ? 'PDF 파일이 없습니다' : 'No PDF file'}</p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {ko ? 'pdfUrl이 있는 공개 포트폴리오만 표시됩니다.' : 'Only public portfolios with pdfUrl can be shown.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{ko ? '포트폴리오 목록' : 'Portfolios'}</p>
                  <div className="mt-3 grid gap-2">
                    {portfolios.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className="rounded-2xl border p-4 text-left"
                        style={{
                          background: item.id === selectedId ? 'rgba(124,58,237,0.13)' : 'rgba(255,255,255,0.025)',
                          borderColor: item.id === selectedId ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)',
                        }}
                      >
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.jobRole}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{detail?.title || (ko ? '선택한 포트폴리오' : 'Selected portfolio')}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {detail?.summary || (ko ? '선택한 PPT 정보를 확인합니다.' : 'Review selected PPT information.')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { key: 'saved' as const, active: saved, icon: Bookmark, label: ko ? '저장됨' : 'Saved' },
                      { key: 'liked' as const, active: liked, icon: Heart, label: ko ? '좋아요' : 'Like' },
                      { key: 'archived' as const, active: archived, icon: Bookmark, label: ko ? '보관됨' : 'Archived' },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleCollection(item.key)}
                        className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold"
                        style={{
                          background: item.active ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.03)',
                          borderColor: item.active ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)',
                          color: item.active ? '#c4b5fd' : '#e4e4e7',
                        }}
                      >
                        <item.icon size={13} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
