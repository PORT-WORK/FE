import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Check, Loader2, Wand, Globe, RefreshCw } from 'lucide-react';

const STEPS = [
  { label: 'Scan GitHub', detail: 'Analyze repositories and commits...' },
  { label: 'Read blog content', detail: 'Extract tone and topic patterns...' },
  { label: 'Build structure', detail: 'Draft a clean portfolio outline...' },
  { label: 'Generate story', detail: 'Write sections that match your work...' },
  { label: 'Polish UI copy', detail: 'Make titles and labels consistent...' },
  { label: 'Finish portfolio', detail: 'Your portfolio is ready.' },
];

const LOGS = [
  'Connecting GitHub...',
  'Scanning repositories...',
  'Parsing commits and README files...',
  'Analyzing article content...',
  'Drafting section hierarchy...',
  'Formatting final portfolio structure...',
];

export default function AIGeneratePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logIdx, setLogIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const total = 5000;
    const tick = 60;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += tick;
      setProgress(Math.min(100, (elapsed / total) * 100));
      setStep(Math.min(STEPS.length - 1, Math.floor((elapsed / total) * STEPS.length)));
      setLogIdx(Math.min(LOGS.length - 1, Math.floor((elapsed / total) * LOGS.length)));
      if (elapsed >= total) {
        clearInterval(timer);
        setDone(true);
      }
    }, tick);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden" style={{ background: '#050505' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', filter: 'blur(16px)', opacity: 0.5 }} />
            <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}>
              <Sparkles size={26} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white text-center">{done ? 'Portfolio generated' : 'Generating portfolio'}</h2>
          <p className="text-sm text-zinc-600 mt-1.5 text-center">{done ? 'Your portfolio draft is ready.' : 'AI is assembling your structure and copy.'}</p>
        </div>

        <div className="rounded-2xl p-6 mb-5 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
          {LOGS.slice(0, logIdx + 1).map((log, idx) => (
            <div key={log} style={{ color: idx === logIdx ? 'rgba(74,222,128,0.9)' : 'rgba(74,222,128,0.35)' }}>{log}</div>
          ))}
          {!done && <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ background: '#4ade80' }} />}
        </div>

        {done ? (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/workspace')} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.4)' }}>
              <Wand size={14} />Edit in workspace
            </button>
            <button className="flex items-center gap-1.5 px-4 py-3 text-sm text-zinc-400 rounded-xl transition-all hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <Globe size={13} />Publish
            </button>
            <button className="p-3 text-zinc-500 hover:text-zinc-300 rounded-xl transition-all hover:bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button onClick={() => navigate(-1)} className="text-xs transition-colors hover:text-red-400" style={{ color: 'rgba(239,68,68,0.5)' }}>
              Cancel generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
