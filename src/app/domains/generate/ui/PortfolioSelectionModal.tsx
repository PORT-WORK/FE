import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';
import { fetchPortfolioData, type PortfolioDataResponse } from '../../../api/contentApi';

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

function getDocumentContent(blocks: PortfolioDataResponse['projects'][number]['documents'][number]['blocks']) {
  return blocks
    .map(block => {
      const value = block.content && typeof block.content === 'object'
        ? Object.values(block.content).filter(Boolean).join(' ')
        : '';
      return value.trim();
    })
    .filter(Boolean)
    .join('\n');
}

const SECTION = {
  project: {
    title: 'PROJECT',
    accent: 'text-cyan-300',
    border: 'rgba(34,211,238,0.35)',
    bg: 'rgba(34,211,238,0.10)',
  },
  posts: {
    title: 'POSTS',
    accent: 'text-violet-300',
    border: 'rgba(124,58,237,0.35)',
    bg: 'rgba(124,58,237,0.10)',
  },
  selected: {
    title: 'SELECTED',
    accent: 'text-emerald-300',
    border: 'rgba(16,185,129,0.35)',
    bg: 'rgba(16,185,129,0.10)',
  },
} as const;

export default function PortfolioSelectionModal({ open, portfolioId, onClose, onConfirm }: Props) {
  const [portfolioData, setPortfolioData] = useState<PortfolioDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setPortfolioData(null);
    setLoading(false);
    setSelectedProjectIds([]);
    setSelectedArticleIds([]);
  }, [open, portfolioId]);

  useEffect(() => {
    if (!open || !portfolioId) return;

    let alive = true;
    setLoading(true);
    void fetchPortfolioData(portfolioId)
      .then(data => {
        if (!alive) return;
        setPortfolioData(data);
      })
      .catch(() => {
        if (!alive) return;
        setPortfolioData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, portfolioId]);

  const projects = portfolioData?.projects.map(item => item.project) ?? [];

  const documents = useMemo(() => {
    if (!portfolioData) return [];
    const allowedProjects = selectedProjectIds.length > 0 ? new Set(selectedProjectIds) : null;

    return portfolioData.projects.flatMap(projectData =>
      projectData.documents
        .filter(item => (allowedProjects ? allowedProjects.has(projectData.project.id) : true))
        .map(docData => ({
          project: projectData.project,
          document: docData.document,
          blocks: docData.blocks,
        })),
    );
  }, [portfolioData, selectedProjectIds]);

  const selectedDocuments = useMemo(
    () => selectedArticleIds.map(id => documents.find(item => String(item.document.id) === id)).filter(Boolean) as typeof documents,
    [documents, selectedArticleIds],
  );

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev => (prev.includes(projectId) ? prev.filter(item => item !== projectId) : [...prev, projectId]));
    setSelectedArticleIds([]);
  };

  const toggleDocument = (documentId: number) => {
    const id = String(documentId);
    setSelectedArticleIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const moveDocument = (documentId: number, direction: -1 | 1) => {
    const id = String(documentId);
    setSelectedArticleIds(prev => {
      const index = prev.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const confirm = () => {
    if (!portfolioId || selectedArticleIds.length === 0) return;
    onConfirm({
      portfolioId,
      projectIds: selectedProjectIds,
      articleIds: selectedArticleIds,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-[30px] overflow-hidden shadow-2xl"
        style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-7 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-lg font-black text-white">포트폴리오 만들기</p>
            <p className="text-xs text-zinc-500 mt-1">프로젝트와 글을 순서대로 골라 PPTX로 보낼 대상을 선택합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[280px_1fr_330px] gap-0 min-h-[660px]">
          <section className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(34,211,238,0.06), rgba(255,255,255,0.01))' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-[0.28em] ${SECTION.project.accent}`}>{SECTION.project.title}</span>
              <span className="text-[10px] text-zinc-500">{loading ? '...' : projects.length}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {projects.map(project => {
                const active = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all duration-200"
                    style={{
                      background: active ? SECTION.project.bg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? SECTION.project.border : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: active ? '0 0 0 1px rgba(34,211,238,0.08)' : 'none',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {active ? <Check size={14} className="text-cyan-300" /> : String(project.name).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{project.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{project.role || 'Project role'}</p>
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && !loading && (
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-400" style={{ border: `1px dashed ${SECTION.project.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  프로젝트가 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(124,58,237,0.06), rgba(255,255,255,0.01))' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-[0.28em] ${SECTION.posts.accent}`}>{SECTION.posts.title}</span>
              <span className="text-[10px] text-zinc-500">{documents.length}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {documents.map(item => {
                const id = String(item.document.id);
                const active = selectedArticleIds.includes(id);
                const order = selectedArticleIds.indexOf(id);
                const blockText = getDocumentContent(item.blocks);

                return (
                  <button
                    key={id}
                    onClick={() => toggleDocument(item.document.id)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-all duration-200"
                    style={{
                      background: active ? SECTION.posts.bg : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? SECTION.posts.border : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: active ? '0 0 0 1px rgba(124,58,237,0.08)' : 'none',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <FileText size={14} className={active ? 'text-violet-300' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white leading-snug">{item.document.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-1 truncate">
                        {item.project.name}
                        {blockText ? ` · ${blockText.slice(0, 60)}` : ''}
                      </p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            moveDocument(item.document.id, -1);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            moveDocument(item.document.id, 1);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <span className="text-[10px] text-violet-300 w-6 text-right">{order + 1}</span>
                      </div>
                    )}
                  </button>
                );
              })}
              {documents.length === 0 && !loading && (
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-400" style={{ border: `1px dashed ${SECTION.posts.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  선택 가능한 글이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section className="p-4 flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.06), rgba(255,255,255,0.01))' }}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] uppercase tracking-[0.28em] ${SECTION.selected.accent}`}>{SECTION.selected.title}</span>
              <span className="text-[10px] text-zinc-500">{selectedDocuments.length}</span>
            </div>

            <div className="flex-1 rounded-[22px] p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.22)', border: `1px solid ${SECTION.selected.border}` }}>
              <div className="space-y-2">
                {selectedDocuments.map((item, index) => (
                  <div key={String(item.document.id)} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${SECTION.selected.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-emerald-300" style={{ background: SECTION.selected.bg }}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{item.document.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 truncate">{item.project.name}</p>
                    </div>
                  </div>
                ))}
                {selectedDocuments.length === 0 && (
                  <div className="rounded-2xl p-4 text-center text-xs text-zinc-400" style={{ border: `1px dashed ${SECTION.selected.border}`, background: 'rgba(255,255,255,0.01)' }}>
                    글을 선택하면 여기 순서가 정리됩니다.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={confirm}
                disabled={!portfolioId || selectedArticleIds.length === 0}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.32)' }}
              >
                선택
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-300"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
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
