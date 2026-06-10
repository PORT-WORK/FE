import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, FileText, Plus, Search, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  createPortfolioProject,
  fetchPortfolioDetail,
  listMyPortfolios,
  listPortfolioProjects,
  type PortfolioDetail,
  type PortfolioSummary,
  type ProjectItem,
} from '../../api/contentApi';

function ProjectModal({
  portfolioId,
  onClose,
  onCreate,
}: {
  portfolioId: number;
  onClose: () => void;
  onCreate: (project: ProjectItem) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await createPortfolioProject(portfolioId, { name: name.trim(), role, summary, skills });
      onCreate(created);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div>
            <p className="text-sm font-bold text-white">New project</p>
            <p className="text-xs text-zinc-600 mt-0.5">Create a project inside the selected portfolio.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-700 hover:text-zinc-400 rounded-xl transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Project title" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary" rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" className="w-full px-3 py-2.5 rounded-xl text-sm text-zinc-200 placeholder-zinc-700 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <div className="px-6 pb-6 flex items-center gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-zinc-500 transition-colors hover:text-zinc-300" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>Cancel</button>
          <button onClick={handleCreate} disabled={busy || !name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>Create</button>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [portfolioDetail, setPortfolioDetail] = useState<PortfolioDetail | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const items = await listMyPortfolios();
      if (!alive) return;
      setPortfolios(items);
      const first = items[0] || null;
      setSelectedPortfolioId(first ? first.id : null);
    };
    void load().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setPortfolioDetail(null);
      setProjects([]);
      return;
    }

    let alive = true;
    const loadPortfolio = async () => {
      const [detail, projectList] = await Promise.all([
        fetchPortfolioDetail(selectedPortfolioId),
        listPortfolioProjects(selectedPortfolioId),
      ]);
      if (!alive) return;
      setPortfolioDetail(detail);
      setProjects(projectList);
    };
    void loadPortfolio();
    return () => {
      alive = false;
    };
  }, [selectedPortfolioId]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.role.toLowerCase().includes(query) ||
      (project.summary || '').toLowerCase().includes(query) ||
      project.skills.some(skill => skill.toLowerCase().includes(query)),
    );
  }, [projects, search]);

  const handleCreateProject = (project: ProjectItem) => {
    setProjects(prev => [project, ...prev]);
  };

  const activePortfolio = portfolios.find(item => item.id === selectedPortfolioId) || null;

  return (
    <div className="h-full flex" style={{ background: '#050505' }}>
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
              <span>Portfolio</span>
              <ChevronRight size={10} />
              <span className="text-zinc-300">{activePortfolio?.title || 'My portfolios'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{portfolioDetail?.title || activePortfolio?.title || 'Portfolio'}</h2>
            <p className="text-xs text-zinc-600 mt-1">{portfolioDetail?.jobRole || activePortfolio?.jobRole || 'Select a portfolio to view its projects.'}</p>
          </div>
          <button
            onClick={() => setNewProjectOpen(true)}
            disabled={!selectedPortfolioId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            <Plus size={14} />
            {t('portfolio_new_project')}
          </button>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          <div className="rounded-2xl p-4 h-fit" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">My portfolios</p>
            <div className="space-y-2">
              {portfolios.map(portfolio => (
                <button
                  key={portfolio.id}
                  onClick={() => setSelectedPortfolioId(portfolio.id)}
                  className="w-full text-left rounded-xl p-3 transition-all"
                  style={{ background: selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.06)'}` }}
                >
                  <p className="text-sm font-medium text-zinc-100 truncate">{portfolio.title}</p>
                  <p className="text-xs text-zinc-600 mt-1 truncate">{portfolio.jobRole}</p>
                </button>
              ))}
              {!loading && portfolios.length === 0 && (
                <div className="rounded-xl p-4 text-xs text-zinc-600" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  No portfolios yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>
              <div className="text-xs text-zinc-600">{filteredProjects.length} projects</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 group"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="h-32 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <FileText size={28} />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white mb-0.5">{project.name}</p>
                        <p className="text-xs text-zinc-500">{project.role || 'Project'}</p>
                      </div>
                      <span className="text-[10px] text-zinc-600 mt-0.5">{project.isSynced ? 'synced' : 'draft'}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mb-3 line-clamp-2 leading-relaxed">{project.summary || 'No summary yet.'}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="px-2 py-0.5 text-[10px] text-zinc-500 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/portfolio/editor', { state: { portfolioId: selectedPortfolioId, projectId: project.id, article: { title: project.name, category: project.role || 'Project' } } })}
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Edit article
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && filteredProjects.length === 0 && (
                <div className="col-span-2 rounded-2xl p-8 text-center" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <FileText size={28} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm text-zinc-400 mb-1">No projects yet.</p>
                  <p className="text-xs text-zinc-700">Create one to start organizing source articles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {newProjectOpen && selectedPortfolioId !== null && (
        <ProjectModal portfolioId={selectedPortfolioId} onClose={() => setNewProjectOpen(false)} onCreate={handleCreateProject} />
      )}
    </div>
  );
}
