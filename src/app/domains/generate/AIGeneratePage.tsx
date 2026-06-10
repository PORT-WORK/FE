import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Loader2, Sparkles, Wand, Globe, RefreshCw, ChevronRight } from 'lucide-react';
import { exportPortfolioPptx, listMyPortfolios, listPortfolioProjects, type PortfolioSummary, type ProjectItem } from '../../api/contentApi';

const STEPS = [
  { label: 'Choose portfolio', detail: 'Pick the portfolio to build from.' },
  { label: 'Select projects', detail: 'Pick the projects you want AI to use.' },
  { label: 'Collect source text', detail: 'Combine user-written notes, Notion pages, or direct drafts.' },
  { label: 'AI builds JSON', detail: 'The backend turns the source into structured slide JSON.' },
  { label: 'Export PPTX', detail: 'The PPTX is generated and downloaded.' },
];

function buildSourceText(portfolio: PortfolioSummary | null, projects: ProjectItem[], notes: string) {
  const projectText = projects.map(project => [
    `Project: ${project.name}`,
    `Role: ${project.role}`,
    `Summary: ${project.summary || ''}`,
    `Skills: ${project.skills.join(', ')}`,
  ].join('\n')).join('\n\n');

  return [
    portfolio ? `Portfolio: ${portfolio.title}` : '',
    projectText,
    notes.trim(),
  ].filter(Boolean).join('\n\n---\n\n');
}

export default function AIGeneratePage() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    listMyPortfolios().then(items => {
      if (!alive) return;
      setPortfolios(items);
      if (items[0]) setSelectedPortfolioId(items[0].id);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPortfolioId) {
      setProjects([]);
      return;
    }
    let alive = true;
    listPortfolioProjects(selectedPortfolioId).then(items => {
      if (alive) setProjects(items);
    });
    return () => {
      alive = false;
    };
  }, [selectedPortfolioId]);

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
  const selectedProjects = useMemo(() => projects.filter(project => selectedProjectIds.has(project.id)), [projects, selectedProjectIds]);

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev => {
      const next = new Set(prev);
      next.has(projectId) ? next.delete(projectId) : next.add(projectId);
      return next;
    });
  };

  const startGeneration = async () => {
    if (!selectedPortfolioId) return;
    setDone(false);
    setBusy(true);
    setLogLines([
      'Loading selected portfolio...',
      'Collecting project data...',
      'Preparing user-written source text...',
      'Sending source text to AI layout generator...',
      'Building PPTX from generated JSON...',
    ]);
    try {
      const sourceText = buildSourceText(selectedPortfolio, selectedProjects, notes);
      const blob = await exportPortfolioPptx(selectedPortfolioId, sourceText);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-${selectedPortfolioId}.pptx`;
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

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="rounded-3xl p-6 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Sparkles size={12} />
                AI portfolio generation
              </div>
              <h2 className="text-2xl font-black text-white">Generate from portfolio source materials</h2>
              <p className="text-sm text-zinc-600 mt-1.5">Select a portfolio, choose the projects, add direct notes or Notion text, then let the backend generate JSON and PPTX.</p>
            </div>
            <button onClick={() => navigate('/portfolio')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              Back to portfolio <ChevronRight size={11} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">1. Portfolio</p>
              <div className="grid grid-cols-2 gap-3">
                {portfolios.map(portfolio => (
                  <button
                    key={portfolio.id}
                    onClick={() => {
                      setSelectedPortfolioId(portfolio.id);
                      setSelectedProjectIds(new Set());
                    }}
                    className="rounded-2xl p-4 text-left transition-all"
                    style={{ background: selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedPortfolioId === portfolio.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}` }}
                  >
                    <p className="text-sm font-semibold text-white">{portfolio.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{portfolio.jobRole}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">2. Projects</p>
              <div className="space-y-2">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
                    style={{ background: selectedProjectIds.has(project.id) ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedProjectIds.has(project.id) ? 'rgba(37,99,235,0.25)' : 'rgba(255,255,255,0.07)'}` }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {selectedProjectIds.has(project.id) ? <Check size={14} className="text-violet-300" /> : String(project.name).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{project.role || 'Project role'} · {project.skills.join(', ') || 'No skills yet'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">3. Source text</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Paste user-written notes, Notion page text, or direct article content here."
                rows={6}
                className="w-full rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
              <p className="mt-2 text-xs text-zinc-600">The backend will convert this source text into slide JSON and then export the PPTX.</p>
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
            <h2 className="text-2xl font-black text-white text-center">{done ? 'Portfolio generated' : 'Generating portfolio'}</h2>
            <p className="text-sm text-zinc-600 mt-1.5 text-center">{done ? 'Your PPTX file has been downloaded.' : 'AI is assembling the JSON layout and exporting the deck.'}</p>
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
              <button onClick={startGeneration} className="p-3 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <RefreshCw size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => void startGeneration()}
              disabled={!selectedPortfolioId || selectedProjectIds.size === 0 || busy}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}
            >
              Generate PPTX
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
