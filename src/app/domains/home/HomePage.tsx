import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, ArrowRight, Check, Zap } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const STEPS = [
  { label: 'Connect data', detail: 'Import project, blog, and skill data.' },
  { label: 'Analyze work', detail: 'AI summarizes your experience into sections.' },
  { label: 'Generate portfolio', detail: 'Produce a polished portfolio in minutes.' },
];

const TEMPLATES = [
  { id: 'dev', label: 'Developer', emoji: '💻', desc: 'Tech-focused portfolio' },
  { id: 'design', label: 'Designer', emoji: '🎨', desc: 'Visual-first portfolio' },
  { id: 'pm', label: 'PM', emoji: '📋', desc: 'Product story portfolio' },
];

const PRO_FEATURES = [
  'Unlimited AI generation',
  'Premium templates',
  'Notion/GitHub sync',
  'Realtime analytics',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { setPayModal } = useApp();
  const [input, setInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(prev => (prev + 1) % STEPS.length), 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-full px-8 py-16" style={{ background: '#050505' }}>
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] p-10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          </div>
          <div className="relative text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
              <Sparkles size={11} className="text-violet-400" />
              AI portfolio builder
            </div>

            <h1 className="mb-4 text-5xl font-black leading-tight text-white">
              Build a portfolio
              <br />
              <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                with AI in minutes
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Connect your work history, project data, and blog content. We turn it into a clean portfolio structure automatically.
            </p>

            <div className="mx-auto mb-4 flex max-w-2xl items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
              <Sparkles size={16} className="ml-4 text-violet-400" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && navigate('/generate')}
                placeholder="Describe your background and strengths..."
                className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder-zinc-700 focus:outline-none"
              />
              <button
                onClick={() => navigate('/generate')}
                className="m-1.5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Generate <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-5 text-xs text-zinc-600">
              <span className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />14k portfolios created</span>
              <span>4.9/5 rating</span>
              <span>Free to start</span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5" style={{ background: activeStep === index ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)' }}>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{index + 1}</div>
                <span className="text-sm font-semibold text-white">{step.label}</span>
              </div>
              <p className="text-xs text-zinc-500">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => navigate('/generate')}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-2 text-2xl">{template.emoji}</div>
              <p className="mb-1 text-sm font-semibold text-white">{template.label}</p>
              <p className="text-xs text-zinc-500">{template.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-7">
            <p className="mb-3 text-xs uppercase tracking-wider text-zinc-600">Free</p>
            <div className="mb-5 flex items-end gap-2">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="mb-1 text-sm text-zinc-600">/ month</span>
            </div>
            <ul className="mb-6 space-y-2">
              {['3 portfolios', 'Basic AI generation', '10 templates', '1GB storage'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-500">
                  <Check size={13} className="text-zinc-700" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-zinc-400">Start free</button>
          </div>

          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600" />
            <div className="relative rounded-2xl bg-[#0d0d0d] p-7">
              <div className="mb-3 flex items-start justify-between">
                <p className="text-xs uppercase tracking-wider text-violet-400">Pro</p>
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">Popular</span>
              </div>
              <div className="mb-5 flex items-end gap-2">
                <span className="text-4xl font-black text-white">$12.99</span>
                <span className="mb-1 text-sm text-zinc-500">/ month</span>
              </div>
              <ul className="mb-6 space-y-2">
                {PRO_FEATURES.map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check size={13} className="text-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setPayModal(true)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-sm font-bold text-white">
                Try Pro
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-zinc-700">
          <Zap size={12} />
          AI-generated content is for reference. Review before publishing.
        </div>
      </div>
    </div>
  );
}
