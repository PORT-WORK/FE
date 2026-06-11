import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
import ProjectCreateModal from './ui/ProjectCreateModal';

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <div
      className="w-full min-h-[560px] rounded-3xl p-10 flex flex-col items-center justify-center text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
      >
        <span className="text-2xl">🗂️</span>
      </div>
      <p className="text-lg font-semibold text-white mb-2">{title}</p>
      <p className="text-sm text-zinc-600 max-w-lg mx-auto">{description}</p>
      <button
        onClick={onAction}
        disabled={actionDisabled}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
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
        if (!alive) return;
        setProjects(items);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setProjects([]);
        setError(ko ? '프로젝트를 불러오지 못했습니다.' : 'Failed to load projects.');
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
    if (!selectedPortfolioId) return;
    setModalOpen(true);
  };

  const hasProjects = projects.length > 0;

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <ProjectCreateModal
        open={modalOpen}
        portfolioId={selectedPortfolioId || 0}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          if (selectedPortfolioId) {
            void listPortfolioProjects(selectedPortfolioId).then(setProjects).catch(() => undefined);
          }
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-8 py-8">
        {hasProjects && (
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={openProjectCreate}
              disabled={!selectedPortfolioId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.28)' }}
            >
              <Plus size={15} />
              {ko ? '새 프로젝트' : 'New project'}
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-3xl p-4 mb-5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        {!selectedPortfolio || portfolios.length === 0 ? (
          <EmptyState
            title={ko ? '프로젝트가 없습니다' : 'No projects yet'}
            description={ko ? '프로젝트를 만들 수 있는 포트폴리오가 없습니다. 먼저 포트폴리오를 생성해 주세요.' : 'There is no portfolio available to create projects yet.'}
            actionLabel={ko ? '포트폴리오로 이동' : 'Go to portfolio'}
            onAction={() => navigate('/portfolio')}
          />
        ) : loading ? (
          <EmptyState
            title={ko ? '불러오는 중...' : 'Loading...'}
            description={ko ? '프로젝트 데이터를 불러오고 있습니다.' : 'Loading project data.'}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            actionDisabled
          />
        ) : !hasProjects ? (
          <EmptyState
            title={ko ? '프로젝트가 없습니다' : 'No projects yet'}
            description={ko ? '프로젝트는 이 포트폴리오 안에서 만들 수 있습니다.' : 'Create a project inside this portfolio.'}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
          />
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
                  <p className="text-xs text-zinc-500 mt-1">{project.role || (ko ? '역할이 없습니다.' : 'No role yet')}</p>
                  <p className="text-xs text-zinc-600 mt-3 line-clamp-2">{project.summary || (ko ? '요약이 없습니다.' : 'No summary yet.')}</p>
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
