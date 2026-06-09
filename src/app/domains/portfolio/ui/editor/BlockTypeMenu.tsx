import {
  AlignLeft,
  BookOpen,
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
    label: '?띿뒪??,
    items: [
      { icon: <Heading1 size={13} />, type: 'h1', label: '?쒕ぉ 1', desc: '??쒕ぉ' },
      { icon: <Heading2 size={13} />, type: 'h2', label: '?쒕ぉ 2', desc: '以묒젣紐? },
      { icon: <Heading3 size={13} />, type: 'h3', label: '?쒕ぉ 3', desc: '?뚯젣紐? },
      { icon: <span className="text-[11px] font-bold text-zinc-500">H4</span>, type: 'h4', label: '?쒕ぉ 4', desc: '?몃? ?쒕ぉ' },
      { icon: <Type size={13} />, type: 'p', label: '?띿뒪??, desc: '?쇰컲 臾몃떒' },
      { icon: <Quote size={13} />, type: 'quote', label: '?몄슜臾?, desc: '李몄“???띿뒪?? },
    ],
  },
  {
    label: '由ъ뒪??,
    items: [
      { icon: <List size={13} />, type: 'bullet', label: '遺덈┸ 由ъ뒪??, desc: '湲癒몃━ 湲고샇' },
      { icon: <ListOrdered size={13} />, type: 'numbered', label: '踰덊샇 由ъ뒪??, desc: '?쒖꽌??紐⑸줉' },
      { icon: <SquareCheckBig size={13} />, type: 'todo', label: 'To-do', desc: '泥댄겕 ??ぉ' },
      { icon: <ToggleLeft size={13} />, type: 'toggle', label: '?좉?', desc: '?묎퀬 ?쇱튂??釉붾줉' },
    ],
  },
  {
    label: '誘몃뵒??,
    items: [
      { icon: <Lightbulb size={13} />, type: 'callout', label: '肄쒖븘??, desc: '媛뺤“ 諛뺤뒪' },
      { icon: <Image size={13} />, type: 'image', label: '?대?吏', desc: '?대?吏 ?낅줈?? },
      { icon: <Code2 size={13} />, type: 'code', label: '肄붾뱶 釉붾줉', desc: '肄붾뱶 ?ㅻ땲?? },
      { icon: <Globe size={13} />, type: 'embed', label: '?꾨쿋??, desc: 'URL ?꾨쿋?? },
      { icon: <Link2 size={13} />, type: 'bookmark', label: '遺곷쭏??, desc: '留곹겕 移대뱶' },
      { icon: <FileText size={13} />, type: 'file', label: '?뚯씪', desc: '?뚯씪 泥⑤?' },
    ],
  },
  {
    label: '怨좉툒',
    items: [
      { icon: <Table2 size={13} />, type: 'table', label: '??, desc: '?뚯씠釉?釉붾줉' },
      { icon: <Database size={13} />, type: 'database', label: '?곗씠?곕쿋?댁뒪', desc: '移몃컲/DB' },
      { icon: <Sigma size={13} />, type: 'equation', label: '?섏떇', desc: '?섑븰/湲고샇 ?쒗쁽' },
      { icon: <Minus size={13} />, type: 'divider', label: '援щ텇??, desc: '?뱀뀡 援щ텇' },
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
        className="absolute w-72 rounded-2xl overflow-hidden shadow-2xl"
        style={{ left: safeX, top: safeY, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Hash size={11} className="text-zinc-600" />
            <span className="text-xs text-zinc-500">{mode === 'change' ? '?붿냼 蹂寃? : '釉붾줉 ?쎌엯 ??/紐낅졊??}</span>
          </div>
          <button onMouseDown={e => e.preventDefault()} onClick={onClose} className="text-zinc-700 hover:text-zinc-400">
            <X size={12} />
          </button>
        </div>

        <div className="py-1 max-h-80 overflow-y-auto">
          {BLOCK_GROUPS.map(group => (
            <div key={group.label}>
              <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{group.label}</p>
              {group.items.map(item => (
                <button
                  key={item.type}
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={e => { e.stopPropagation(); onPick(item.type); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 transition-colors hover:bg-white/[0.05] group"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-500 group-hover:text-violet-400" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
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

