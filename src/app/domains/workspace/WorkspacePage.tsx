import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import {
  deletePortfolioProject,
  listMyPortfolios,
  listPortfolioProjects,
  type PortfolioSummary,
  type ProjectItem,
} from '../../api/contentApi';
import ProjectCreateModal from './ui/ProjectCreateModal';
import { getLocalProjectListEventName, loadLocalProjectItems, removeLocalProjectItem } from './projectWriting';
import type { ProjectRole } from '../projectWriting';

function parseRole(value: string | null): ProjectRole | null {
  if (value === 'PM' || value === 'DEVELOPER') return value;
  return null;
}

function mergeProjects(serverProjects: ProjectItem[], localProjects: ProjectItem[]) {
  const map = new Map<number, ProjectItem>();
  [...serverProjects, ...localProjects].forEach(item => {
    const current = map.get(item.id);
    map.set(item.id, current ? { ...current, ...item, imageUrls: item.imageUrls?.length ? item.imageUrls : current.imageUrls } : item);
  });
  return Array.from(map.values()).sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
}

function ProjectCard({ project, onOpen, onDelete }: { project: ProjectItem; onOpen: () => void; onDelete: () => void }) {
  const thumbnail = project.thumbnailUrl || project.imageUrls?.[0] || '';

  return (
    <div
      className="group overflow-hidden rounded-[30px] border border-white/7 bg-white/[0.025] transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: '0 16px 50px rgba(0,0,0,0.18)' }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen();
          }
        }}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/6 bg-black/30">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/20 via-blue-500/15 to-cyan-400/10">
              <ImageIcon size={30} className="text-zinc-700" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-zinc-200 backdrop-blur">
              {project.role || 'DEVELOPER'}
            </span>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-base font-black text-white">{project.name}</p>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                void onDelete();
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 transition-colors hover:text-red-300"
            >
              <Trash2 size={10} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
      })
      .catch(() => {
        if (!alive) return;
        setPortfolios([]);
        setSelectedPortfolioId(null);
      });
    return () => {
      alive = false;
    };
  }, []);

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
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    void listPortfolioProjects(selectedPortfolioId)
      .then(items => {
        if (!alive) return;
        setProjects(items);
      })
      .catch(() => {
        if (!alive) return;
        setProjects([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedPortfolioId]);

  const visibleProjects = useMemo(() => {
    if (!selectedPortfolioId) return localProjects;
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
    const confirmed = window.confirm(ko ? '프로젝트를 삭제할까요?' : 'Delete this project?');
    if (!confirmed) return;
    try {
      if (project.portfolioId > 0) {
        await deletePortfolioProject(project.portfolioId, project.id);
        if (selectedPortfolioId === project.portfolioId) {
          const items = await listPortfolioProjects(project.portfolioId);
          setProjects(items);
        }
      }
      removeLocalProjectItem(project.id);
      setLocalProjects(loadLocalProjectItems());
      setError(null);
    } catch {
      setError(ko ? '프로젝트를 삭제하지 못했습니다.' : 'Failed to delete the project.');
    }
  };

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
            title={ko ? '프로젝트가 없습니다' : 'No projects yet'}
            description={ko ? '새 프로젝트를 만들어 문서를 작성해보세요.' : 'Create a project first to organize your writing.'}
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
            emoji="📁"
            title={ko ? '프로젝트가 없습니다' : 'No projects yet'}
            description={ko ? '새 프로젝트를 만들어 문서를 작성해보세요.' : 'Create a project first to organize your writing.'}
            actionLabel={ko ? '새 프로젝트' : 'New project'}
            onAction={openProjectCreate}
            accent="violet"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => {
                  const view = project.isSynced ? '&view=1' : '';
                  navigate(
                    `/project/editor?projectId=${project.id}&portfolioId=${project.portfolioId}&role=${project.role || 'DEVELOPER'}&name=${encodeURIComponent(project.name)}${view}`,
                  );
                }}
                onDelete={() => void deleteProject(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
