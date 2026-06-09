import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronRight, Code2, Database, Globe, Image, Link2, Minus, SquareCheckBig } from 'lucide-react';
import type { EditorBlockModel, EditorBlockType, EditorDbItem } from './types';

const STATUS_LABELS: Record<string, string> = { todo: 'To Do', doing: 'In Progress', done: 'Done' };
const STATUS_COLORS: Record<string, string> = { todo: 'rgba(239,68,68,0.15)', doing: 'rgba(234,179,8,0.15)', done: 'rgba(16,185,129,0.15)' };
const STATUS_TEXT: Record<string, string> = { todo: '#f87171', doing: '#fbbf24', done: '#34d399' };

const base = 'w-full bg-transparent outline-none resize-none leading-relaxed text-zinc-200 placeholder-zinc-700 overflow-hidden';

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function DatabaseBlock({
  block,
  onUpdate,
  readOnly,
}: {
  block: EditorBlockModel;
  onUpdate?: (id: string, items: EditorDbItem[]) => void;
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState<{ status: string; value: string } | null>(null);
  const items = block.dbItems || [];

  const grouped = useMemo(() => ({
    todo: items.filter(item => item.status === 'todo'),
    doing: items.filter(item => item.status === 'doing'),
    done: items.filter(item => item.status === 'done'),
  }), [items]);

  const commit = (status: 'todo' | 'doing' | 'done') => {
    if (!onUpdate) return;
    if (!adding?.value.trim()) {
      setAdding(null);
      return;
    }
    onUpdate(block.id, [...items, { id: Math.random().toString(36).slice(2, 10), title: adding.value.trim(), status }]);
    setAdding(null);
  };

  const move = (itemId: string, status: 'todo' | 'doing' | 'done') => {
    onUpdate?.(block.id, items.map(item => item.id === itemId ? { ...item, status } : item));
  };

  const remove = (itemId: string) => {
    onUpdate?.(block.id, items.filter(item => item.id !== itemId));
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Database size={12} className="text-violet-400" />
        <span className="text-xs font-semibold text-zinc-500">?곗씠?곕쿋?댁뒪</span>
        <span className="text-[10px] text-zinc-700 ml-1">{items.length}媛???ぉ</span>
      </div>
      <div className="grid grid-cols-3">
        {(['todo', 'doing', 'done'] as const).map((status, index) => (
          <div key={status} className="p-3 min-h-[80px]" style={{ borderRight: index < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold" style={{ color: STATUS_TEXT[status] }}>{STATUS_LABELS[status]}</span>
              <span className="text-[10px] text-zinc-700">{grouped[status].length}</span>
            </div>

            <div className="space-y-1.5">
              {grouped[status].map(item => (
                <div key={item.id} className="group/ci flex items-start gap-1 px-2 py-1.5 rounded-lg text-[11px] text-zinc-400" style={{ background: STATUS_COLORS[status] }}>
                  <span className="flex-1 break-words leading-relaxed">{item.title}</span>
                  {!readOnly && (
                    <div className="flex gap-0.5 opacity-0 group-hover/ci:opacity-100 transition-opacity flex-shrink-0">
                      {status !== 'todo' && <button onMouseDown={e => e.preventDefault()} onClick={() => move(item.id, status === 'doing' ? 'todo' : 'doing')} className="text-zinc-600 hover:text-zinc-300"><ChevronRight size={10} className="rotate-180" /></button>}
                      {status !== 'done' && <button onMouseDown={e => e.preventDefault()} onClick={() => move(item.id, status === 'todo' ? 'doing' : 'done')} className="text-zinc-600 hover:text-zinc-300"><ChevronRight size={10} /></button>}
                      <button onMouseDown={e => e.preventDefault()} onClick={() => remove(item.id)} className="text-zinc-700 hover:text-red-400"><Minus size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
              {!readOnly && (
                adding?.status === status ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={adding.value}
                      onChange={e => setAdding({ status, value: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') commit(status); if (e.key === 'Escape') setAdding(null); }}
                      onBlur={() => commit(status)}
                      placeholder="??ぉ ?대쫫..."
                      className="flex-1 bg-transparent text-[11px] text-zinc-300 placeholder-zinc-700 outline-none px-2 py-1 rounded-lg"
                      style={{ border: '1px solid rgba(124,58,237,0.35)' }}
                    />
                  </div>
                ) : (
                  <button onMouseDown={e => e.preventDefault()} onClick={() => setAdding({ status, value: '' })} className="w-full text-left text-[10px] text-zinc-700 hover:text-zinc-500 px-1 py-0.5 transition-colors">
                    + ??ぉ 異붽?
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditorBlock({
  block,
  onChange,
  onKeyDown,
  onDBUpdate,
  setRef,
  readOnly = false,
}: {
  block: EditorBlockModel;
  onChange?: (id: string, val: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>, block: EditorBlockModel) => void;
  onDBUpdate?: (id: string, items: EditorDbItem[]) => void;
  setRef?: (el: HTMLTextAreaElement | null) => void;
  readOnly?: boolean;
}) {
  if (block.type === 'divider') return <hr className="my-4" style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />;
  if (block.type === 'database') return <DatabaseBlock block={block} onUpdate={onDBUpdate} readOnly={readOnly} />;
  if (block.type === 'table') return (
    <div className="my-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
      <div className="grid grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <input key={i} defaultValue="" placeholder={i < 3 ? `??${i + 1}` : ''} className={`p-2.5 text-xs bg-transparent text-zinc-300 outline-none focus:bg-white/[0.02] ${i < 3 ? 'font-semibold text-zinc-500' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.07)' }} />
        ))}
      </div>
    </div>
  );
  if (block.type === 'image') return (
    <div className="my-2">
      {block.content ? (
        <div className="relative group/img">
          <img src={block.content} alt="" className="max-w-full rounded-xl" />
          {!readOnly && <button onClick={() => onChange?.(block.id, '')} className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs text-white opacity-0 group-hover/img:opacity-100" style={{ background: 'rgba(0,0,0,0.75)' }}>?쒓굅</button>}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-36 rounded-xl cursor-pointer transition-colors" style={{ border: '2px dashed rgba(255,255,255,0.09)' }}>
          <Image size={22} className="text-zinc-700 mb-2" />
          <span className="text-xs text-zinc-700">?대┃?섏뿬 ?대?吏 ?낅줈??/span>
          {!readOnly && <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = ev => onChange?.(block.id, ev.target?.result as string); reader.readAsDataURL(file); } }} />}
        </label>
      )}
    </div>
  );
  if (block.type === 'code') return (
    <div className="rounded-xl my-2 overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <Code2 size={11} className="text-zinc-600" />
        <span className="text-[10px] text-zinc-600 font-mono">code</span>
      </div>
      <textarea
        ref={setRef}
        value={block.content}
        onChange={e => onChange?.(block.id, e.target.value)}
        onKeyDown={e => onKeyDown?.(e, block)}
        onInput={e => autoResize(e.target as HTMLTextAreaElement)}
        className="w-full bg-transparent outline-none resize-none p-3 text-sm font-mono text-emerald-300/90 leading-loose"
        rows={Math.max(3, block.content.split('\n').length)}
        readOnly={readOnly}
      />
    </div>
  );
  if (block.type === 'embed' || block.type === 'bookmark') return (
    <div className="my-2 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Globe size={12} className="text-zinc-600" />
        <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder={block.type === 'bookmark' ? '遺곷쭏??URL???낅젰?섏꽭??..' : 'URL???낅젰?섏꽭??..'} className="flex-1 bg-transparent text-xs text-zinc-400 placeholder-zinc-700 outline-none" readOnly={readOnly} />
      </div>
      {block.content && <div className="px-4 py-3"><a href={block.content} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:underline break-all">{block.content}</a></div>}
    </div>
  );
  if (block.type === 'callout') return (
    <div className="rounded-xl px-4 py-3 my-1.5" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
      <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-sm text-violet-200`} rows={1} placeholder="肄쒖븘???댁슜..." readOnly={readOnly} />
    </div>
  );
  if (block.type === 'quote') return (
    <div className="pl-4 my-1.5" style={{ borderLeft: '3px solid rgba(124,58,237,0.4)' }}>
      <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-sm italic text-zinc-400`} rows={1} placeholder="?몄슜臾?.." readOnly={readOnly} />
    </div>
  );
  if (block.type === 'todo') return (
    <div className="flex items-start gap-2.5 my-0.5">
      <input type="checkbox" checked={!!block.checked} readOnly className="mt-[7px] accent-violet-500 flex-shrink-0" />
      <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-[15px] flex-1 ${block.checked ? 'line-through text-zinc-600' : ''}`} rows={1} readOnly={readOnly} />
    </div>
  );
  if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'toggle') return (
    <div className="flex items-start gap-2">
      <span className="text-zinc-600 mt-[5px] flex-shrink-0 text-base">{block.type === 'numbered' ? '1.' : block.type === 'toggle' ? '?? : '??}</span>
      <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-[15px] flex-1`} rows={1} placeholder={block.type === 'toggle' ? '?좉? ?붿빟...' : '??ぉ 異붽?...'} readOnly={readOnly} />
    </div>
  );
  if (block.type === 'file') return (
    <div className="rounded-xl px-4 py-3 my-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2">
        <Link2 size={12} className="text-zinc-500" />
        <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder="?뚯씪 留곹겕 ?먮뒗 ?ㅻ챸..." className={`${base} text-xs text-zinc-300`} readOnly={readOnly} />
      </div>
    </div>
  );
  if (block.type === 'equation') return (
    <div className="rounded-xl px-4 py-3 my-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 text-sm">?(x)</span>
        <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder="?섏떇???낅젰?섏꽭??.." className={`${base} text-xs text-zinc-300`} readOnly={readOnly} />
      </div>
    </div>
  );

  const sizeMap: Record<string, string> = { h1: 'text-4xl font-black', h2: 'text-2xl font-bold', h3: 'text-xl font-semibold', h4: 'text-base font-semibold text-white', p: 'text-[15px]' };
  const ph: Record<string, string> = { h1: '?쒕ぉ 1', h2: '?쒕ぉ 2', h3: '?쒕ぉ 3', h4: '?쒕ぉ 4', p: "?댁슜???낅젰?섏꽭????'/' 釉붾줉 ?좏깮" };

  return (
    <textarea
      ref={setRef}
      value={block.content}
      onChange={e => onChange?.(block.id, e.target.value)}
      onKeyDown={e => onKeyDown?.(e, block)}
      onInput={e => autoResize(e.target as HTMLTextAreaElement)}
      className={`${base} ${sizeMap[block.type] || 'text-[15px]'}`}
      rows={1}
      placeholder={ph[block.type] || ''}
      readOnly={readOnly}
    />
  );
}

