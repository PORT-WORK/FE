import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import { listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
import ProjectCreateModal from './ui/ProjectCreateModal';
import { getLocalProjectListEventName, loadLocalProjectItems } from './projectWriting';
import type { ProjectRole } from '../projectWriting';

function parseRole(value: string | null): ProjectRole | null {
  if (value === 'PM' || value === 'DEVELOPER') return value;
  return null;
}

function mergeProjects(primary: ProjectItem[], secondary: ProjectItem[]) {
  const map = new Map<number, ProjectItem>();
  [...secondary, ...primary].forEach(item => {
    map.set(item.id, item);
  });
  return Array.from(map.values()).sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();
  const ko = language === 'ko';

  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [localProjects, setLocalProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialRole, setInitialRole] = useState<ProjectRole>('DEVELOPER');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') !== '1') return;
    setInitialRole(parseRole(params.get('role')) ?? 'DEVELOPER');
    setModalOpen(true);
    navigate('/workspace', { replace: true });
  }, [location.search, navigate]);

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
        setError(ko ? '포트폴리오를 불러오지 못했습니다.' : 'Failed to load portfolios.');
      });

    return () => {
      alive = false;
    };
  }, [ko]);

  useEffect(() => {
    const refreshLocalProjects = () => setLocalProjects(loadLocalProjectItems());
    refreshLocalProjects();
    const eventName = getLocalProjectListEventName();
    window.addEventListener(eventName, refreshLocalProjects);
    window.addEventListener('storage', refreshLocalProjects);
    return () => {
      window.removeEventListener(eventName, refreshLocalProjects);
      window.removeEventListener('storage', refreshLocalProjects);
    };
  }, []);

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

  const visibleProjects = useMemo(() => {
    if (!selectedPortfolioId) {
      return localProjects;
    }
    return mergeProjects(
      projects.filter(item => item.portfolioId === selectedPortfolioId),
      localProjects.filter(item => item.portfolioId === selectedPortfolioId),
    );
  }, [localProjects, projects, selectedPortfolioId]);

  const openProjectCreate = () => {
    setError(null);
    setInitialRole('DEVELOPER');
    setModalOpen(true);
  };

  const emptyTitle = ko ? '프로젝트가 없습니다' : 'No projects yet';
  const emptyDescription = ko
    ? '새 프로젝트를 만들고 문서를 작성해보세요.'
    : 'Create a project first, then organize the documents that become a portfolio.';

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <ProjectCreateModal
        open={modalOpen}
        portfolioId={selectedPortfolioId}
        initialRole={initialRole}
        onClose={() => setModalOpen(false)}
        onCreated={project => {
          if (project.portfolioId === 0) {
            setLocalProjects(loadLocalProjectItems());
          } else if (selectedPortfolioId && project.portfolioId > 0) {
            void listPortfolioProjects(selectedPortfolioId).then(setProjects).catch(() => undefined);
          }
          setModalOpen(false);
          navigate(
            `/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}${project.portfolioId > 0 ? '' : '&draft=1'}`,
          );
        }}
      />

      <div className="mx-auto w-full max-w-7xl px-8 py-8">
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={openProjectCreate}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.28)' }}
          >
            <Plus size={15} />
            {ko ? '새 프로젝트' : 'New project'}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-3xl p-4 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        {!selectedPortfolio && portfolios.length === 0 && visibleProjects.length === 0 ? (
          <EmptyStatePanel
            emoji="🗂"
            title={emptyTitle}
            description={ko ? '프로젝트를 먼저 만들어 주세요.' : 'Create a project first to organize your writing.'}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            accent="blue"
          />
        ) : loading && Boolean(selectedPortfolioId) ? (
          <EmptyStatePanel
            emoji="⏳"
            title={ko ? '불러오는 중' : 'Loading'}
            description={ko ? '프로젝트 목록을 불러오고 있습니다.' : 'Loading your project data.'}
            accent="violet"
          />
        ) : visibleProjects.length === 0 ? (
          <EmptyStatePanel
            emoji="📝"
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            accent="violet"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleProjects.map(project => (
              <button
                key={project.id}
                onClick={() =>
                  navigate(
                    `/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}`,
                  )
                }
                className="overflow-hidden rounded-3xl text-left transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="h-28" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.12))' }} />
                <div className="p-5">
                  <p className="text-sm font-semibold text-white">{project.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{project.role || (ko ? '직무 없음' : 'No role yet')}</p>
                  <p className="mt-3 line-clamp-2 text-xs text-zinc-600">{project.summary || (ko ? '요약 없음' : 'No summary yet.')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
