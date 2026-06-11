import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Download, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { exportPortfolioPptx, fetchPortfolioData, listMyPortfolios, type PortfolioDataResponse, type PortfolioSummary } from '../../api/contentApi';
import PortfolioSelectionModal from './ui/PortfolioSelectionModal';

type Selection = {
  portfolioId: number;
  projectIds: number[];
  articleIds: string[];
};

const STEPS = [
  { label: '프로젝트 선택', detail: '선택한 프로젝트의 글들을 모읍니다.' },
  { label: '글 순서 정리', detail: '선택한 글을 원하는 순서대로 정렬합니다.' },
  { label: 'PPTX 생성', detail: 'AI가 JSON 레이아웃을 만들고 PPTX를 생성합니다.' },
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
    projectText,
    articleText,
    notes.trim(),
  ].filter(Boolean).join('\n\n---\n\n');
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
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
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void listMyPortfolios().then(items => {
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

    const total = 4500;
    const tick = 80;
    let elapsed = 0;

    const timer = window.setInterval(() => {
      elapsed += tick;
      const ratio = Math.min(1, elapsed / total);
      setProgress(ratio * 100);
      setStep(Math.min(STEPS.length - 1, Math.floor(ratio * STEPS.length)));

      if (elapsed >= total) {
        clearInterval(timer);
        setBusy(false);
        setDone(true);
      }
    }, tick);

    return () => clearInterval(timer);
  }, [busy]);

  const selectedPortfolio = useMemo(
    () => portfolios.find(item => item.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId],
  );

  const selectionSummary = useMemo(() => {
    if (!selection) return [];
    return [
      selectedPortfolio ? `${selectedPortfolio.title}` : '선택된 포트폴리오 없음',
      `프로젝트 ${selection.projectIds.length}개`,
      `게시글 ${selection.articleIds.length}개`,
    ];
  }, [selection, selectedPortfolio]);

  const previewItems = useMemo(() => {
    if (!selection) return [];
    return selection.articleIds.slice(0, 3).map((id, index) => ({
      id,
      label: `Slide ${index + 1}`,
    }));
  }, [selection]);

  const startGeneration = async (nextSelection?: Selection) => {
    const finalSelection = nextSelection || selection;
    if (!finalSelection) return;

    const portfolioId = finalSelection.portfolioId;
    setSelectedPortfolioId(portfolioId);
    setSelection(finalSelection);
    setDone(false);
    setBusy(true);
    setProgress(0);
    setStep(0);
    setError(null);
    setGeneratedBlob(null);
    setLogLines([
      '포트폴리오 데이터를 불러오는 중...',
      '선택한 프로젝트와 게시글을 정리하는 중...',
      'AI용 sourceText를 만드는 중...',
      'PPTX 생성 API를 호출하는 중...',
    ]);

    try {
      const data = await fetchPortfolioData(portfolioId);
      const sourceText = buildSourceText(data, finalSelection, notes);
      const blob = await exportPortfolioPptx(portfolioId, sourceText);
      setGeneratedBlob(blob);
      setLogLines([
        '포트폴리오 데이터를 불러오는 중...',
        '선택한 프로젝트와 게시글을 정리하는 중...',
        'AI용 sourceText를 만드는 중...',
        'PPTX 생성 완료. 미리보기를 준비하는 중...',
      ]);
    } catch {
      setBusy(false);
      setDone(false);
      setError('PPTX 생성에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const handleDownload = async () => {
    if (!generatedBlob || !selection) return;
    setDownloadBusy(true);

    try {
      const url = URL.createObjectURL(generatedBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `portfolio-${selection.portfolioId}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
      window.setTimeout(() => {
        navigate('/portfolio');
      }, 200);
    } finally {
      setDownloadBusy(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-8 py-16 relative overflow-hidden" style={{ background: '#050505' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <PortfolioSelectionModal
        open={selectorOpen}
        portfolioId={selectedPortfolioId}
        onClose={() => setSelectorOpen(false)}
        onConfirm={async nextSelection => {
          setSelectorOpen(false);
          await startGeneration(nextSelection);
        }}
      />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-6">
        <div className="rounded-3xl p-6 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <Sparkles size={12} />
                포트폴리오 생성
              </div>
              <h2 className="text-2xl font-black text-white">프로젝트와 글을 선택해 PPTX를 만듭니다</h2>
              <p className="text-sm text-zinc-600 mt-1.5">선택한 소스를 backend 생성 API에 넘기고, 완료되면 미리보기와 다운로드가 이어집니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selectionSummary.length > 0
                ? selectionSummary.map(item => (
                  <div
                    key={item}
                    className="rounded-2xl p-4 text-sm text-zinc-300"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {item}
                  </div>
                ))
                : (
                  <div className="sm:col-span-3 rounded-2xl p-4 text-sm text-zinc-500" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    아직 선택된 소스가 없습니다. 소스 선택 버튼을 눌러 프로젝트와 글을 골라주세요.
                  </div>
                )}
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">소스 선택</p>
                  <p className="text-sm text-zinc-300 mt-1">프로젝트 안의 글을 AI 입력값으로 만들어 PPTX로 변환합니다.</p>
                </div>
                <button
                  onClick={() => setSelectorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  <Sparkles size={12} />
                  소스 선택
                </button>
              </div>

              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="AI에게 전달할 추가 설명을 적어주세요."
                rows={7}
                className="w-full rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              <p className="mt-2 text-xs text-zinc-600">선택한 프로젝트, 게시글 순서, 추가 설명이 모두 sourceText에 포함됩니다.</p>
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
            <h2 className="text-2xl font-black text-white text-center">{done ? '포트폴리오 미리보기 준비 완료' : '포트폴리오를 만드는 중'}</h2>
            <p className="text-sm text-zinc-600 mt-1.5 text-center">
              {done ? '다운로드 버튼을 누르면 PPTX 파일이 저장됩니다.' : 'AI가 JSON 레이아웃을 만들고 PPTX로 내보내는 중입니다.'}
            </p>
          </div>

          <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="space-y-3.5">
              {STEPS.map((item, idx) => {
                const isDone = idx < step || done;
                const isActive = idx === step && !done;
                return (
                  <div key={item.label} className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {isDone ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)' }}>
                          <Check size={13} className="text-emerald-400" />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)' }}>
                          <Loader2 size={13} className="text-violet-400 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="w-2 h-2 rounded-full bg-zinc-800" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDone ? 'text-emerald-300' : isActive ? 'text-white' : 'text-zinc-600'}`}>
                        {item.label}
                      </p>
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
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)', boxShadow: '0 0 10px rgba(124,58,237,0.6)' }}
              />
            </div>
          </div>

          <div className="rounded-xl p-4 mb-5 font-mono text-[11px] leading-loose min-h-[120px]" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {logLines.map(log => (
              <div key={log} className="text-emerald-300/80">{log}</div>
            ))}
            {busy && <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ background: '#4ade80' }} />}
          </div>

          <div className="rounded-3xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">PPTX 미리보기</p>
              <span className="text-xs text-zinc-600">
                {generatedBlob ? formatBytes(generatedBlob.size) : '대기 중'}
              </span>
            </div>

            <div className="rounded-2xl p-4 min-h-[220px]" style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(124,58,237,0.18)' }}>
              {done ? (
                <div className="space-y-4">
                  <div className="rounded-2xl p-5 min-h-[120px]" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Cover slide</div>
                    <div className="text-2xl font-black text-white leading-tight">
                      {selection ? '프로젝트와 글로 만든 포트폴리오' : '포트폴리오'}
                    </div>
                    <p className="text-sm text-zinc-500 mt-3 max-w-md">
                      선택한 소스가 AI 레이아웃에 맞춰 정리된 뒤 PPTX 파일로 생성됩니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {previewItems.map(item => (
                      <div key={item.id} className="rounded-2xl p-3 min-h-[88px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[11px] text-violet-300 mb-2">{item.label}</p>
                        <div className="h-14 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(37,99,235,0.16))' }} />
                      </div>
                    ))}
                    {previewItems.length === 0 && (
                      <div className="col-span-3 rounded-2xl p-4 text-sm text-zinc-500" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        선택된 글이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center text-center">
                  <div>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.18)' }}>
                      <Wand2 size={20} className="text-violet-300" />
                    </div>
                    <p className="text-sm font-semibold text-white">미리보기는 생성이 끝나면 표시됩니다.</p>
                    <p className="text-xs text-zinc-600 mt-2">오른쪽 위의 선택 버튼으로 소스를 고른 뒤 생성을 시작하세요.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl p-4 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            {done ? (
              <>
                <button
                  onClick={() => void handleDownload()}
                  disabled={!generatedBlob || downloadBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
                >
                  <Download size={14} />
                  {downloadBusy ? '다운로드 중...' : '다운로드'}
                </button>
                <button
                  onClick={() => void startGeneration()}
                  disabled={busy || !selection}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-zinc-400 rounded-xl transition-all hover:text-white disabled:opacity-40"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <RefreshCw size={14} />
                  다시 생성
                </button>
              </>
            ) : (
              <button
                onClick={() => void startGeneration()}
                disabled={busy || !selection}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
              >
                <Wand2 size={14} className="inline-block mr-2" />
                포트폴리오 만들기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
