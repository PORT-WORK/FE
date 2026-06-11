import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import { listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
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
        setError(ko ? '포트폴리오 데이터를 불러오지 못했습니다.' : 'Failed to load projects.');
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
        if (!alive) return;
        setProjects(items);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setProjects([]);
        setError(ko ? '프로젝트 데이터를 불러오지 못했습니다.' : 'Failed to load projects.');
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
    if (!selectedPortfolioId) {
      navigate('/portfolio');
      return;
    }
    setModalOpen(true);
  };

  const emptyTitle = ko ? '프로젝트가 없습니다' : 'No projects yet';
  const emptyDescription = ko
    ? '프로젝트를 만들면 안의 글을 모아 포트폴리오로 정리할 수 있습니다.'
    : 'Create a project first, then organize the posts that will become a portfolio.';

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <ProjectCreateModal
        open={modalOpen}
        portfolioId={selectedPortfolioId || 0}
        onClose={() => setModalOpen(false)}
        onCreated={project => {
          if (selectedPortfolioId) {
            void listPortfolioProjects(selectedPortfolioId).then(setProjects).catch(() => undefined);
          }
          setModalOpen(false);
          navigate(`/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}`);
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-8 py-8">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={openProjectCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.28)' }}
          >
            <Plus size={15} />
            {ko ? '새 프로젝트' : 'New project'}
          </button>
        </div>

        {error && (
          <div className="rounded-3xl p-4 mb-5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        {!selectedPortfolio || portfolios.length === 0 ? (
          <EmptyStatePanel
            emoji="🗂️"
            title={emptyTitle}
            description={ko ? '프로젝트를 만들 포트폴리오가 없습니다.' : 'There is no portfolio available for projects yet.'}
            actionLabel={ko ? '포트폴리오로 이동' : 'Go to portfolio'}
            onAction={() => navigate('/portfolio')}
            accent="blue"
          />
        ) : loading ? (
          <EmptyStatePanel
            emoji="⏳"
            title={ko ? '불러오는 중' : 'Loading'}
            description={ko ? '프로젝트를 불러오고 있습니다.' : 'Loading your project data.'}
            accent="violet"
          />
        ) : projects.length === 0 ? (
          <EmptyStatePanel
            emoji="📁"
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            accent="violet"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => navigate(`/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}`)}
                className="rounded-3xl text-left overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="h-28" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.12))' }} />
                <div className="p-5">
                  <p className="text-sm font-semibold text-white">{project.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{project.role || (ko ? '직무 없음' : 'No role yet')}</p>
                  <p className="text-xs text-zinc-600 mt-3 line-clamp-2">{project.summary || (ko ? '요약 없음' : 'No summary yet.')}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-600">
                    <span>{Array.isArray(project.skills) ? project.skills.join(' · ') : project.skills || (ko ? '기술 없음' : 'No skills')}</span>
                    <span className="inline-flex items-center gap-1 text-violet-300">
                      {ko ? '열기' : 'Open'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
