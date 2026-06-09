import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Eye, Edit3, Plus, Trash2, Type, Heading1, Heading2, Heading3, Quote, Code2, Image, CheckSquare, Minus, Sparkles, Download, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { exportPortfolioPptx } from '../../api/contentApi';

type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'code' | 'check' | 'image' | 'divider';

type Block = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: ReactNode }> = [
  { type: 'h1', label: 'Heading 1', icon: <Heading1 size={14} /> },
  { type: 'h2', label: 'Heading 2', icon: <Heading2 size={14} /> },
  { type: 'h3', label: 'Heading 3', icon: <Heading3 size={14} /> },
  { type: 'p', label: 'Text', icon: <Type size={14} /> },
  { type: 'quote', label: 'Quote', icon: <Quote size={14} /> },
  { type: 'code', label: 'Code', icon: <Code2 size={14} /> },
  { type: 'check', label: 'Checklist', icon: <CheckSquare size={14} /> },
  { type: 'image', label: 'Image', icon: <Image size={14} /> },
  { type: 'divider', label: 'Divider', icon: <Minus size={14} /> },
];

function createBlock(type: BlockType): Block {
  return { id: uid(), type, content: type === 'divider' ? '' : '' };
}

function BlockEditor({
  block,
  onChange,
  onDelete,
  onToggleDone,
}: {
  block: Block;
  onChange: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
}) {
  if (block.type === 'divider') {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <button onClick={() => onDelete(block.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-500">Image</span>
          <button onClick={() => onDelete(block.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
        </div>
        <input value={block.content} onChange={e => onChange(block.id, e.target.value)} placeholder="Paste image URL" className="w-full px-3 py-2 text-sm rounded-xl text-zinc-200 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        {block.content && <img src={block.content} alt="" className="mt-3 rounded-xl max-h-64 object-cover w-full" />}
      </div>
    );
  }

  if (block.type === 'check') {
    return (
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleDone(block.id)} className="mt-2 w-4 h-4 rounded border flex items-center justify-center" style={{ background: block.checked ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'transparent', borderColor: 'rgba(255,255,255,0.15)' }}>
          {block.checked && <CheckSquare size={10} className="text-white" />}
        </button>
        <div className="flex-1">
          <textarea value={block.content} onChange={e => onChange(block.id, e.target.value)} placeholder="Checklist item" className="w-full bg-transparent outline-none resize-none text-zinc-200 placeholder-zinc-700 text-sm" rows={1} />
        </div>
        <button onClick={() => onDelete(block.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 capitalize">{block.type}</span>
        <button onClick={() => onDelete(block.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
      </div>
      <textarea
        value={block.content}
        onChange={e => onChange(block.id, e.target.value)}
        placeholder="Write content..."
        className="w-full bg-transparent outline-none resize-none text-zinc-200 placeholder-zinc-700"
        rows={block.type === 'code' ? 5 : 2}
        style={{ fontSize: block.type === 'h1' ? '2rem' : block.type === 'h2' ? '1.5rem' : block.type === 'h3' ? '1.25rem' : '0.95rem', fontWeight: block.type.startsWith('h') ? 800 : 400, fontFamily: block.type === 'code' ? 'monospace' : 'inherit' }}
      />
    </div>
  );
}

function ExportModal({ title, onClose, onExport }: { title: string; onClose: () => void; onExport: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      await onExport();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white">Export to PPTX</p>
          <button onClick={onClose} className="p-2 text-zinc-700 hover:text-zinc-400 rounded-xl transition-colors"><X size={15} /></button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-zinc-400 mb-4">This exports the current article as a PPTX file.</p>
          <button onClick={handleExport} disabled={busy} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            {busy ? 'Exporting...' : `Export "${title || 'Untitled'}"`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const { t } = useApp();
  const articleId = params.get('id');
  const stateArticle = (location.state as any)?.article;
  const initialTitle = stateArticle?.title || 'Untitled';
  const initialCategory = stateArticle?.category || (location.state as any)?.fromCat || 'General';
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const [emoji, setEmoji] = useState('✨');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uid(), type: 'h1', content: title },
    { id: uid(), type: 'p', content: 'Describe your project story here.' },
  ]);
  const [preview, setPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const updateBlock = (id: string, value: string) => {
    setBlocks(prev => prev.map(block => (block.id === id ? { ...block, content: value } : block)));
  };

  const toggleDone = (id: string) => {
    setBlocks(prev => prev.map(block => (block.id === id ? { ...block, checked: !block.checked } : block)));
  };

  const addBlock = (type: BlockType) => {
    setBlocks(prev => [...prev, createBlock(type)]);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  const saveDraft = () => {
    localStorage.setItem('port_articles', JSON.stringify([
      { id: articleId || `a-${Date.now()}`, title, category, projectId: 'p1', content: JSON.stringify(blocks) },
    ]));
  };

  const exportPptx = async () => {
    await exportPortfolioPptx(1);
    setShowExport(false);
  };

  const previewBlocks = useMemo(() => blocks, [blocks]);

  return (
    <div className="h-full flex" style={{ background: '#050505' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => navigate('/portfolio')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={14} />
            {t('editor_back')}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreview(prev => !prev)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 rounded-xl hover:text-white hover:bg-white/[0.05] transition-colors">
              <Eye size={12} />
              {preview ? t('editor_edit_mode') : t('editor_preview_mode')}
            </button>
            <button onClick={saveDraft} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 rounded-xl hover:text-white hover:bg-white/[0.05] transition-colors">
              <Edit3 size={12} />
              {t('editor_save')}
            </button>
            <button onClick={() => setShowExport(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Download size={12} />
              PPTX
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3 mb-4">
                <input value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 2))} className="w-14 px-3 py-2 text-center rounded-xl text-lg bg-transparent text-zinc-200 outline-none" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                <div className="flex-1">
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('editor_title_placeholder')} className="w-full bg-transparent text-3xl font-black text-white outline-none" />
                  <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="mt-2 w-full bg-transparent text-sm text-zinc-500 outline-none" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map(item => (
                  <button key={item.type} onClick={() => addBlock(item.type)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {!preview ? (
              <div className="space-y-4">
                {blocks.map(block => (
                  <BlockEditor key={block.id} block={block} onChange={updateBlock} onDelete={removeBlock} onToggleDone={toggleDone} />
                ))}
                <button onClick={() => addBlock('p')} className="w-full py-4 rounded-2xl text-sm text-zinc-600 hover:text-zinc-300 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <Plus size={14} className="inline mr-2" />
                  Add new block
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-zinc-500">{emoji} {category}</div>
                <h1 className="text-4xl font-black text-white">{title || t('editor_title_placeholder')}</h1>
                <div className="space-y-4">
                  {previewBlocks.map(block => (
                    <div key={block.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs text-zinc-600 mb-2">{block.type}</p>
                      <p className="text-zinc-300 whitespace-pre-wrap">{block.content || ' '}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && <ExportModal title={title} onClose={() => setShowExport(false)} onExport={exportPptx} />}
    </div>
  );
}
