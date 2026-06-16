import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, ExternalLink, Figma, FileText, Github, Loader2, Search, Sparkles, X } from 'lucide-react';
import {
  addFigmaFileSource,
  fetchIntegrationPreview,
  fetchIntegrationSources,
  type IntegrationPreview,
  type IntegrationSourceItem,
} from '../../../api/contentApi';
import { integrationProviderLabel, type IntegrationProviderKey } from '../../../api/integrationProviders';
import { useApp } from '../../../contexts/AppContext';

type Props = {
  open: boolean;
  initialProvider?: IntegrationProviderKey | null;
  initialSourceIds?: string[];
  onClose: () => void;
  onConfirm: (payload: {
    provider: IntegrationProviderKey;
    sourceIds: string[];
    sources: IntegrationSourceItem[];
    sourceSelections: Array<{ provider: IntegrationProviderKey; sourceIds: string[] }>;
  }) => void;
};

function collectText(value: unknown) {
  const seen = new WeakSet<object>();
  const chunks: string[] = [];

  const walk = (input: unknown, depth = 0) => {
    if (!input || depth > 4) return;
    if (typeof input === 'string') {
      const text = input.trim();
      if (text) chunks.push(text);
      return;
    }
    if (typeof input === 'number' || typeof input === 'boolean') {
      chunks.push(String(input));
      return;
    }
    if (Array.isArray(input)) {
      input.forEach(item => walk(item, depth + 1));
      return;
    }
    if (typeof input !== 'object') return;
    if (seen.has(input)) return;
    seen.add(input);

    const record = input as Record<string, unknown>;
    ['title', 'name', 'subtitle', 'description', 'summary', 'content', 'body', 'text', 'readme', 'markdown', 'note', 'value', 'plain_text', 'url'].forEach(
      key => {
        const next = record[key];
        if (typeof next === 'string') {
          const text = next.trim();
          if (text) chunks.push(text);
        }
      },
    );
    Object.values(record).forEach(item => walk(item, depth + 1));
  };

  walk(value);
  return Array.from(new Set(chunks)).join('\n');
}

function buildSourceExcerpt(item: IntegrationSourceItem) {
  const rawText = collectText(item.raw);
  const summary = [item.summary, rawText].filter(Boolean).join('\n').trim();
  if (summary) return summary;
  return item.tags.length ? `Tags: ${item.tags.join(', ')}` : '';
}

const PROVIDERS: Array<{
  key: IntegrationProviderKey;
  label: string;
  desc: string;
  icon: JSX.Element;
}> = [
  { key: 'github', label: 'GitHub', desc: 'Repository, README, Issue, PR, Release', icon: <Github size={16} /> },
  { key: 'notion', label: 'Notion', desc: 'Page, database, heading, block', icon: <FileText size={16} /> },
  { key: 'figma', label: 'Figma', desc: 'File, page, frame, section, node', icon: <Figma size={16} /> },
];

export default function ProjectSourceSelectionModal({ open, initialProvider = 'github', initialSourceIds = [], onClose, onConfirm }: Props) {
  const { connections, language } = useApp();
  const ko = language === 'ko';
  const [provider, setProvider] = useState<IntegrationProviderKey>(initialProvider);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<IntegrationSourceItem[]>([]);
  const [selectedByProvider, setSelectedByProvider] = useState<Record<IntegrationProviderKey, string[]>>({
    github: [],
    notion: [],
    figma: [],
  });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figmaModalOpen, setFigmaModalOpen] = useState(false);
  const [figmaFileUrl, setFigmaFileUrl] = useState('');
  const [figmaBusy, setFigmaBusy] = useState(false);
  const [figmaError, setFigmaError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<IntegrationSourceItem | null>(null);
  const [detailPreview, setDetailPreview] = useState<IntegrationPreview | null>(null);
  const [selectedOpen, setSelectedOpen] = useState(true);
  const cacheRef = useRef<Partial<Record<IntegrationProviderKey, IntegrationSourceItem[]>>>({});

  useEffect(() => {
    if (!open) return;
    setProvider(initialProvider);
    setQuery('');
    setError(null);
    setDetailOpen(false);
    setDetailPreview(null);
    setDetailItem(null);
    setDetailError(null);
    setSelectedOpen(true);
    setSelectedByProvider(prev => ({
      ...prev,
      [initialProvider]: initialSourceIds,
    }));
  }, [initialProvider, initialSourceIds, open]);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setError(null);

    const cached = cacheRef.current[provider];
    if (cached) {
      setItems(cached);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    setLoading(true);
    void fetchIntegrationSources(provider)
      .then(rows => {
        if (!alive) return;
        cacheRef.current[provider] = rows;
        setItems(rows);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setError(ko ? '연동된 자료를 불러오지 못했습니다.' : 'Failed to load connected sources.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [ko, open, provider]);

  const selectedIds = selectedByProvider[provider] || [];

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(item => [item.title, item.subtitle, item.summary, item.kind, item.tags.join(' ')].join(' ').toLowerCase().includes(keyword));
  }, [items, query]);

  const selectedItems = useMemo(
    () => selectedIds.map(id => items.find(item => item.resourceId === id)).filter(Boolean) as IntegrationSourceItem[],
    [items, selectedIds],
  );

  const allSelectedItems = useMemo(() => {
    return Object.entries(selectedByProvider).flatMap(([key, ids]) => {
      const providerKey = key as IntegrationProviderKey;
      const rows = cacheRef.current[providerKey] || (providerKey === provider ? items : []);
      return ids.map(id => rows.find(item => item.resourceId === id)).filter(Boolean) as IntegrationSourceItem[];
    });
  }, [items, provider, selectedByProvider]);

  const sourceSelections = useMemo(
    () =>
      Object.entries(selectedByProvider)
        .filter(([, ids]) => ids.length > 0)
        .map(([key, ids]) => ({ provider: key as IntegrationProviderKey, sourceIds: ids })),
    [selectedByProvider],
  );

  const toggleSelected = (resourceId: string) => {
    setSelectedByProvider(prev => {
      const current = prev[provider] || [];
      return {
        ...prev,
        [provider]: current.includes(resourceId) ? current.filter(item => item !== resourceId) : [...current, resourceId],
      };
    });
  };

  const openSourceDetail = async (item: IntegrationSourceItem) => {
    setDetailOpen(true);
    setDetailItem(item);
    setDetailLoading(true);
    setDetailError(null);
    setDetailPreview(null);

    try {
      const preview = await fetchIntegrationPreview(provider, item.resourceId);
      setDetailPreview(preview);
    } catch {
      setDetailError(ko ? '상세 내용을 불러오지 못했습니다.' : 'Failed to load details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const addFigmaFile = async () => {
    const nextUrl = figmaFileUrl.trim();
    if (!nextUrl) {
      setFigmaError(ko ? 'Figma 파일 URL을 입력해주세요.' : 'Enter a Figma file URL.');
      return;
    }
    if (!/figma\.com\/(file|design)\//i.test(nextUrl)) {
      setFigmaError(ko ? 'Figma file/design URL만 사용할 수 있습니다.' : 'Use a Figma file/design URL.');
      return;
    }

    setFigmaBusy(true);
    setFigmaError(null);
    try {
      const rows = await addFigmaFileSource(nextUrl);
      cacheRef.current.figma = rows;
      if (provider === 'figma') setItems(rows);
      setFigmaFileUrl('');
      setFigmaModalOpen(false);
    } catch {
      setFigmaError(ko ? 'Figma 파일을 불러오지 못했습니다.' : 'Failed to load the Figma file.');
    } finally {
      setFigmaBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[420] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md" onClick={onClose}>
        <div
          className="w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-2xl shadow-black/50"
          style={{ maxHeight: 'calc(100vh - 3rem)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-white/6 px-6 py-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                <Sparkles size={12} />
                {ko ? '자료 선택' : 'Select sources'}
              </div>
              <h3 className="text-xl font-black text-white">{ko ? '프로젝트 초안을 위한 자료를 골라주세요' : 'Pick external sources for your project draft'}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {ko ? '탭을 바꿔도 선택은 유지됩니다. 상세 보기로 각 항목을 확인하세요.' : 'Selections stay when you switch providers. Use details to review each item.'}
              </p>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200">
              <X size={16} />
            </button>
          </div>

          <div className="grid h-full min-h-[680px] grid-cols-[250px_1fr]">
            <aside className="border-r border-white/6 p-4">
              <div className="max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto pr-1">
                {PROVIDERS.map(item => {
                  const active = provider === item.key;
                  const isConnected = Boolean(connections[item.key]);
                  const count = selectedByProvider[item.key]?.length || 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setProvider(item.key)}
                      className="w-full rounded-2xl p-4 text-left transition-all"
                      style={{
                        background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-200">{item.icon}</div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.label}</p>
                            <p className="text-xs text-zinc-500">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`text-[10px] font-semibold ${isConnected ? 'text-emerald-300' : 'text-zinc-600'}`}>
                          {isConnected ? (ko ? '연결됨' : 'Connected') : ko ? '연결 필요' : 'Not connected'}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600">
                        <span>{integrationProviderLabel(item.key)}</span>
                        <span>{count} selected</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={ko ? '자료 검색...' : 'Search sources...'}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] py-3 pl-9 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-700"
                  />
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">{loading ? '...' : filtered.length}</div>
                {provider === 'figma' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFigmaError(null);
                      setFigmaModalOpen(true);
                    }}
                    className="rounded-2xl px-4 py-3 text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    {ko ? 'Figma 파일 추가' : 'Add Figma file'}
                  </button>
                )}
              </div>

              <div className="mb-4 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500">
                <div className="flex items-center justify-between gap-3">
                  <span>{integrationProviderLabel(provider)}</span>
                  <span>{ko ? '항목을 눌러 선택하거나 해제하세요.' : 'Click a row to select or deselect.'}</span>
                </div>
              </div>

              {!Boolean(connections[provider]) && (
                <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {ko ? '먼저 설정에서 해당 서비스를 연결해주세요.' : 'Connect this provider in Settings first.'}
                </div>
              )}

              <div className="max-h-[calc(100vh-24rem)] space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/6 bg-white/[0.02] text-sm text-zinc-500">
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {ko ? '자료를 불러오는 중...' : 'Loading sources...'}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-white/6 bg-white/[0.02] text-sm text-zinc-500">
                    {ko ? '표시할 자료가 없습니다.' : 'No sources to show.'}
                  </div>
                ) : (
                  filtered.map(item => {
                    const active = selectedIds.includes(item.resourceId);
                    return (
                      <div
                        key={item.resourceId}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleSelected(item.resourceId)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSelected(item.resourceId);
                          }
                        }}
                        className="w-full rounded-3xl p-4 text-left transition-all"
                        style={{
                          background: active ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-200">
                            {item.imageUrl && item.imageUrl.startsWith('http') ? (
                              <img src={item.imageUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                            ) : (
                              <span className="text-lg font-black">{item.title.slice(0, 1).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                                  <span>{item.subtitle}</span>
                                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                  <span className="uppercase tracking-[0.18em]">{item.kind}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {item.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-500">
                                    {tag}
                                  </span>
                                ))}
                                {active && <Check size={14} className="text-violet-300" />}
                              </div>
                            </div>
                            <p className="mt-3 line-clamp-4 whitespace-pre-line text-xs leading-6 text-zinc-400">{buildSourceExcerpt(item)}</p>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  void openSourceDetail(item);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-200 transition-colors hover:text-violet-100"
                              >
                                {ko ? '자세히 보기' : 'View details'}
                                <ExternalLink size={11} />
                              </button>
                              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                                {active ? (ko ? '선택됨' : 'Selected') : ko ? '선택 가능' : 'Available'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 rounded-[26px] border border-white/6 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setSelectedOpen(prev => !prev)} className="flex items-center gap-2 text-left">
                    {selectedOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                    <div>
                      <p className="text-sm font-semibold text-white">{ko ? '선택된 자료' : 'Selected items'}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {selectedItems.length} {ko ? '개 선택' : 'selected'}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfirm({ provider, sourceIds: selectedIds, sources: allSelectedItems, sourceSelections })}
                    disabled={sourceSelections.length === 0 || busy}
                    className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                  >
                    {busy ? (ko ? '처리 중...' : 'Applying...') : ko ? '확인' : 'Confirm'}
                  </button>
                </div>
                {selectedOpen && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedItems.length === 0 ? (
                      <span className="text-xs text-zinc-600">{ko ? '선택된 자료가 없습니다.' : 'No selected sources yet.'}</span>
                    ) : (
                      selectedItems.map(item => (
                        <button
                          key={item.resourceId}
                          type="button"
                          onClick={() => toggleSelected(item.resourceId)}
                          className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/8 px-3 py-1.5 text-xs text-violet-100"
                        >
                          {item.title}
                          <X
                            size={11}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedByProvider(prev => ({
                                ...prev,
                                [provider]: (prev[provider] || []).filter(id => id !== item.resourceId),
                              }));
                            }}
                          />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
            </main>
          </div>
        </div>

        {detailOpen && detailItem && (
          <div className="fixed inset-0 z-[435] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setDetailOpen(false)}>
            <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#101010] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{integrationProviderLabel(provider)}</p>
                  <h4 className="mt-2 truncate text-xl font-black text-white">{detailItem.title}</h4>
                  <p className="mt-2 text-sm text-zinc-500">{detailPreview?.subtitle || detailItem.subtitle || detailItem.kind}</p>
                </div>
                <button type="button" onClick={() => setDetailOpen(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_240px]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{ko ? '상세 내용' : 'Preview'}</p>
                  <div className="mt-3 max-h-[320px] overflow-y-auto whitespace-pre-line rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-7 text-zinc-200">
                    {detailLoading
                      ? ko
                        ? '상세 내용을 불러오는 중...'
                        : 'Loading details...'
                      : [
                          buildSourceExcerpt(detailItem),
                          typeof detailPreview?.description === 'string' ? detailPreview.description.trim() : '',
                          detailPreview?.raw ? JSON.stringify(detailPreview.raw, null, 2) : '',
                        ].filter(Boolean).join('\n\n')}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{ko ? '태그' : 'Tags'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(detailPreview?.tags?.length ? detailPreview.tags : detailItem.tags).map(tag => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-300">
                          {tag}
                        </span>
                      ))}
                      {(detailPreview?.tags?.length ?? detailItem.tags.length) === 0 && <span className="text-xs text-zinc-600">{ko ? '없음' : 'None'}</span>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">{ko ? '링크' : 'Link'}</p>
                    <a
                      href={detailPreview?.url || detailItem.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 transition-colors hover:text-violet-100"
                    >
                      {ko ? '원본 보기' : 'Open source'}
                      <ExternalLink size={12} />
                    </a>
                    {detailError && <p className="mt-3 text-xs text-red-300">{detailError}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {figmaModalOpen && (
          <div className="fixed inset-0 z-[440] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setFigmaModalOpen(false)}>
            <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#101010] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Figma</p>
                  <h4 className="mt-2 text-xl font-black text-white">{ko ? 'Figma 파일 추가' : 'Add Figma file'}</h4>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {ko ? 'Figma 파일 URL을 입력하면 해당 파일이 자료 목록에 추가됩니다.' : 'Paste a Figma file URL to add it as a selectable source.'}
                  </p>
                </div>
                <button type="button" onClick={() => setFigmaModalOpen(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">
                  <X size={16} />
                </button>
              </div>

              <input
                value={figmaFileUrl}
                onChange={event => setFigmaFileUrl(event.target.value)}
                placeholder={ko ? 'Figma 파일 URL을 입력하세요' : 'Paste a Figma file URL'}
                className="mt-5 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700"
              />

              {figmaError && <p className="mt-3 text-sm text-red-300">{figmaError}</p>}

              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setFigmaModalOpen(false)} className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300">
                  {ko ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={addFigmaFile}
                  disabled={figmaBusy}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {figmaBusy ? (ko ? '불러오는 중...' : 'Loading...') : ko ? '불러오기' : 'Load file'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
