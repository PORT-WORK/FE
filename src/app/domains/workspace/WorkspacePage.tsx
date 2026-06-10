import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, FileText, Plus, Sparkles } from 'lucide-react';
import { listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';
import ProjectCreateModal from './ui/ProjectCreateModal';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listMyPortfolios().then(items => {
      if (!alive) return;
      setPortfolios(items);
      setSelectedPortfolioId(items[0]?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setProjects([]);
      return;
    }
    let alive = true;
    setLoading(true);
    listPortfolioProjects(selectedPortfolioId).then(items => {
      if (alive) setProjects(items);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [selectedPortfolioId]);

  const selectedPortfolio = useMemo(() => portfolios.find(item => item.id === selectedPortfolioId) || null, [portfolios, selectedPortfolioId]);

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <ProjectCreateModal
        open={modalOpen}
        portfolioId={selectedPortfolioId || portfolios[0]?.id || 0}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          if (selectedPortfolioId) {
            void listPortfolioProjects(selectedPortfolioId).then(setProjects);
          }
        }}
      />

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs text-zinc-600 mb-2">{ko ? '프로젝트' : 'Project'}</p>
            <h1 className="text-3xl font-black text-white">{ko ? '내 프로젝트' : 'My projects'}</h1>
            <p className="text-sm text-zinc-600 mt-2">
              {ko
                ? '프로젝트를 만들고, 안의 게시글을 Notion처럼 관리합니다.'
                : 'Create projects and manage the notes inside them like Notion.'}
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600 mb-3">{ko ? '포트폴리오' : 'Portfolio'}</p>
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
            <div className="rounded-3xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-[0.22em]">{ko ? '현재 프로젝트' : 'Current portfolio'}</p>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedPortfolio?.title || (ko ? '선택된 포트폴리오가 없습니다' : 'No portfolio selected')}</h2>
                </div>
                <button
                  onClick={() => navigate('/generate')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-violet-300"
                  style={{ border: '1px solid rgba(124,58,237,0.24)' }}
                >
                  <Sparkles size={12} />
                  {ko ? '포트폴리오 만들기' : 'Build portfolio'}
                </button>
              </div>
              <p className="text-sm text-zinc-600">
                {ko
                  ? '프로젝트 안에 노션 글을 모아두고, AI 생성 단계에서 선택해 PPTX로 내보낼 수 있습니다.'
                  : 'Collect Notion-style posts inside each project, then export them to PPTX in the generation flow.'}
              </p>
            </div>

            {loading ? (
              <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm text-zinc-500">{ko ? '불러오는 중...' : 'Loading...'}</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <FileText size={24} className="text-violet-300" />
                </div>
                <p className="text-base font-semibold text-white">{ko ? '프로젝트가 없습니다' : 'No projects yet'}</p>
                <p className="text-sm text-zinc-600 mt-2">
                  {ko
                    ? '새 프로젝트를 만들어서 포트폴리오용 노션 글을 정리해보세요.'
                    : 'Create a project first, then organize the posts that will power your portfolio.'}
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  <Plus size={15} />
                  {ko ? '새 프로젝트' : 'New project'}
                </button>
              </div>
            ) : (
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
                      <p className="text-xs text-zinc-500 mt-1">{project.role || (ko ? '역할 없음' : 'No role yet')}</p>
                      <p className="text-xs text-zinc-600 mt-3 line-clamp-2">{project.summary || (ko ? '설명이 없습니다.' : 'No summary yet.')}</p>
                      <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600">
                        <span>{Array.isArray(project.skills) ? project.skills.join(' · ') : project.skills || 'No skills'}</span>
                        <span className="inline-flex items-center gap-1 text-violet-300">
                          {ko ? '열기' : 'Open'}
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
