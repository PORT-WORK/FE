import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, FileText, Plus, Sparkles } from 'lucide-react';
import { listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';
import ProjectCreateModal from './ui/ProjectCreateModal';

function EmptyState({ title, description, actionLabel, onAction }: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <FileText size={24} className="text-violet-300" />
      </div>
      <p className="text-lg font-semibold text-white mb-2">{title}</p>
      <p className="text-sm text-zinc-600 max-w-md mx-auto">{description}</p>
      <button
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
      >
        <Plus size={15} />
        {actionLabel}
      </button>
    </div>
  );
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void listMyPortfolios()
      .then(items => {
        if (!alive) return;
        setPortfolios(items);
        setSelectedPortfolioId(items[0]?.id ?? null);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setPortfolios([]);
        setSelectedPortfolioId(null);
        setProjects([]);
        setError(ko ? '프로젝트를 불러오지 못했습니다.' : 'Failed to load projects.');
      });
    return () => {
      alive = false;
    };
  }, [ko]);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setProjects([]);
      return;
    }

    let alive = true;
    setLoading(true);
    void listPortfolioProjects(selectedPortfolioId)
      .then(items => {
        if (alive) {
          setProjects(items);
          setError(null);
        }
      })
      .catch(() => {
        if (alive) {
          setProjects([]);
          setError(ko ? '프로젝트 목록을 불러오지 못했습니다.' : 'Failed to load projects.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [ko, selectedPortfolioId]);

  const selectedPortfolio = useMemo(
    () => portfolios.find(item => item.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId],
  );

  const openProjectCreate = () => {
    if (portfolios.length === 0) return;
    setModalOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <ProjectCreateModal
        open={modalOpen}
        portfolioId={selectedPortfolioId || portfolios[0]?.id || 0}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          if (selectedPortfolioId) {
            void listPortfolioProjects(selectedPortfolioId).then(setProjects).catch(() => undefined);
          }
        }}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-end gap-3 mb-6">
          <button
            onClick={openProjectCreate}
            disabled={portfolios.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.28)' }}
          >
            <Plus size={15} />
            {ko ? '새 프로젝트' : 'New project'}
          </button>
        </div>

        <div className="grid grid-cols-[260px_1fr] gap-6">
          <aside className="rounded-3xl p-4 h-fit" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{ko ? '포트폴리오' : 'Portfolio'}</p>
            <div className="space-y-2">
              {portfolios.map(portfolio => {
                const active = portfolio.id === selectedPortfolioId;
                return (
                  <button
                    key={portfolio.id}
                    onClick={() => setSelectedPortfolioId(portfolio.id)}
                    className="w-full text-left rounded-2xl p-3 transition-colors"
                    style={{ background: active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    <p className="text-sm font-semibold text-white truncate">{portfolio.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">{portfolio.jobRole}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section>
            {error && (
              <div className="rounded-3xl p-4 mb-5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                {error}
              </div>
            )}

            {!selectedPortfolio || projects.length === 0 ? (
              <EmptyState
                title={ko ? '프로젝트가 없습니다' : 'No projects yet'}
                description={ko ? '새 프로젝트를 만들어 포트폴리오 안의 글을 정리하세요.' : 'Create a project to organize your posts inside the portfolio.'}
                actionLabel={ko ? '새 프로젝트' : 'New project'}
                onAction={openProjectCreate}
              />
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 mb-2">{ko ? '현재 프로젝트' : 'Current project'}</p>
                    <h2 className="text-2xl font-black text-white">{selectedPortfolio.title}</h2>
                  </div>
                  <button
                    onClick={() => navigate('/generate')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-violet-300"
                    style={{ border: '1px solid rgba(124,58,237,0.24)' }}
                  >
                    <Sparkles size={12} />
                    {ko ? '포트폴리오 제작' : 'Create portfolio'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(project => (
                    <button
                      key={project.id}
                      className="rounded-3xl text-left overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="h-28" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.12))' }} />
                      <div className="p-5">
                        <p className="text-sm font-semibold text-white">{project.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">{project.role || (ko ? '역할이 없습니다.' : 'No role yet')}</p>
                        <p className="text-xs text-zinc-600 mt-3 line-clamp-2">{project.summary || (ko ? '설명이 없습니다.' : 'No summary yet.')}</p>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600">
                          <span>{Array.isArray(project.skills) ? project.skills.join(' · ') : project.skills || (ko ? '기술 없음' : 'No skills')}</span>
                          <span className="inline-flex items-center gap-1 text-violet-300">
                            {ko ? '열기' : 'Open'}
                            <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
