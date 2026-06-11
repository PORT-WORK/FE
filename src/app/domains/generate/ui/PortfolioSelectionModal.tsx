import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, FileText, Sparkles, X } from 'lucide-react';
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
    setSelectedProjectIds(prev => (
      prev.includes(projectId) ? prev.filter(item => item !== projectId) : [...prev, projectId]
    ));
    setSelectedArticleIds([]);
  };

  const toggleDocument = (documentId: number) => {
    const id = String(documentId);
    setSelectedArticleIds(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
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
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-[28px] overflow-hidden shadow-2xl"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-lg font-black text-white">포트폴리오 만들기</p>
            <p className="text-xs text-zinc-500 mt-1">프로젝트와 글을 선택한 뒤 AI 포트폴리오 생성 파이프라인으로 넘깁니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[260px_1fr_300px] gap-0 min-h-[640px]">
          <div className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Project</div>
              <span className="text-[10px] text-zinc-700">{loading ? 'Loading...' : `${projects.length}`}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[570px] pr-1">
              {projects.map(project => {
                const active = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors"
                    style={{
                      background: active ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(37,99,235,0.22)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {active ? <Check size={14} className="text-violet-300" /> : String(project.name).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{project.role || 'Project role'}</p>
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && !loading && (
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-700" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  프로젝트가 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Posts</div>
              <span className="text-[10px] text-zinc-700">{documents.length}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[570px] pr-1">
              {documents.map(item => {
                const id = String(item.document.id);
                const active = selectedArticleIds.includes(id);
                const order = selectedArticleIds.indexOf(id);
                const blockText = getDocumentContent(item.blocks);

                return (
                  <button
                    key={id}
                    onClick={() => toggleDocument(item.document.id)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors"
                    style={{
                      background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? 'rgba(124,58,237,0.20)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <FileText size={14} className={active ? 'text-violet-300' : 'text-zinc-500'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white leading-snug">{item.document.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 truncate">
                        {item.project.name}
                        {blockText ? ` · ${blockText.slice(0, 40)}` : ''}
                      </p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            moveDocument(item.document.id, -1);
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            moveDocument(item.document.id, 1);
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]"
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
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-700" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  선택 가능한 글이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 flex flex-col" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Selected</div>
              <span className="text-[10px] text-zinc-700">{selectedDocuments.length}</span>
            </div>

            <div className="flex-1 rounded-[22px] p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="space-y-2">
                {selectedDocuments.map((item, index) => (
                  <div key={String(item.document.id)} className="rounded-2xl p-3 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-violet-300" style={{ background: 'rgba(124,58,237,0.12)' }}>
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{item.document.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-1 truncate">{item.project.name}</p>
                    </div>
                  </div>
                ))}
                {selectedDocuments.length === 0 && (
                  <div className="rounded-2xl p-4 text-center text-xs text-zinc-700" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                    글을 선택하면 여기서 순서가 정리됩니다.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-violet-300" />
                <p className="text-xs font-semibold text-violet-300">AI pipeline</p>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                선택한 프로젝트와 글을 sourceText로 변환한 뒤 backend exportPortfolioPptx API로 PPTX를 생성합니다.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={confirm}
                disabled={!portfolioId || selectedArticleIds.length === 0}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.32)' }}
              >
                선택
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-zinc-400"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
