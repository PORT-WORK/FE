import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import EditorBlock from '../../portfolio/ui/editor/EditorBlock';
import BlockTypeMenu from '../../portfolio/ui/editor/BlockTypeMenu';
import type { EditorBlockModel, EditorBlockType } from '../../portfolio/ui/editor/types';

type Props = {
  open: boolean;
  title: string;
  guide: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

function createBlocks(initialValue: string): EditorBlockModel[] {
  const text = initialValue.trim();
  if (!text) {
    return [{ id: Math.random().toString(36).slice(2, 10), type: 'p', content: '' }];
  }

  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((content, index) => ({
      id: `${Date.now()}-${index}`,
      type: index === 0 ? 'h2' : 'p',
      content,
    }));
}

function serializeBlocks(blocks: EditorBlockModel[]) {
  return blocks
    .map(block => block.content.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export default function SectionEditorModal({ open, title, guide, initialValue, onClose, onSave }: Props) {
  const [blocks, setBlocks] = useState<EditorBlockModel[]>(() => createBlocks(initialValue));
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number } | null>(null);

  useEffect(() => {
    if (open) setBlocks(createBlocks(initialValue));
  }, [initialValue, open]);

  const blockCount = useMemo(() => blocks.length, [blocks.length]);

  if (!open) return null;

  const updateBlock = (id: string, value: string) => {
    setBlocks(prev => prev.map(block => (block.id === id ? { ...block, content: value } : block)));
  };

  const addBlock = (type: EditorBlockType) => {
    setBlocks(prev => [...prev, { id: Math.random().toString(36).slice(2, 10), type, content: '' }]);
    setMenu(null);
  };

  return (
    <div className="fixed inset-0 z-[360] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-5xl rounded-[30px] border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/50"
        style={{ minHeight: 'calc(100vh - 3rem)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
              Notion-style editor
            </div>
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{guide}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 px-6 py-6">
          <div className="rounded-[26px] border border-white/8 bg-black/20 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                {blockCount} blocks
              </div>
              <button
                type="button"
                onClick={event => setMenu({ open: true, x: event.clientX, y: event.clientY })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-white/[0.04]"
              >
                <Plus size={12} />
                Add block
              </button>
            </div>

            <div className="space-y-2">
              {blocks.map(block => (
                <div key={block.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-3">
                  <EditorBlock
                    block={block}
                    onChange={updateBlock}
                    onDBUpdate={() => undefined}
                    readOnly={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">Section guide</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">{guide}</p>
            </div>

            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-white">Save</p>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                Write naturally, then save to reflect the section back into the project flow.
              </p>
              <button
                type="button"
                onClick={() => onSave(serializeBlocks(blocks))}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                <Save size={14} />
                Save section
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04]"
            >
              <ArrowLeft size={14} />
              Close
            </button>
          </div>
        </div>
      </div>

      {menu?.open && (
        <BlockTypeMenu
          x={menu.x}
          y={menu.y}
          mode="insert"
          onPick={type => addBlock(type)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
