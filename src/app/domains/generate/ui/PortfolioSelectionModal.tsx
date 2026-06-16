import { useEffect, useMemo, useState } from 'react';
import { Check, GripVertical, Loader2, Sparkles, X } from 'lucide-react';
import { fetchPortfolioData, type PortfolioDataResponse } from '../../../api/contentApi';
import { loadLocalProjectItems } from '../../workspace/projectWriting';

type Selection = {
  portfolioId: number;
  projectIds: number[];
  articleIds: string[];
};

type Props = {
  open: boolean;
  portfolioId: number | null;
  onClose: () => void;
  onConfirm: (selection: Selection) => void;
};

function extractSummary(data: PortfolioDataResponse['projects'][number]) {
  return data.project.summary || data.documents
    .flatMap(item => item.blocks)
    .map(block => {
      const content = block.content && typeof block.content === 'object' ? Object.values(block.content).filter(Boolean).join(' ') : '';
      return content.trim();
    })
    .filter(Boolean)
    .join(' ');
}

function getProjectSeed(project: PortfolioDataResponse['projects'][number]['project']) {
  return [project.name, project.role, project.summary || '', Array.isArray(project.skills) ? project.skills.join(' ') : ''].join(' ').toLowerCase();
}

export default function PortfolioSelectionModal({ open, portfolioId, onClose, onConfirm }: Props) {
  const [portfolioData, setPortfolioData] = useState<PortfolioDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setPortfolioData(null);
    setLoading(false);
    setSelectedProjectIds([]);
    setDraggingId(null);
  }, [open, portfolioId]);

  useEffect(() => {
    if (!open || !portfolioId) return;

    let alive = true;
    setLoading(true);
    void fetchPortfolioData(portfolioId)
      .then(data => {
        if (alive) setPortfolioData(data);
      })
      .catch(() => {
        if (alive) setPortfolioData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, portfolioId]);

  const remoteProjects = portfolioData?.projects.map(item => ({
    ...item.project,
    summary: extractSummary(item),
  })) ?? [];

  const localProjects = useMemo(
    () => loadLocalProjectItems().filter(item => (portfolioId ? item.portfolioId === portfolioId : true)),
    [portfolioId],
  );

  const projects = remoteProjects.length > 0 ? remoteProjects : localProjects;

  const selectedProjects = useMemo(
    () => selectedProjectIds.map(id => projects.find(item => item.id === id)).filter(Boolean) as typeof projects,
    [projects, selectedProjectIds],
  );

  const availableProjects = useMemo(
    () => projects.filter(item => !selectedProjectIds.includes(item.id)),
    [projects, selectedProjectIds],
  );

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) return prev.filter(item => item !== projectId);
      return [...prev, projectId];
    });
  };

  const moveSelectedProject = (fromId: number, toId: number) => {
    setSelectedProjectIds(prev => {
      const fromIndex = prev.indexOf(fromId);
      const toIndex = prev.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromId);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[420] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-2xl shadow-black/50"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/6 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
              <Sparkles size={12} />
              프로젝트 선택
            </div>
            <h3 className="text-xl font-black text-white">프로젝트만 선택해서 PPTX로 보냅니다</h3>
            <p className="mt-1 text-sm text-zinc-500">
              게시글 선택은 제외하고, 프로젝트 순서만 정렬한 뒤 생성합니다.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-[640px] grid-cols-1 md:grid-cols-[1fr_360px]">
          <section className="border-r border-white/6 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.28em] text-cyan-300">PROJECT SELECTED</span>
              <span className="text-[10px] text-zinc-500">{loading ? '...' : projects.length}</span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
              {loading ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/6 bg-white/[0.02] text-sm text-zinc-500">
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  프로젝트를 불러오는 중...
                </div>
              ) : availableProjects.length === 0 ? (
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-400" style={{ border: '1px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.01)' }}>
                  선택 가능한 프로젝트가 없습니다.
                </div>
              ) : (
                availableProjects.map(project => {
                  const active = selectedProjectIds.includes(project.id);
                  return (
                    <button
                      key={project.id}
                      onClick={() => toggleProject(project.id)}
                      className="w-full rounded-2xl p-4 text-left transition-all duration-200"
                      style={{
                        background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white">
                          {active ? <Check size={14} className="text-emerald-300" /> : String(project.name || 'P').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                              <p className="mt-1 text-[11px] text-zinc-500">{project.role || 'DEVELOPER'}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{active ? 'Selected' : 'Available'}</span>
                          </div>
                          {project.summary && <p className="mt-3 line-clamp-2 text-xs leading-6 text-zinc-400">{project.summary}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="flex flex-col border-l border-white/6 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.28em] text-emerald-300">SELECTED</span>
              <span className="text-[10px] text-zinc-500">{selectedProjects.length}</span>
            </div>

            <div className="flex-1 rounded-[22px] p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <div className="space-y-2">
                {selectedProjects.length === 0 ? (
                  <div className="rounded-2xl p-4 text-center text-xs text-zinc-400" style={{ border: '1px dashed rgba(16,185,129,0.28)', background: 'rgba(255,255,255,0.01)' }}>
                    프로젝트를 선택하면 여기로 쌓입니다.
                  </div>
                ) : (
                  selectedProjects.map((project, index) => (
                    <button
                      key={project.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggingId(project.id)}
                      onDragEnd={() => setDraggingId(null)}
                      onDragOver={event => event.preventDefault()}
                      onDrop={event => {
                        event.preventDefault();
                        if (draggingId && draggingId !== project.id) moveSelectedProject(draggingId, project.id);
                        setDraggingId(null);
                      }}
                      onClick={() => toggleProject(project.id)}
                      className="w-full rounded-2xl p-3 text-left"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-300">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <GripVertical size={14} className="text-zinc-600" />
                            <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-500">{project.role || 'DEVELOPER'}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => {
                  if (!portfolioId || selectedProjectIds.length === 0) return;
                  onConfirm({
                    portfolioId,
                    projectIds: selectedProjectIds,
                    articleIds: [],
                  });
                }}
                disabled={!portfolioId || selectedProjectIds.length === 0}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.32)' }}
              >
                선택
              </button>
              <button
                onClick={onClose}
                className="rounded-2xl border border-white/8 px-4 py-3 text-sm font-semibold text-zinc-300"
              >
                닫기
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
