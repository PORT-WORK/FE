import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronRight, Code2, Database, Globe, Image, Link2, Minus } from 'lucide-react';
import type { EditorBlockModel, EditorDbItem } from './types';

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
  const [adding, setAdding] = useState('');
  const items = block.dbItems || [];

  const grouped = useMemo(
    () => ({
      todo: items.filter(item => item.status === 'todo'),
      doing: items.filter(item => item.status === 'doing'),
      done: items.filter(item => item.status === 'done'),
    }),
    [items],
  );

  const commit = (status: 'todo' | 'doing' | 'done') => {
    if (!onUpdate || !adding.trim()) return setAdding('');
    onUpdate(block.id, [...items, { id: Math.random().toString(36).slice(2, 10), title: adding.trim(), status }]);
    setAdding('');
  };

  const move = (itemId: string, status: 'todo' | 'doing' | 'done') => {
    onUpdate?.(block.id, items.map(item => (item.id === itemId ? { ...item, status } : item)));
  };

  const remove = (itemId: string) => {
    onUpdate?.(block.id, items.filter(item => item.id !== itemId));
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Database size={12} className="text-violet-400" />
        <span className="text-xs font-semibold text-zinc-500">Database</span>
        <span className="ml-1 text-[10px] text-zinc-700">{items.length} items</span>
      </div>
      <div className="grid grid-cols-3">
        {(['todo', 'doing', 'done'] as const).map((status, index) => (
          <div key={status} className="min-h-[80px] p-3" style={{ borderRight: index < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-violet-300">{status}</span>
              <span className="text-[10px] text-zinc-700">{grouped[status].length}</span>
            </div>
            <div className="space-y-1.5">
              {grouped[status].map(item => (
                <div key={item.id} className="group/ci flex items-start gap-1 rounded-lg px-2 py-1.5 text-[11px] text-zinc-400" style={{ background: 'rgba(124,58,237,0.08)' }}>
                  <span className="flex-1 break-words leading-relaxed">{item.title}</span>
                  {!readOnly && (
                    <div className="flex flex-shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/ci:opacity-100">
                      {status !== 'todo' && <button onMouseDown={e => e.preventDefault()} onClick={() => move(item.id, status === 'doing' ? 'todo' : 'doing')} className="text-zinc-600 hover:text-zinc-300"><ChevronRight size={10} className="rotate-180" /></button>}
                      {status !== 'done' && <button onMouseDown={e => e.preventDefault()} onClick={() => move(item.id, status === 'todo' ? 'doing' : 'done')} className="text-zinc-600 hover:text-zinc-300"><ChevronRight size={10} /></button>}
                      <button onMouseDown={e => e.preventDefault()} onClick={() => remove(item.id)} className="text-zinc-700 hover:text-red-400"><Minus size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
              {!readOnly && (
                <div className="space-y-1">
                  <input
                    value={adding}
                    onChange={e => setAdding(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commit(status);
                      if (e.key === 'Escape') setAdding('');
                    }}
                    onBlur={() => commit(status)}
                    placeholder="Add item..."
                    className="w-full rounded-lg bg-transparent px-2 py-1 text-[11px] text-zinc-300 outline-none placeholder:text-zinc-700"
                    style={{ border: '1px solid rgba(124,58,237,0.35)' }}
                  />
                </div>
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
  if (block.type === 'table') {
    return (
      <div className="my-3 overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="grid grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <input key={i} defaultValue="" placeholder={i < 3 ? `Col ${i + 1}` : ''} className={`bg-transparent p-2.5 text-xs text-zinc-300 outline-none focus:bg-white/[0.02] ${i < 3 ? 'font-semibold text-zinc-500' : ''}`} style={{ border: '1px solid rgba(255,255,255,0.07)' }} />
          ))}
        </div>
      </div>
    );
  }
  if (block.type === 'image') {
    return (
      <div className="my-2">
        {block.content ? (
          <div className="relative group/img">
            <img src={block.content} alt="" className="max-w-full rounded-xl" />
            {!readOnly && <button onClick={() => onChange?.(block.id, '')} className="absolute right-2 top-2 rounded-lg bg-black/75 px-2 py-1 text-xs text-white opacity-0 group-hover/img:opacity-100">Remove</button>}
          </div>
        ) : (
          <label className="flex h-36 flex-col items-center justify-center rounded-xl transition-colors" style={{ border: '2px dashed rgba(255,255,255,0.09)' }}>
            <Image size={22} className="mb-2 text-zinc-700" />
            <span className="text-xs text-zinc-700">Upload image</span>
            {!readOnly && <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = ev => onChange?.(block.id, ev.target?.result as string); reader.readAsDataURL(file); } }} />}
          </label>
        )}
      </div>
    );
  }
  if (block.type === 'code') {
    return (
      <div className="my-2 overflow-hidden rounded-xl" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <Code2 size={11} className="text-zinc-600" />
          <span className="text-[10px] font-mono text-zinc-600">code</span>
        </div>
        <textarea
          ref={setRef}
          value={block.content}
          onChange={e => onChange?.(block.id, e.target.value)}
          onKeyDown={e => onKeyDown?.(e, block)}
          onInput={e => autoResize(e.target as HTMLTextAreaElement)}
          className="w-full resize-none bg-transparent p-3 text-sm font-mono leading-loose text-emerald-300/90 outline-none"
          rows={Math.max(3, block.content.split('\n').length)}
          readOnly={readOnly}
        />
      </div>
    );
  }
  if (block.type === 'embed' || block.type === 'bookmark') {
    return (
      <div className="my-2 overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Globe size={12} className="text-zinc-600" />
          <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder={block.type === 'bookmark' ? 'Paste bookmark URL' : 'Paste URL'} className="flex-1 bg-transparent text-xs text-zinc-400 outline-none placeholder:text-zinc-700" readOnly={readOnly} />
        </div>
        {block.content && <div className="px-4 py-3"><a href={block.content} target="_blank" rel="noreferrer" className="break-all text-xs text-violet-400 hover:underline">{block.content}</a></div>}
      </div>
    );
  }
  if (block.type === 'callout') {
    return (
      <div className="my-1.5 rounded-xl px-4 py-3" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-sm text-violet-200`} rows={1} placeholder="Callout..." readOnly={readOnly} />
      </div>
    );
  }
  if (block.type === 'quote') {
    return (
      <div className="my-1.5 border-l-4 pl-4" style={{ borderLeftColor: 'rgba(124,58,237,0.4)' }}>
        <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} text-sm italic text-zinc-400`} rows={1} placeholder="Quote..." readOnly={readOnly} />
      </div>
    );
  }
  if (block.type === 'todo') {
    return (
      <div className="my-0.5 flex items-start gap-2.5">
        <input type="checkbox" checked={!!block.checked} readOnly className="mt-[7px] flex-shrink-0 accent-violet-500" />
        <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} flex-1 text-[15px] ${block.checked ? 'text-zinc-600 line-through' : ''}`} rows={1} readOnly={readOnly} />
      </div>
    );
  }
  if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'toggle') {
    return (
      <div className="flex items-start gap-2">
        <span className="mt-[5px] flex-shrink-0 text-base text-zinc-600">{block.type === 'numbered' ? '1.' : block.type === 'toggle' ? '▸' : '•'}</span>
        <textarea ref={setRef} value={block.content} onChange={e => onChange?.(block.id, e.target.value)} onKeyDown={e => onKeyDown?.(e, block)} onInput={e => autoResize(e.target as HTMLTextAreaElement)} className={`${base} flex-1 text-[15px]`} rows={1} placeholder={block.type === 'toggle' ? 'Toggle content...' : 'Add item...'} readOnly={readOnly} />
      </div>
    );
  }
  if (block.type === 'file') {
    return (
      <div className="my-2 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Link2 size={12} className="text-zinc-500" />
          <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder="File link or title" className={`${base} text-xs text-zinc-300`} readOnly={readOnly} />
        </div>
      </div>
    );
  }
  if (block.type === 'equation') {
    return (
      <div className="my-2 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">f(x)</span>
          <input value={block.content} onChange={e => onChange?.(block.id, e.target.value)} placeholder="Equation..." className={`${base} text-xs text-zinc-300`} readOnly={readOnly} />
        </div>
      </div>
    );
  }

  const sizeMap: Record<string, string> = { h1: 'text-4xl font-black', h2: 'text-2xl font-bold', h3: 'text-xl font-semibold', h4: 'text-base font-semibold text-white', p: 'text-[15px]' };
  return (
    <textarea
      ref={setRef}
      value={block.content}
      onChange={e => onChange?.(block.id, e.target.value)}
      onKeyDown={e => onKeyDown?.(e, block)}
      onInput={e => autoResize(e.target as HTMLTextAreaElement)}
      className={`${base} ${sizeMap[block.type] || 'text-[15px]'}`}
      rows={1}
      placeholder={block.type === 'h1' ? 'Title' : block.type === 'h2' ? 'Heading' : block.type === 'h3' ? 'Subheading' : 'Type here...'}
      readOnly={readOnly}
    />
  );
}
