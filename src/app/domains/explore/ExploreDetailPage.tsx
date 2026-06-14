import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Heart, Image as ImageIcon, LayoutGrid, MessageSquare, Sparkles, User } from 'lucide-react';
import { fetchPortfolioData, fetchPortfolioDetail, fetchPublicProfile, fetchPublicUserPortfolios, type PortfolioDataResponse, type PortfolioDetail, type PortfolioSummary, type PublicUserProfile } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';

type SlideCard = {
  title: string;
  subtitle: string;
  body: string[];
  accent: string;
};

function makeSlides(data: PortfolioDataResponse): SlideCard[] {
  const slides: SlideCard[] = [];
  slides.push({
    title: data.portfolio.title,
    subtitle: data.portfolio.jobRole || 'Portfolio',
    body: [
      data.portfolio.summary || 'No summary yet.',
      ...(data.portfolio.skills || []).map(skill => `# ${skill}`),
    ],
    accent: 'from-violet-500/25 via-blue-500/20 to-cyan-400/10',
  });

  data.projects.forEach((projectData, index) => {
    const docs = projectData.documents
      .map(item => item.document.title)
      .filter(Boolean)
      .slice(0, 5);
    slides.push({
      title: projectData.project.name,
      subtitle: projectData.project.role || `Project ${index + 1}`,
      body: [
        projectData.project.summary || 'No project summary.',
        ...docs.map(doc => `• ${doc}`),
      ],
      accent: index % 2 === 0 ? 'from-fuchsia-500/20 via-violet-500/15 to-indigo-500/10' : 'from-emerald-500/20 via-teal-500/15 to-cyan-500/10',
    });
  });

  if (slides.length === 0) {
    slides.push({
      title: 'No portfolio content',
      subtitle: 'Empty deck',
      body: ['The selected portfolio has no content yet.'],
      accent: 'from-zinc-500/15 via-zinc-400/10 to-zinc-300/5',
    });
  }

  return slides;
}

export default function ExploreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';
  const userId = Number(id);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [selectedPortfolioData, setSelectedPortfolioData] = useState<PortfolioDataResponse | null>(null);
  const [selectedPortfolioDetail, setSelectedPortfolioDetail] = useState<PortfolioDetail | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    let alive = true;

    Promise.all([
      fetchPublicProfile(userId),
      fetchPublicUserPortfolios(userId).catch(() => [] as PortfolioSummary[]),
    ])
      .then(([user, userPortfolios]) => {
        if (!alive) return;
        setProfile(user);
        setPortfolios(userPortfolios);
        setSelectedPortfolioId(userPortfolios[0]?.id ?? null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setSelectedPortfolioData(null);
      setSelectedPortfolioDetail(null);
      return;
    }
    let alive = true;
    setSlideIndex(0);
    Promise.all([
      fetchPortfolioDetail(selectedPortfolioId),
      fetchPortfolioData(selectedPortfolioId).catch(() => null),
    ])
      .then(([detail, data]) => {
        if (!alive) return;
        setSelectedPortfolioDetail(detail);
        setSelectedPortfolioData(data);
      })
      .catch(() => {
        if (!alive) return;
        setSelectedPortfolioDetail(null);
        setSelectedPortfolioData(null);
      });
    return () => {
      alive = false;
    };
  }, [selectedPortfolioId]);

  const slides = useMemo(() => {
    if (!selectedPortfolioData) return [];
    return makeSlides(selectedPortfolioData);
  }, [selectedPortfolioData]);

  useEffect(() => {
    if (slideIndex >= slides.length) {
      setSlideIndex(0);
    }
  }, [slideIndex, slides.length]);

  const currentSlide = slides[slideIndex] || null;
  const publicProfile = profile as (PublicUserProfile & {
    githubUrl?: string | null;
    notionUrl?: string | null;
    figmaUrl?: string | null;
  }) | null;
  const profileLinks = [
    { label: 'GitHub', url: publicProfile?.githubUrl || '' },
    { label: 'Notion', url: publicProfile?.notionUrl || '' },
    { label: 'Figma', url: publicProfile?.figmaUrl || '' },
  ];

  return (
    <div className="min-h-full overflow-y-auto px-6 py-6 lg:px-8" style={{ background: '#050505' }}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          {ko ? '탐색으로 돌아가기' : 'Back to explore'}
        </button>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
              <div className="h-28 bg-gradient-to-br from-violet-500/30 via-blue-500/20 to-cyan-400/10" />
              <div className="-mt-10 px-5 pb-5">
                <div className="flex items-end gap-3">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] ring-4 ring-[#050505]" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                    {profile?.profileImageUrl ? (
                      <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={26} className="text-white" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{ko ? '프로필' : 'Profile'}</p>
                    <h1 className="mt-2 text-xl font-black text-white">{profile?.name || (ko ? '불러오는 중...' : 'Loading...')}</h1>
                    <p className="text-sm text-zinc-500">{profile?.location || (ko ? '위치 정보 없음' : 'No location')}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">{profile?.bio || (ko ? '소개가 없습니다.' : 'No bio available.')}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {profileLinks.map(link => (
                    <button
                      key={link.label}
                      type="button"
                      disabled={!link.url}
                      onClick={() => link.url && window.open(link.url, '_blank', 'noopener,noreferrer')}
                      className="rounded-2xl border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        background: link.url ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                        borderColor: link.url ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{link.label}</p>
                      <p className="mt-1 truncate text-xs text-zinc-300">{link.url || (ko ? '연결 없음' : 'Not connected')}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/messages')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/8 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[0.04]"
                  >
                    <MessageSquare size={13} />
                    {ko ? '메세지' : 'Message'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowing(prev => !prev)}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white"
                    style={{ background: following ? 'rgba(16,185,129,0.16)' : 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    {following ? (ko ? '팔로잉' : 'Following') : (ko ? '팔로우' : 'Follow')}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{ko ? '포트폴리오' : 'Portfolios'}</p>
                    <p className="mt-2 text-lg font-black text-white">{portfolios.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{ko ? '경력' : 'Experience'}</p>
                    <p className="mt-2 text-lg font-black text-white">{profile?.experienceYears ?? 0}{ko ? '년' : 'y'}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{ko ? 'PPT 보기' : 'PPT viewer'}</p>
                  <h2 className="mt-2 text-[1.7rem] font-black text-white">{selectedPortfolioDetail?.title || (ko ? '포트폴리오를 선택하세요' : 'Select a portfolio')}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{selectedPortfolioDetail?.jobRole || (ko ? '오른쪽 목록에서 포트폴리오를 선택하면 슬라이드가 나타납니다.' : 'Choose a portfolio from the list to preview its slides.')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={slides.length === 0}
                    className="rounded-xl border border-white/8 p-2 text-zinc-400 transition-colors hover:bg-white/[0.04] disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setSlideIndex(prev => Math.min(Math.max(slides.length - 1, 0), prev + 1))}
                    disabled={slides.length === 0}
                    className="rounded-xl border border-white/8 p-2 text-zinc-400 transition-colors hover:bg-white/[0.04] disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/8 bg-white/[0.03] p-6">
              {currentSlide ? (
                <div className="grid min-h-[640px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className={`rounded-[28px] bg-gradient-to-br ${currentSlide.accent} p-6`} style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
                          <LayoutGrid size={12} />
                          {ko ? '슬라이드' : 'Slide'} {slideIndex + 1}
                        </div>
                        <h3 className="text-4xl font-black leading-tight text-white">{currentSlide.title}</h3>
                        <p className="mt-3 text-sm text-white/70">{currentSlide.subtitle}</p>
                      </div>
                      <div className="mt-10 space-y-3">
                        {currentSlide.body.map(line => (
                          <div key={line} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/85">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <ImageIcon size={14} className="text-blue-300" />
                        {ko ? '포트폴리오 목록' : 'Portfolio list'}
                      </div>
                      <div className="mt-4 grid gap-3">
                        {portfolios.map(item => {
                          const active = item.id === selectedPortfolioId;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedPortfolioId(item.id)}
                              className="rounded-2xl p-4 text-left transition-all"
                              style={{
                                background: active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${active ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.06)'}`,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">{item.title}</p>
                                  <p className="mt-1 text-xs text-zinc-500">{item.jobRole}</p>
                                </div>
                                {item.pptxUrl && <Sparkles size={14} className="text-violet-300" />}
                              </div>
                              {item.summary && <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500">{item.summary}</p>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{ko ? '선택된 포트폴리오' : 'Selected portfolio'}</p>
                        <span className="text-xs text-zinc-500">{slideIndex + 1} / {slides.length}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {selectedPortfolioDetail?.summary || (ko ? '선택된 PPT를 크게 확인할 수 있습니다.' : 'You can inspect the selected PPT in detail here.')}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSaved(prev => !prev)}
                          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                          style={{
                            background: saved ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.03)',
                            borderColor: saved ? 'rgba(16,185,129,0.24)' : 'rgba(255,255,255,0.08)',
                            color: saved ? '#6ee7b7' : '#e4e4e7',
                          }}
                        >
                          <Bookmark size={13} />
                          {ko ? '저장됨' : 'Saved'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLiked(prev => !prev)}
                          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                          style={{
                            background: liked ? 'rgba(239,68,68,0.14)' : 'rgba(255,255,255,0.03)',
                            borderColor: liked ? 'rgba(239,68,68,0.24)' : 'rgba(255,255,255,0.08)',
                            color: liked ? '#fca5a5' : '#e4e4e7',
                          }}
                        >
                          <Heart size={13} />
                          {ko ? '좋아요' : 'Like'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookmarked(prev => !prev)}
                          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-colors"
                          style={{
                            background: bookmarked ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.03)',
                            borderColor: bookmarked ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.08)',
                            color: bookmarked ? '#c4b5fd' : '#e4e4e7',
                          }}
                        >
                          <Bookmark size={13} />
                          {ko ? '보관됨' : 'Archive'}
                        </button>
                        <button
                          onClick={() => navigate('/messages')}
                          className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                        >
                          <MessageSquare size={14} className="mr-2 inline-block" />
                          {ko ? '메시지' : 'Message'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[640px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                      <Sparkles size={22} />
                    </div>
                    <p className="text-sm font-semibold text-white">{ko ? '포트폴리오를 선택하세요' : 'Select a portfolio'}</p>
                    <p className="mt-2 text-sm text-zinc-500">{ko ? '오른쪽에서 포트폴리오를 고르면 슬라이드가 표시됩니다.' : 'Pick a portfolio from the right panel to see its slides.'}</p>
                  </div>
                </div>
              )}
            </div>
          </main>

          <aside className="space-y-4">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <User size={14} className="text-violet-300" />
                {ko ? '프로필' : 'Profile'}
              </div>
              <div className="mt-4 overflow-hidden rounded-3xl border border-white/8 bg-black/20">
                <div className="h-24 bg-gradient-to-br from-violet-500/25 via-blue-500/20 to-cyan-500/10" />
                <div className="-mt-8 px-4 pb-4">
                  <div className="flex items-end gap-3">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#050505]" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      {profile?.profileImageUrl ? <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" /> : <User size={20} className="text-white" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-lg font-black text-white">{profile?.name || '-'}</p>
                      <p className="text-xs text-zinc-500">{profile?.email || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="text-zinc-500">{ko ? '직무' : 'Role'}</span>
                  <span className="text-zinc-200">{selectedPortfolioDetail?.jobRole || '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="text-zinc-500">{ko ? '공개' : 'Public'}</span>
                  <span className="text-zinc-200">{selectedPortfolioDetail?.isPublic ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="text-zinc-500">{ko ? '슬라이드 수' : 'Slides'}</span>
                  <span className="text-zinc-200">{slides.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
