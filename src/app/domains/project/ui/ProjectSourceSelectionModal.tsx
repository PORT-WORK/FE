import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Figma, FileText, Github, Loader2, Search, Sparkles, X } from 'lucide-react';
import { fetchIntegrationSources, type IntegrationSourceItem } from '../../../api/contentApi';
import { integrationProviderLabel, type IntegrationProviderKey } from '../../../api/integrationProviders';
import { useApp } from '../../../contexts/AppContext';

type Props = {
  open: boolean;
  initialProvider?: IntegrationProviderKey | null;
  initialSourceIds?: string[];
  onClose: () => void;
  onConfirm: (payload: { provider: IntegrationProviderKey; sourceIds: string[] }) => void;
};

const PROVIDERS: Array<{
  key: IntegrationProviderKey;
  label: string;
  desc: string;
  icon: JSX.Element;
}> = [
  { key: 'github', label: 'GitHub', desc: 'Repository, README, issue, PR, release', icon: <Github size={16} /> },
  { key: 'notion', label: 'Notion', desc: 'Page, database, heading, block', icon: <FileText size={16} /> },
  { key: 'figma', label: 'Figma', desc: 'File, page, frame, section, node', icon: <Figma size={16} /> },
];

export default function ProjectSourceSelectionModal({
  open,
  initialProvider = 'github',
  initialSourceIds = [],
  onClose,
  onConfirm,
}: Props) {
  const { connections, language } = useApp();
  const ko = language === 'ko';
  const [provider, setProvider] = useState<IntegrationProviderKey>(initialProvider);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<IntegrationSourceItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSourceIds);
  const [previewItem, setPreviewItem] = useState<IntegrationSourceItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<IntegrationProviderKey>(initialProvider);
  const cacheRef = useRef<Partial<Record<IntegrationProviderKey, IntegrationSourceItem[]>>>({});

  const connected = Boolean(connections[provider]);

  useEffect(() => {
    if (!open) return;
    setProvider(initialProvider);
    setSelectedIds(initialSourceIds);
    setQuery('');
    setPreviewItem(null);
    setError(null);
    providerRef.current = initialProvider;
  }, [initialProvider, initialSourceIds, open]);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    const cached = cacheRef.current[provider];
    const providerChanged = providerRef.current !== provider;
    providerRef.current = provider;
    setError(null);

    if (providerChanged) {
      setPreviewItem(null);
      setSelectedIds([]);
    }

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
        setError(ko ? '연동 자료를 불러오지 못했습니다.' : 'Failed to load connected sources.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [ko, open, provider]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(item =>
      [item.title, item.subtitle, item.summary, item.kind, item.tags.join(' ')].join(' ').toLowerCase().includes(keyword),
    );
  }, [items, query]);

  const selectedItems = useMemo(
    () => selectedIds.map(id => items.find(item => item.resourceId === id)).filter(Boolean) as IntegrationSourceItem[],
    [items, selectedIds],
  );

  const toggleSelected = (resourceId: string) => {
    setSelectedIds(prev => (prev.includes(resourceId) ? prev.filter(item => item !== resourceId) : [...prev, resourceId]));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[320] flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md" onClick={onClose}>
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
            <h3 className="text-xl font-black text-white">{ko ? '프로젝트에 사용할 자료를 고르세요' : 'Pick external sources for your project draft'}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {ko ? '카드를 눌러 미리보고, 미리보기 안에서 선택하세요.' : 'Open a card to preview it, then select it inside the preview.'}
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-200">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-xs text-zinc-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className={`text-[10px] font-semibold ${isConnected ? 'text-emerald-300' : 'text-zinc-600'}`}>
                        {isConnected ? (ko ? '연결됨' : 'Connected') : (ko ? '연결 필요' : 'Not connected')}
                      </div>
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
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-xs text-zinc-500">
                {loading ? '...' : filtered.length}
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-xs text-zinc-500">
              <div className="flex items-center justify-between gap-3">
                <span>{integrationProviderLabel(provider)}</span>
                <span>{ko ? '카드를 눌러 미리보기로 이동합니다.' : 'Click a card to open preview.'}</span>
              </div>
            </div>

            {!connected && (
              <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {ko ? '먼저 설정에서 이 연동을 연결해주세요.' : 'Connect this provider in Settings first.'}
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
                    <button
                      key={item.resourceId}
                      onClick={() => setPreviewItem(item)}
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
                          <p className="mt-3 line-clamp-2 text-xs leading-6 text-zinc-500">{item.summary}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-4 rounded-[26px] border border-white/6 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{ko ? '선택한 자료' : 'Selected items'}</p>
                  <p className="mt-1 text-xs text-zinc-500">{selectedItems.length} {ko ? '개 선택됨' : 'selected'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onConfirm({ provider, sourceIds: selectedIds })}
                  disabled={!connected || selectedIds.length === 0 || busy}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {busy ? (ko ? '전달 중...' : 'Applying...') : (ko ? '확인' : 'Confirm')}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItems.length === 0 ? (
                  <span className="text-xs text-zinc-600">{ko ? '선택된 자료가 없습니다.' : 'No selected sources yet.'}</span>
                ) : (
                  selectedItems.map(item => (
                    <button
                      key={item.resourceId}
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/8 px-3 py-1.5 text-xs text-violet-100"
                    >
                      {item.title}
                      <X size={11} onClick={e => { e.stopPropagation(); setSelectedIds(prev => prev.filter(id => id !== item.resourceId)); }} />
                    </button>
                  ))
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </main>
        </div>
      </div>

      {previewItem && (
        <div className="fixed inset-0 z-[340] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md" onClick={() => setPreviewItem(null)}>
          <div
            className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl shadow-black/50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                  {integrationProviderLabel(provider)}
                </div>
                <h4 className="text-2xl font-black text-white">{previewItem.title}</h4>
                <p className="mt-2 text-sm text-zinc-500">{previewItem.subtitle}</p>
              </div>
              <button onClick={() => setPreviewItem(null)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600">{previewItem.kind}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{previewItem.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {previewItem.tags.map(tag => (
                  <span key={tag} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
              {previewItem.url && (
                <a href={previewItem.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">
                  {ko ? '원본 보기' : 'Open source'}
                  <ChevronRight size={12} />
                </a>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  toggleSelected(previewItem.resourceId);
                }}
                className="rounded-2xl border border-white/8 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.04]"
              >
                {selectedIds.includes(previewItem.resourceId) ? (ko ? '선택 해제' : 'Remove') : (ko ? '자료 선택' : 'Select item')}
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleSelected(previewItem.resourceId);
                  setPreviewItem(null);
                }}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                {ko ? '선택 후 닫기' : 'Select and close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
