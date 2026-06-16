import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import { deletePortfolioProject, listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';
import ProjectCreateModal from './ui/ProjectCreateModal';
import { getLocalProjectListEventName, loadLocalProjectItems, removeLocalProjectItem } from './projectWriting';
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

  const deleteProject = async (project: ProjectItem) => {
    const confirmed = window.confirm(ko ? '이 프로젝트를 삭제할까요?' : 'Delete this project?');
    if (!confirmed) return;
    try {
      if (project.portfolioId > 0) {
        await deletePortfolioProject(project.portfolioId, project.id);
        if (selectedPortfolioId === project.portfolioId) {
          const items = await listPortfolioProjects(project.portfolioId);
          setProjects(items);
        }
      } else {
        removeLocalProjectItem(project.id);
        setLocalProjects(loadLocalProjectItems());
      }
      setError(null);
    } catch {
      setError(ko ? '프로젝트를 삭제하지 못했습니다.' : 'Failed to delete the project.');
    }
  };

  const emptyTitle = ko ? '프로젝트가 없습니다' : 'No projects yet';
  const emptyDescription = ko
    ? '새 프로젝트를 만들어 문서를 작성해보세요.'
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

        {!selectedPortfolioId && portfolios.length === 0 && visibleProjects.length === 0 ? (
          <EmptyStatePanel
            emoji="🗂️"
            title={emptyTitle}
            description={ko ? '프로젝트를 먼저 만들어보세요.' : 'Create a project first to organize your writing.'}
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
            emoji="📄"
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            accent="violet"
          />
        ) : (
          <div className="space-y-3">
            {visibleProjects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-3xl px-5 py-4 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => {
                    const view = project.isSynced ? '&view=1' : '';
                    navigate(
                      `/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}${view}`,
                    );
                  }}
                  className="flex min-w-0 flex-1 items-start gap-4 text-left"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(37,99,235,0.25))' }}>
                    {project.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
                        {project.role || (ko ? '직무 없음' : 'No role')}
                      </span>
                      {project.isSynced && (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          {ko ? '완성 문서' : 'Final doc'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-600">{project.summary || (ko ? '요약 없음' : 'No summary yet.')}</p>
                    {project.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.skills.slice(0, 4).map(skill => (
                          <span key={skill} className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[10px] text-zinc-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={() => void deleteProject(project)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    aria-label="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
