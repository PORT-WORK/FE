import { useMemo, useState } from 'react';
import { Check, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { exportPortfolioPptx } from '../../../../api/contentApi';

type Article = { id: string; title: string; category: string; projectId: string };

const DEFAULT_ARTS: Article[] = [
  { id: 'd1', title: '?뚮뜑留?理쒖쟻????React.memo? useMemo ?꾨왂', category: '?몃윭釉붿뒋??, projectId: 'p1' },
  { id: 'd2', title: 'API 罹먯떛 ?꾨왂 ??SWR vs React Query', category: '?몃윭釉붿뒋??, projectId: 'p1' },
  { id: 'd3', title: 'Frontend Lead濡쒖꽌???섏궗寃곗젙 怨쇱젙', category: '留≪? ??븷', projectId: 'p1' },
];

const PORTFOLIO_ID = 1;

export default function EditorExportModal({
  currentTitle,
  currentId,
  onClose,
}: {
  currentTitle: string;
  currentId: string | null;
  onClose: () => void;
}) {
  const stored: Article[] = JSON.parse(localStorage.getItem('port_articles') || '[]');
  const allArts = useMemo(() => [
    ...DEFAULT_ARTS,
    ...stored.filter(art => !DEFAULT_ARTS.some(base => base.id === art.id)),
  ], [stored]);

  const [selected, setSelected] = useState<Set<string>>(new Set(currentId ? [currentId] : []));
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const selectedArticles = allArts.filter(art => selected.has(art.id));
  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(selected.size === allArts.length ? new Set() : new Set(allArts.map(a => a.id)));

  const doExport = async () => {
    if (selectedArticles.length === 0) return;
    setExporting(true);
    try {
      const blob = await exportPortfolioPptx(PORTFOLIO_ID);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentTitle || 'portfolio').replace(/[\\/:*?"<>|]/g, '_')}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white">?ы듃?대━???대낫?닿린</p>
          <button onClick={onClose} className="p-1.5 text-zinc-600 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
            <X size={14} />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-10 text-center">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">PPTX ?대낫?닿린 ?꾨즺!</p>
            <p className="text-xs text-zinc-600">{selected.size}媛?臾몄꽌媛 諛깆뿏?쒖뿉???앹꽦?섏뿀?듬땲??</p>
            <button onClick={onClose} className="mt-5 px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>?リ린</button>
          </div>
        ) : (
          <>
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">?대낫?닿린 ?뺤떇</p>
              <div className="rounded-xl px-3 py-2 text-xs text-violet-300" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
                諛깆뿏??`PPTX` export API ?ъ슜
              </div>
            </div>

            <div className="px-5 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">臾몄꽌 ?좏깮</p>
                <button onClick={toggleAll} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                  {selected.size === allArts.length ? '?꾩껜 ?댁젣' : '?꾩껜 ?좏깮'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5 min-h-0">
              {allArts.map(art => (
                <div
                  key={art.id}
                  onClick={() => toggle(art.id)}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: selected.has(art.id) ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected.has(art.id) ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}` }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all" style={{ background: selected.has(art.id) ? '#7c3aed' : 'rgba(255,255,255,0.06)', border: `1px solid ${selected.has(art.id) ? '#7c3aed' : 'rgba(255,255,255,0.1)'}` }}>
                    {selected.has(art.id) && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{art.title}</p>
                    <p className="text-[10px] text-zinc-600">{art.category}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-600">{selected.size}媛?臾몄꽌 ?좏깮??/span>
                <span className="text-[10px] text-zinc-700">諛깆뿏?쒖뿉??PPTX ?앹꽦</span>
              </div>
              <button
                onClick={doExport}
                disabled={exporting || selected.size === 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: selected.size > 0 ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.05)', opacity: exporting ? 0.7 : 1, boxShadow: selected.size > 0 ? '0 0 20px rgba(124,58,237,0.3)' : 'none' }}
              >
                {exporting ? '?대낫?대뒗 以?..' : 'PPTX濡??대낫?닿린'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

