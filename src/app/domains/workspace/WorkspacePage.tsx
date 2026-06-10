import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Plus, Download, Trash2, Type, Heading1, Heading2, Heading3, Quote, Code2, Image, Minus, CheckSquare, Database, Save, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  createDocumentBlock,
  deleteDocumentBlock,
  exportPortfolioPptx,
  listDocumentBlocks,
  reorderDocumentBlocks,
  updateDocumentBlock,
} from '../../api/contentApi';

type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'quote' | 'code' | 'check' | 'image' | 'divider' | 'database';

type Block = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  serverId?: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: JSX.Element }> = [
  { type: 'h1', label: 'Heading 1', icon: <Heading1 size={14} /> },
  { type: 'h2', label: 'Heading 2', icon: <Heading2 size={14} /> },
  { type: 'h3', label: 'Heading 3', icon: <Heading3 size={14} /> },
  { type: 'p', label: 'Text', icon: <Type size={14} /> },
  { type: 'quote', label: 'Quote', icon: <Quote size={14} /> },
  { type: 'code', label: 'Code', icon: <Code2 size={14} /> },
  { type: 'check', label: 'Checklist', icon: <CheckSquare size={14} /> },
  { type: 'image', label: 'Image', icon: <Image size={14} /> },
  { type: 'database', label: 'Database', icon: <Database size={14} /> },
  { type: 'divider', label: 'Divider', icon: <Minus size={14} /> },
];

function createBlock(type: BlockType): Block {
  return { id: uid(), type, content: '' };
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      {children}
    </div>
  );
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
      <div className="flex items-center gap-3 py-3">
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
          <span className="text-xs text-zinc-500">Image URL</span>
          <button onClick={() => onDelete(block.id)} className="text-zinc-700 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
        </div>
        <input
          value={block.content}
          onChange={e => onChange(block.id, e.target.value)}
          placeholder="Paste image URL"
          className="w-full px-3 py-2 text-sm rounded-xl text-zinc-200 outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        {block.content && <img src={block.content} alt="" className="mt-3 rounded-xl max-h-64 object-cover w-full" />}
      </div>
    );
  }

  if (block.type === 'check') {
    return (
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleDone(block.id)}
          className="mt-2 w-4 h-4 rounded border flex items-center justify-center"
          style={{ background: block.checked ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'transparent', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          {block.checked && <CheckSquare size={10} className="text-white" />}
        </button>
        <div className="flex-1">
          <textarea
            value={block.content}
            onChange={e => onChange(block.id, e.target.value)}
            placeholder="Checklist item"
            className="w-full bg-transparent outline-none resize-none text-zinc-200 placeholder-zinc-700 text-sm"
            rows={1}
          />
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
        style={{
          fontSize: block.type === 'h1' ? '2rem' : block.type === 'h2' ? '1.5rem' : block.type === 'h3' ? '1.25rem' : '0.95rem',
          fontWeight: block.type.startsWith('h') ? 800 : 400,
          fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
        }}
      />
    </div>
  );
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { language } = useApp();
  const ko = language === 'ko';
  const documentId = Number(params.get('documentId') || (location.state as any)?.documentId || 0);

  const [sourceType] = useState<'notion'>('notion');
  const [emoji, setEmoji] = useState('✨');
  const [title, setTitle] = useState('Untitled');
  const [category, setCategory] = useState<'project' | 'portfolio' | 'troubleshooting'>('project');
  const [bannerUrl, setBannerUrl] = useState('');
  const [databaseName, setDatabaseName] = useState('Project notes');
  const [databaseProperties, setDatabaseProperties] = useState('Status, Priority, Owner');
  const [tags, setTags] = useState('React, TypeScript');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: uid(), type: 'h1', content: 'Write your article title here' },
    { id: uid(), type: 'p', content: 'Start with the summary, then add the problem, solution, and result.' },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    let alive = true;
    listDocumentBlocks(documentId).then(data => {
      if (!alive || !Array.isArray(data) || data.length === 0) return;
      setBlocks(data.map((item: any) => ({
        id: String(item.id),
        serverId: Number(item.id),
        type: (item.type || 'p').toLowerCase(),
        content: item.content?.text || item.content?.value || item.content || '',
        checked: item.checked,
      })));
    });
    return () => {
      alive = false;
    };
  }, [documentId]);

  const updateBlock = (id: string, value: string) => setBlocks(prev => prev.map(block => (block.id === id ? { ...block, content: value } : block)));
  const toggleDone = (id: string) => setBlocks(prev => prev.map(block => (block.id === id ? { ...block, checked: !block.checked } : block)));
  const addBlock = (type: BlockType) => setBlocks(prev => [...prev, createBlock(type)]);
  const removeBlock = (id: string) => setBlocks(prev => prev.filter(block => block.id !== id));

  const publish = async () => {
    if (!documentId) return;
    setBusy(true);
    try {
      const existing = await listDocumentBlocks(documentId);
      const existingIds = new Set((existing || []).map((item: any) => String(item.id)));
      for (const block of blocks) {
        if (block.serverId) {
          await updateDocumentBlock(documentId, block.serverId, { type: block.type, content: block.content, checked: block.checked ?? false });
        } else {
          const created = await createDocumentBlock(documentId, { type: block.type, content: block.content, checked: block.checked ?? false });
          if ((created as any)?.id) block.serverId = Number((created as any).id);
        }
      }
      for (const item of existing || []) {
        if (!blocks.some(block => String(block.serverId) === String((item as any).id)) && !existingIds.has(String((item as any).id))) {
          await deleteDocumentBlock(documentId, Number((item as any).id));
        }
      }
      await reorderDocumentBlocks(documentId, blocks.map((block, orderIndex) => ({ blockId: block.serverId || Number(block.id), orderIndex })));
    } finally {
      setBusy(false);
    }
  };

  const exportPptx = async () => {
    const sourceText = [
      `Emoji: ${emoji}`,
      `Title: ${title}`,
      `Category: ${category}`,
      `Banner: ${bannerUrl}`,
      `Database: ${databaseName}`,
      `Properties: ${databaseProperties}`,
      `Tags: ${tags}`,
      ...blocks.filter(block => block.content.trim()).map(block => `[${block.type}] ${block.content}`),
    ].join('\n\n');
    await exportPortfolioPptx(Number((location.state as any)?.portfolioId || 1), sourceText);
  };

  return (
    <div className="h-full flex" style={{ background: '#050505' }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => navigate('/portfolio')} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={14} />
            {ko ? '포트폴리오로 돌아가기' : 'Back to portfolio'}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={publish} disabled={!documentId || busy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-xl disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Save size={12} />
              {ko ? '발행' : 'Publish'}
            </button>
            <button onClick={exportPptx} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 rounded-xl hover:text-white hover:bg-white/[0.05] transition-colors">
              <Download size={12} />
              PPTX
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="rounded-3xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-14">
                  <input value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 2))} className="w-full px-3 py-2 text-center rounded-xl text-lg bg-transparent text-zinc-200 outline-none" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div className="flex-1">
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder={ko ? '제목 없음' : 'Untitled'} className="w-full bg-transparent text-3xl font-black text-white outline-none" />
                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{sourceType === 'notion' ? 'Notion' : 'Notion'}</span>
                    <span>•</span>
                    <select value={category} onChange={e => setCategory(e.target.value as typeof category)} className="bg-transparent outline-none">
                      <option value="project">{ko ? '프로젝트' : 'Project'}</option>
                      <option value="portfolio">{ko ? '포트폴리오' : 'Portfolio'}</option>
                      <option value="troubleshooting">{ko ? '트러블슈팅' : 'Troubleshooting'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label={ko ? '배너' : 'Banner'}>
                  <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://" className="w-full px-3 py-2.5 text-sm rounded-xl text-zinc-200 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </FieldRow>
                <FieldRow label={ko ? '데이터베이스' : 'Database'}>
                  <input value={databaseName} onChange={e => setDatabaseName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl text-zinc-200 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </FieldRow>
                <FieldRow label={ko ? '속성' : 'Properties'}>
                  <input value={databaseProperties} onChange={e => setDatabaseProperties(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl text-zinc-200 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </FieldRow>
                <FieldRow label={ko ? '태그' : 'Tags'}>
                  <input value={tags} onChange={e => setTags(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl text-zinc-200 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </FieldRow>
              </div>
            </div>

            <div className="space-y-4">
              {blocks.map(block => (
                <BlockEditor key={block.id} block={block} onChange={updateBlock} onDelete={removeBlock} onToggleDone={toggleDone} />
              ))}
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map(item => (
                  <button key={item.type} onClick={() => addBlock(item.type)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
              <button onClick={() => addBlock('p')} className="w-full py-4 rounded-2xl text-sm text-zinc-600 hover:text-zinc-300 transition-colors" style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Plus size={14} className="inline mr-2" />
                {ko ? '새 블록 추가' : 'Add new block'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
