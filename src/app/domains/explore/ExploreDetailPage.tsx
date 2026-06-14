import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Briefcase, Image as ImageIcon, MessageSquare, Star } from 'lucide-react';
import { fetchPortfolioDetail, listPortfolioProjects, type PortfolioDetail, type ProjectItem } from '../../api/contentApi';

function splitSkills(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,/|·]/g)
    .map(item => item.trim())
    .filter(Boolean);
}

function formatPeriod(project: ProjectItem) {
  const start = project.startDate ? new Date(project.startDate).getFullYear() : '';
  const end = project.endDate ? new Date(project.endDate).getFullYear() : '';
  if (start && end) return `${start} - ${end}`;
  return start || end || 'Now';
}

export default function ExploreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const portfolioId = Number(id);
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!portfolioId || Number.isNaN(portfolioId)) return;
    let alive = true;

    Promise.all([
      fetchPortfolioDetail(portfolioId),
      listPortfolioProjects(portfolioId).catch(() => [] as ProjectItem[]),
    ])
      .then(([detail, projectRows]) => {
        if (!alive) return;
        setPortfolio(detail);
        setProjects(projectRows);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [portfolioId]);

  const skills = useMemo(() => splitSkills(portfolio?.skills), [portfolio?.skills]);

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/explore')} className="mb-5 flex items-center gap-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300">
          <ArrowLeft size={12} />
          Back to explore
        </button>

        <div className="overflow-hidden rounded-[28px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-56 bg-gradient-to-br from-violet-500/20 via-blue-500/15 to-cyan-400/10" />
          <div className="px-6 pb-6">
            <div className="-mt-14 flex items-end gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] ring-4 ring-[#050505]" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                {portfolio?.thumbnailUrl ? (
                  <img src={portfolio.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={34} className="text-white/90" />
                )}
              </div>
              <div className="pb-1">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Portfolio</p>
                <h1 className="mt-2 text-3xl font-black text-white">{loading ? 'Loading...' : portfolio?.title || 'Portfolio detail'}</h1>
                <p className="mt-1 text-sm text-zinc-500">{portfolio?.jobRole || 'Role not set'}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                  <Briefcase size={14} className="text-violet-400" />
                  프로젝트
                </div>
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/8 px-4 py-6 text-center text-sm text-zinc-600">
                      아직 프로젝트가 없습니다.
                    </div>
                  ) : (
                    projects.map(project => (
                      <div key={project.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{project.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{project.role} · {formatPeriod(project)}</p>
                          </div>
                          <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            {project.isSynced ? 'SYNCED' : 'LOCAL'}
                          </span>
                        </div>
                        {project.summary && <p className="mt-3 text-xs leading-6 text-zinc-500">{project.summary}</p>}
                        {project.skills?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {project.skills.map(skill => (
                              <span key={skill} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                    <ImageIcon size={14} className="text-blue-400" />
                    사진
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                    {portfolio?.thumbnailUrl ? (
                      <img src={portfolio.thumbnailUrl} alt="" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-zinc-600">대표 이미지 없음</div>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
                  <p className="mb-4 text-sm font-semibold text-white">정보</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">공개 여부</span>
                      <span className="text-zinc-300">{portfolio?.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">조회수</span>
                      <span className="text-zinc-300">{portfolio?.viewCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">좋아요</span>
                      <span className="text-zinc-300">{portfolio?.likeCount ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-500">저장</span>
                      <span className="text-zinc-300">{portfolio?.bookmarkCount ?? 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/messages')}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    <MessageSquare size={13} />
                    메시지
                  </button>
                </div>

                <div className="rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Star size={14} className="text-amber-400" />
                    기술 스택
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                      <span className="text-sm text-zinc-600">스택 정보가 없습니다.</span>
                    ) : skills.map(skill => (
                      <span key={skill} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {portfolio?.summary && (
              <div className="mt-4 rounded-[24px] border border-white/6 bg-white/[0.02] p-5">
                <p className="mb-2 text-sm font-semibold text-white">소개</p>
                <p className="text-sm leading-7 text-zinc-400">{portfolio.summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
