import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Bookmark, FolderKanban, Heart, Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import {
  fetchPortfolioData,
  fetchPortfolioDetail,
  listMyPortfolios,
  type PortfolioDataResponse,
  type PortfolioDetail,
  type PortfolioSummary,
} from '../../api/contentApi';

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
};

function MetricCard({ icon, label, value, accent }: MetricCardProps) {
  return (
    <div className="rounded-3xl p-5 min-h-[148px]" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <div className="rounded-xl p-2.5" style={{ background: `${accent}22`, color: accent }}>
          {icon}
        </div>
      </div>
      <p className="mt-8 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';

  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [portfolioDetail, setPortfolioDetail] = useState<PortfolioDetail | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const items = await listMyPortfolios();
      setPortfolios(items);
      setSelectedPortfolioId(prev => prev ?? items[0]?.id ?? null);
      setError(null);
    } catch {
      setPortfolios([]);
      setSelectedPortfolioId(null);
      setError(ko ? '분석 데이터를 불러오지 못했습니다.' : 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortfolios();
  }, [ko]);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setPortfolioDetail(null);
      setPortfolioData(null);
      return;
    }

    let alive = true;
    const loadSelectedPortfolio = async () => {
      setRefreshing(true);
      try {
        const [detail, data] = await Promise.all([
          fetchPortfolioDetail(selectedPortfolioId),
          fetchPortfolioData(selectedPortfolioId),
        ]);
        if (!alive) return;
        setPortfolioDetail(detail);
        setPortfolioData(data);
        setError(null);
      } catch {
        if (!alive) return;
        setPortfolioDetail(null);
        setPortfolioData(null);
        setError(ko ? '선택한 포트폴리오 분석을 불러오지 못했습니다.' : 'Failed to load the selected portfolio.');
      } finally {
        if (alive) setRefreshing(false);
      }
    };

    void loadSelectedPortfolio();

    return () => {
      alive = false;
    };
  }, [ko, selectedPortfolioId]);

  const stats = useMemo(() => {
    const projects = portfolioData?.projects ?? [];
    const documents = projects.flatMap(item => item.documents);
    const blocks = documents.reduce((acc, doc) => acc + (doc.blocks?.length || 0), 0);
    const topProject = projects
      .map(item => ({
        name: item.project.name,
        docCount: item.documents.length,
        blockCount: item.documents.reduce((count, doc) => count + (doc.blocks?.length || 0), 0),
      }))
      .sort((a, b) => b.docCount - a.docCount)[0];

    return {
      projectCount: projects.length,
      documentCount: documents.length,
      blockCount: blocks,
      topProject,
    };
  }, [portfolioData]);

  if (loading && portfolios.length === 0) {
    return (
      <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
        <div className="max-w-6xl mx-auto min-h-[520px] flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            {ko ? '분석 데이터를 불러오는 중...' : 'Loading analytics data...'}
          </div>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
        <div className="max-w-5xl mx-auto">
          <EmptyStatePanel
            emoji="📊"
            title={ko ? '분석할 포트폴리오가 없습니다' : 'No portfolios to analyze'}
            description={ko ? '포트폴리오를 만든 뒤 분석 수치가 표시됩니다.' : 'Create a portfolio first, then analytics will appear here.'}
            actionLabel={ko ? '포트폴리오로 이동' : 'Go to portfolio'}
            onAction={() => navigate('/portfolio')}
            accent="blue"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.35em] text-zinc-500">ANALYTICS</p>
            <h1 className="text-3xl font-black text-white mt-2">{ko ? '분석' : 'Analytics'}</h1>
            <p className="text-sm text-zinc-500 mt-2">{ko ? '포트폴리오별 조회, 좋아요, 북마크 현황을 실제 API로 불러옵니다.' : 'Portfolio views, likes, and bookmarks are loaded from real API data.'}</p>
          </div>
          <button
            onClick={() => void loadPortfolios()}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-300"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {ko ? '새로고침' : 'Refresh'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {portfolios.map(portfolio => (
            <button
              key={portfolio.id}
              onClick={() => setSelectedPortfolioId(portfolio.id)}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background: selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                color: selectedPortfolioId === portfolio.id ? '#ddd6fe' : '#a1a1aa',
                border: `1px solid ${selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {portfolio.title}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.16)' }}>
            {error}
          </div>
        )}

        {portfolioDetail && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard icon={<BarChart3 size={16} />} label={ko ? '조회수' : 'Views'} value={String(portfolioDetail.viewCount ?? 0)} accent="#7c3aed" />
              <MetricCard icon={<Heart size={16} />} label={ko ? '좋아요' : 'Likes'} value={String(portfolioDetail.likeCount ?? 0)} accent="#3b82f6" />
              <MetricCard icon={<Bookmark size={16} />} label={ko ? '저장됨' : 'Bookmarks'} value={String(portfolioDetail.bookmarkCount ?? 0)} accent="#22c55e" />
              <MetricCard icon={<FolderKanban size={16} />} label={ko ? '프로젝트' : 'Projects'} value={String(stats.projectCount)} accent="#f59e0b" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="rounded-[28px] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.28em] text-zinc-500">{ko ? '프로젝트별 구성' : 'Project breakdown'}</p>
                    <h2 className="text-lg font-bold text-white mt-2">{portfolioDetail.title}</h2>
                  </div>
                  {refreshing && <Loader2 size={16} className="animate-spin text-zinc-500" />}
                </div>
                <div className="mt-5 space-y-3">
                  {(portfolioData?.projects ?? []).map(item => {
                    const documentCount = item.documents.length;
                    const blockCount = item.documents.reduce((count, doc) => count + (doc.blocks?.length || 0), 0);
                    const ratio = stats.documentCount > 0 ? Math.max(12, Math.round((documentCount / stats.documentCount) * 100)) : 12;
                    return (
                      <div key={item.project.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.project.name}</p>
                            <p className="text-xs text-zinc-500 mt-1">{item.project.role}</p>
                          </div>
                          <span className="text-[10px] text-zinc-500">{documentCount} docs</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full" style={{ width: `${ratio}%`, background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>{ko ? '블록' : 'Blocks'} {blockCount}</span>
                          <span>{item.project.isSynced ? (ko ? '연동됨' : 'Synced') : (ko ? '미연동' : 'Not synced')}</span>
                        </div>
                      </div>
                    );
                  })}
                  {(portfolioData?.projects?.length ?? 0) === 0 && (
                    <div className="rounded-2xl p-5 text-center text-sm text-zinc-500" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {ko ? '프로젝트 데이터가 없습니다.' : 'No project data available.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs tracking-[0.28em] text-zinc-500">{ko ? '요약' : 'Summary'}</p>
                <h2 className="text-lg font-bold text-white mt-2">{ko ? '실제 API 기준 통계' : 'Live API stats'}</h2>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <Users size={15} className="text-violet-400" />
                      <span className="text-sm text-zinc-300">{ko ? '문서 수' : 'Documents'}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{stats.documentCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <BarChart3 size={15} className="text-blue-400" />
                      <span className="text-sm text-zinc-300">{ko ? '블록 수' : 'Blocks'}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{stats.blockCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <TrendingUp size={15} className="text-emerald-400" />
                      <span className="text-sm text-zinc-300">{ko ? '최다 문서 프로젝트' : 'Top project'}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{stats.topProject?.name || '-'}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-semibold text-white">{ko ? '포트폴리오 메타' : 'Portfolio meta'}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{ko ? '직무' : 'Role'}</dt>
                      <dd className="text-zinc-200">{portfolioDetail.jobRole || '-'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{ko ? '공개 여부' : 'Public'}</dt>
                      <dd className="text-zinc-200">{portfolioDetail.isPublic ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-zinc-500">{ko ? '슬라이드' : 'Slides'}</dt>
                      <dd className="text-zinc-200">{portfolioDetail.pptxUrl ? 'Available' : 'Not available'}</dd>
                    </div>
                  </dl>
                </div>

                <button
                  onClick={() => navigate('/portfolio')}
                  className="mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {ko ? '포트폴리오로 이동' : 'Go to portfolio'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
