import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, ChevronRight, Globe, Loader2, RefreshCw, Sparkles, Wand } from 'lucide-react';
import { exportPortfolioPptx, fetchPortfolioData, listMyPortfolios, type PortfolioDataResponse, type PortfolioSummary } from '../../api/contentApi';
import PortfolioSelectionModal from './ui/PortfolioSelectionModal';

type Selection = {
  portfolioId: number;
  projectIds: number[];
  categories: string[];
  articleIds: string[];
};

const STEPS = [
  { label: 'Choose portfolio', detail: 'Pick the portfolio to build from.' },
  { label: 'Select projects', detail: 'Pick the projects you want AI to use.' },
  { label: 'Sort posts', detail: 'Choose the Notion posts and their order.' },
  { label: 'AI builds JSON', detail: 'The backend turns the source into structured slide JSON.' },
  { label: 'Export PPTX', detail: 'The PPTX is generated and downloaded.' },
];

function buildSourceText(data: PortfolioDataResponse, selection: Selection, notes: string) {
  const selectedProjectIds = new Set(selection.projectIds);
  const selectedArticleIds = new Set(selection.articleIds.map(String));

  const projectText = data.projects
    .filter(item => selectedProjectIds.has(item.project.id))
    .map(item => [
      `Project: ${item.project.name}`,
      `Role: ${item.project.role}`,
      `Summary: ${item.project.summary || ''}`,
      `Skills: ${Array.isArray(item.project.skills) ? item.project.skills.join(', ') : item.project.skills || ''}`,
    ].join('\n'))
    .join('\n\n');

  const articleText = data.projects
    .flatMap(item => item.documents.map(doc => ({
      project: item.project,
      document: doc.document,
      blocks: doc.blocks,
    })))
    .filter(item => selectedArticleIds.has(String(item.document.id)))
    .map(item => {
      const blockText = item.blocks
        .map(block => {
          const content = block.content && typeof block.content === 'object'
            ? Object.values(block.content).filter(Boolean).join(' ')
            : '';
          return content.trim();
        })
        .filter(Boolean)
        .join('\n');

      return [
        `Post: ${item.document.title}`,
        `Project: ${item.project.name}`,
        `Category: ${item.document.category}`,
        `Content: ${blockText}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    `Portfolio: ${data.portfolio.title}`,
    selection.categories.length ? `Categories: ${selection.categories.join(', ')}` : '',
    projectText,
    articleText,
    notes.trim(),
  ].filter(Boolean).join('\n\n---\n\n');
}

export default function AIGeneratePage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    listMyPortfolios().then(items => {
      if (!alive) return;
      setPortfolios(items);
      setSelectedPortfolioId(items[0]?.id ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!busy) return;
    const total = 6000;
    const tick = 80;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(100, (elapsed / total) * 100));
      setStep(Math.min(STEPS.length - 1, Math.floor((elapsed / total) * STEPS.length)));
      if (elapsed >= total) {
        clearInterval(timer);
        setDone(true);
        setBusy(false);
      }
    }, tick);
    return () => clearInterval(timer);
  }, [busy]);

  const selectedPortfolio = useMemo(() => portfolios.find(item => item.id === selectedPortfolioId) || null, [portfolios, selectedPortfolioId]);

  const selectionSummary = useMemo(() => {
    if (!selection) return [];
    return [
      `Portfolio: ${selectedPortfolio?.title || 'Not selected'}`,
      `Projects: ${selection.projectIds.length}`,
      `Categories: ${selection.categories.length}`,
      `Posts: ${selection.articleIds.length}`,
    ];
  }, [selection, selectedPortfolio?.title]);

  const startGeneration = async (nextSelection?: Selection) => {
    const finalSelection = nextSelection || selection;
    if (!finalSelection) return;
    const portfolioId = finalSelection.portfolioId;

    setSelectedPortfolioId(portfolioId);
    setSelection(finalSelection);
    setDone(false);
    setBusy(true);
    setLogLines([
      'Loading selected portfolio data...',
      'Collecting projects and documents...',
      'Preparing ordered Notion source text...',
      'Sending source text to AI layout generator...',
      'Building PPTX from generated JSON...',
    ]);

    try {
      const data = await fetchPortfolioData(portfolioId);
      const sourceText = buildSourceText(data, finalSelection, notes);
      const blob = await exportPortfolioPptx(portfolioId, sourceText);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-${portfolioId}.pptx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setBusy(false);
      setDone(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden" style={{ background: '#050505' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <PortfolioSelectionModal
        open={selectorOpen}
        portfolios={portfolios}
        defaultPortfolioId={selectedPortfolioId}
        onClose={() => setSelectorOpen(false)}
        onConfirm={async nextSelection => {
          setSelectorOpen(false);
          await startGeneration(nextSelection);
        }}
      />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="rounded-3xl p-6 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Sparkles size={12} />
                포트폴리오 제작
              </div>
              <h2 className="text-2xl font-black text-white">포트폴리오 만들기</h2>
              <p className="text-sm text-zinc-600 mt-1.5">프로젝트와 Notion 글을 선택하면 backend가 JSON을 만들고 PPTX로 변환합니다.</p>
            </div>
            <button onClick={() => navigate('/portfolio')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              선택 <ChevronRight size={11} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {selectionSummary.map(item => (
                <div key={item} className="rounded-2xl p-4 text-sm text-zinc-400" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">선택된 소스</p>
                  <p className="text-sm text-zinc-300 mt-1">포트폴리오 안의 프로젝트와 Notion 글을 모아서 AI 입력으로 보냅니다.</p>
                </div>
                <button
                  onClick={() => setSelectorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  <Sparkles size={12} />
                  포트폴리오 만들기
                </button>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="추가로 AI에게 전달할 노트를 적어주세요."
                rows={6}
                className="w-full rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              <p className="mt-2 text-xs text-zinc-600">선택한 프로젝트, 분류, 게시글 순서가 모두 sourceText에 포함됩니다.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-6 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', filter: 'blur(16px)', opacity: 0.5 }} />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}>
                <Sparkles size={26} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white text-center">{done ? '포트폴리오가 생성되었습니다' : '포트폴리오를 만드는 중'}</h2>
            <p className="text-sm text-zinc-600 mt-1.5 text-center">{done ? 'PPTX 파일이 다운로드되었습니다.' : 'AI가 JSON 레이아웃을 만들고 PPTX로 내보냅니다.'}</p>
          </div>

          <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="space-y-3.5">
              {STEPS.map((item, idx) => {
                const isDone = idx < step || done;
                const isActive = idx === step && !done;
                return (
                  <div key={item.label} className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {isDone
                        ? <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)' }}><Check size={13} className="text-emerald-400" /></div>
                        : isActive
                          ? <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)' }}><Loader2 size={13} className="text-violet-400 animate-spin" /></div>
                          : <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}><div className="w-2 h-2 rounded-full bg-zinc-800" /></div>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDone ? 'text-emerald-300 line-through decoration-emerald-900' : isActive ? 'text-white' : 'text-zinc-600'}`}>{item.label}</p>
                      {isActive && <p className="text-xs text-violet-400 mt-0.5">{item.detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-xs text-zinc-600 mb-2">
              <span>Progress</span>
              <span className="font-mono text-violet-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all duration-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)', boxShadow: '0 0 10px rgba(124,58,237,0.6)' }} />
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 font-mono text-[11px] leading-loose min-h-[120px]" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {logLines.map((log, idx) => (
              <div key={log} style={{ color: idx === logLines.length - 1 ? 'rgba(74,222,128,0.9)' : 'rgba(74,222,128,0.35)' }}>{log}</div>
            ))}
            {busy && <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ background: '#4ade80' }} />}
          </div>

          {done ? (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/portfolio')} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
                <Wand size={14} />Edit in workspace
              </button>
              <button className="flex items-center gap-1.5 px-4 py-3 text-sm text-zinc-400 rounded-xl transition-all hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <Globe size={13} />Publish
              </button>
              <button onClick={() => void startGeneration()} className="p-3 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectorOpen(true)}
              disabled={busy}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
            >
              포트폴리오 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
