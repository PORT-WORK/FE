import {
  Code2,
  Database,
  FileText,
  Globe,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Link2,
  List,
  ListOrdered,
  Lightbulb,
  Minus,
  Sigma,
  SquareCheckBig,
  ToggleLeft,
  Type,
  X,
  Quote,
  Table2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { EditorBlockType } from './types';

const BLOCK_GROUPS: Array<{ label: string; items: Array<{ icon: ReactNode; type: EditorBlockType; label: string; desc: string }> }> = [
  {
    label: 'Text',
    items: [
      { icon: <Heading1 size={13} />, type: 'h1', label: 'Heading 1', desc: 'Large heading' },
      { icon: <Heading2 size={13} />, type: 'h2', label: 'Heading 2', desc: 'Medium heading' },
      { icon: <Heading3 size={13} />, type: 'h3', label: 'Heading 3', desc: 'Small heading' },
      { icon: <span className="text-[11px] font-bold text-zinc-500">H4</span>, type: 'h4', label: 'Heading 4', desc: 'Tiny heading' },
      { icon: <Type size={13} />, type: 'p', label: 'Text', desc: 'Plain paragraph' },
      { icon: <Quote size={13} />, type: 'quote', label: 'Quote', desc: 'Quoted text' },
    ],
  },
  {
    label: 'List',
    items: [
      { icon: <List size={13} />, type: 'bullet', label: 'Bullet list', desc: 'Bulleted items' },
      { icon: <ListOrdered size={13} />, type: 'numbered', label: 'Numbered list', desc: 'Ordered items' },
      { icon: <SquareCheckBig size={13} />, type: 'todo', label: 'To-do', desc: 'Checklist item' },
      { icon: <ToggleLeft size={13} />, type: 'toggle', label: 'Toggle', desc: 'Collapsible block' },
    ],
  },
  {
    label: 'Media',
    items: [
      { icon: <Lightbulb size={13} />, type: 'callout', label: 'Callout', desc: 'Highlighted box' },
      { icon: <Image size={13} />, type: 'image', label: 'Image', desc: 'Upload image' },
      { icon: <Code2 size={13} />, type: 'code', label: 'Code', desc: 'Code block' },
      { icon: <Globe size={13} />, type: 'embed', label: 'Embed', desc: 'Embed URL' },
      { icon: <Link2 size={13} />, type: 'bookmark', label: 'Bookmark', desc: 'Link card' },
      { icon: <FileText size={13} />, type: 'file', label: 'File', desc: 'File link' },
    ],
  },
  {
    label: 'Advanced',
    items: [
      { icon: <Table2 size={13} />, type: 'table', label: 'Table', desc: 'Table block' },
      { icon: <Database size={13} />, type: 'database', label: 'Database', desc: 'Database block' },
      { icon: <Sigma size={13} />, type: 'equation', label: 'Equation', desc: 'Formula' },
      { icon: <Minus size={13} />, type: 'divider', label: 'Divider', desc: 'Section divider' },
    ],
  },
];

export default function BlockTypeMenu({
  x,
  y,
  mode,
  onPick,
  onClose,
}: {
  x: number;
  y: number;
  mode: 'insert' | 'change';
  onPick: (t: EditorBlockType) => void;
  onClose: () => void;
}) {
  const safeX = Math.min(x, window.innerWidth - 290);
  const safeY = y + 300 > window.innerHeight ? y - 340 : y;

  return (
    <div className="fixed inset-0 z-[200]" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }} onClick={onClose}>
      <div
        className="absolute w-72 overflow-hidden rounded-2xl shadow-2xl"
        style={{ left: safeX, top: safeY, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Hash size={11} className="text-zinc-600" />
            <span className="text-xs text-zinc-500">{mode === 'change' ? 'Change block' : 'Insert block'}</span>
          </div>
          <button onMouseDown={e => e.preventDefault()} onClick={onClose} className="text-zinc-700 hover:text-zinc-400">
            <X size={12} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto py-1">
          {BLOCK_GROUPS.map(group => (
            <div key={group.label}>
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{group.label}</p>
              {group.items.map(item => (
                <button
                  key={item.type}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={e => { e.stopPropagation(); onPick(item.type); }}
                  className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 group-hover:text-violet-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-zinc-300">{item.label}</p>
                    <p className="text-[10px] text-zinc-600">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
