import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Filter, Plus, X } from 'lucide-react';
import { fetchPortfolioData, type PortfolioDataResponse, type PortfolioSummary } from '../../../api/contentApi';

type Selection = {
  portfolioId: number;
  projectIds: number[];
  categories: string[];
  articleIds: string[];
};

type Props = {
  open: boolean;
  portfolios: PortfolioSummary[];
  defaultPortfolioId: number | null;
  onClose: () => void;
  onConfirm: (selection: Selection) => void;
};

type CustomCategory = { id: string; value: string };

const uid = () => Math.random().toString(36).slice(2, 10);

function extractBlocksText(blocks: PortfolioDataResponse['projects'][number]['documents'][number]['blocks']) {
  return blocks
    .map(block => {
      const text = block.content && typeof block.content === 'object'
        ? Object.values(block.content).filter(Boolean).join(' ')
        : '';
      return text.trim();
    })
    .filter(Boolean)
    .join('\n');
}

export default function PortfolioSelectionModal({ open, portfolios, defaultPortfolioId, onClose, onConfirm }: Props) {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(defaultPortfolioId);
  const [portfolioData, setPortfolioData] = useState<PortfolioDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const firstPortfolioId = defaultPortfolioId ?? portfolios[0]?.id ?? null;
    setSelectedPortfolioId(firstPortfolioId);
    setSelectedProjectIds(new Set());
    setSelectedCategories([]);
    setCustomCategories([]);
    setNewCategory('');
    setSelectedArticleIds([]);
  }, [defaultPortfolioId, open, portfolios]);

  useEffect(() => {
    if (!open || !selectedPortfolioId) {
      setPortfolioData(null);
      return;
    }

    let alive = true;
    setLoading(true);
    fetchPortfolioData(selectedPortfolioId)
      .then(data => {
        if (!alive) return;
        setPortfolioData(data);
        const categories = Array.from(new Set(
          data.projects.flatMap(project =>
            project.documents.map(item => item.document.category).filter(Boolean),
          ),
        ));
        setSelectedCategories(prev => prev.length > 0 ? prev : categories.slice(0, 2));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, selectedPortfolioId]);

  const projects = portfolioData?.projects.map(item => item.project) || [];

  const documents = useMemo(() => {
    if (!portfolioData) return [];

    const selectedProjects = selectedProjectIds.size > 0
      ? new Set(Array.from(selectedProjectIds))
      : null;

    const allDocs = portfolioData.projects.flatMap(projectData =>
      projectData.documents.map(docData => ({
        project: projectData.project,
        document: docData.document,
        blocks: docData.blocks,
      })),
    );

    return allDocs.filter(item => {
      const matchesProject = selectedProjects ? selectedProjects.has(item.project.id) : true;
      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(item.document.category) : true;
      return matchesProject && matchesCategory;
    });
  }, [portfolioData, selectedCategories, selectedProjectIds]);

  const selectedDocuments = useMemo(
    () => documents.filter(item => selectedArticleIds.includes(String(item.document.id))),
    [documents, selectedArticleIds],
  );

  const allCategories = useMemo(() => {
    const base = portfolioData
      ? portfolioData.projects.flatMap(project =>
          project.documents.map(item => item.document.category).filter(Boolean),
        )
      : [];
    return Array.from(new Set([...base, ...customCategories.map(item => item.value).filter(Boolean)]));
  }, [customCategories, portfolioData]);

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => (
      prev.includes(category)
        ? prev.filter(item => item !== category)
        : [...prev, category]
    ));
  };

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    setCustomCategories(prev => [...prev, { id: uid(), value }]);
    setSelectedCategories(prev => (prev.includes(value) ? prev : [...prev, value]));
    setNewCategory('');
  };

  const updateCustomCategory = (id: string, value: string) => {
    setCustomCategories(prev => {
      const previous = prev.find(item => item.id === id)?.value || '';
      const next = prev.map(item => (item.id === id ? { ...item, value } : item));
      if (previous) {
        setSelectedCategories(current => current.map(category => (category === previous ? value : category)));
      }
      return next;
    });
  };

  const removeCustomCategory = (id: string) => {
    setCustomCategories(prev => {
      const next = prev.filter(item => item.id !== id);
      const removed = prev.find(item => item.id === id)?.value;
      if (removed) {
        setSelectedCategories(current => current.filter(item => item !== removed));
      }
      return next;
    });
  };

  const toggleDocument = (documentId: number) => {
    setSelectedArticleIds(prev => {
      const id = String(documentId);
      return prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
    });
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
    if (!selectedPortfolioId || selectedArticleIds.length === 0) return;
    onConfirm({
      portfolioId: selectedPortfolioId,
      projectIds: Array.from(selectedProjectIds),
      categories: selectedCategories,
      articleIds: selectedArticleIds,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div
        className="w-full max-w-6xl rounded-[28px] overflow-hidden shadow-2xl"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-lg font-black text-white">포트폴리오 만들기</p>
            <p className="text-xs text-zinc-500 mt-1">프로젝트, 분류, 게시글 순서를 한 번에 선택합니다.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[230px_230px_260px_1fr] gap-0 min-h-[640px]">
          <div className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600 mb-3">Portfolio</div>
            <div className="space-y-2">
              {portfolios.map(portfolio => {
                const active = portfolio.id === selectedPortfolioId;
                return (
                  <button
                    key={portfolio.id}
                    onClick={() => {
                      setSelectedPortfolioId(portfolio.id);
                      setSelectedProjectIds(new Set());
                      setSelectedCategories([]);
                      setCustomCategories([]);
                      setNewCategory('');
                      setSelectedArticleIds([]);
                    }}
                    className="w-full text-left rounded-2xl p-3 transition-colors"
                    style={{ background: active ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    <p className="text-sm font-semibold text-white truncate">{portfolio.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate">{portfolio.jobRole}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Project</div>
              <span className="text-[10px] text-zinc-700">{loading ? 'Loading...' : `${projects.length}`}</span>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[570px] pr-1">
              {projects.map(project => {
                const active = selectedProjectIds.has(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className="w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors"
                    style={{ background: active ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(37,99,235,0.22)' : 'rgba(255,255,255,0.06)'}` }}
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
              <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Category</div>
              <span className="text-[10px] text-zinc-700">{allCategories.length}</span>
            </div>
            <div className="space-y-2 mb-4">
              {allCategories.map(category => {
                const active = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs transition-colors"
                    style={{ background: active ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}`, color: active ? '#ddd6fe' : '#a1a1aa' }}
                  >
                    {active && <Check size={11} className="inline mr-1" />}
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-zinc-600 mb-3">
                <Filter size={11} />
                Custom
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="새 분류 추가"
                  className="flex-1 px-3 py-2 rounded-xl text-xs text-zinc-200 outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button onClick={addCategory} className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  <Plus size={12} />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {customCategories.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      value={item.value}
                      onChange={e => updateCustomCategory(item.id, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs text-zinc-200 outline-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <button onClick={() => removeCustomCategory(item.id)} className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-white/[0.04]">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {customCategories.length === 0 && (
                  <p className="text-[11px] text-zinc-700">필요한 분류를 직접 추가할 수 있습니다.</p>
                )}
              </div>
            </div>

            <div className="mt-4 text-[10px] text-zinc-600">
              선택된 분류는 한 번에 필터링되며, 고정 6분류 대신 실제 문서 기준으로 확장됩니다.
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
                return (
                  <div
                    key={id}
                    className="flex items-start gap-2 rounded-2xl p-3"
                    style={{ background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(124,58,237,0.20)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    <button onClick={() => toggleDocument(item.document.id)} className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: active ? '#7c3aed' : 'rgba(255,255,255,0.06)' }}>
                      {active && <Check size={11} className="text-white" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white leading-snug">{item.document.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 truncate">{item.document.category} · {item.project.name}</p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => moveDocument(item.document.id, -1)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moveDocument(item.document.id, 1)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]">
                          <ChevronDown size={12} />
                        </button>
                        <span className="text-[10px] text-violet-300 w-6 text-right">{order + 1}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {documents.length === 0 && !loading && (
                <div className="rounded-2xl p-4 text-center text-xs text-zinc-700" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  선택된 프로젝트와 분류에 해당하는 글이 없습니다.
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
                      <p className="text-[11px] text-zinc-500 mt-1 truncate">{item.document.category}</p>
                    </div>
                  </div>
                ))}
                {selectedDocuments.length === 0 && (
                  <div className="rounded-2xl p-4 text-center text-xs text-zinc-700" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                    게시글을 체크하면 여기서 순서가 정리됩니다.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <p className="text-xs font-semibold text-violet-300">AI pipeline</p>
              <p className="text-[11px] text-zinc-400 mt-1">선택한 프로젝트와 노션 글을 sourceText로 변환한 뒤 backend `exportPortfolioPptx` API로 PPTX를 생성합니다.</p>
            </div>

            <button
              onClick={confirm}
              disabled={!selectedPortfolioId || selectedArticleIds.length === 0}
              className="mt-4 w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.32)' }}
            >
              제작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
