import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, ArrowRight, Check, Zap } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const HOME_COPY = {
  ko: {
    badge: 'AI 포트폴리오 빌더',
    titleMain: '아이디어를 수집하면',
    titleAccent: 'AI가 포트폴리오로 조립합니다',
    subtitle: '프로젝트, 글, 작업 기록을 연결하면 AI가 포트폴리오 구조로 자동 정리합니다.',
    placeholder: '배경과 강점을 입력해보세요...',
    action: '생성',
    steps: [
      { label: '데이터 연결', detail: '프로젝트, 글, 기술 데이터를 연결합니다.' },
      { label: '작업 분석', detail: 'AI가 경력을 섹션 단위로 정리합니다.' },
      { label: '포트폴리오 생성', detail: '정리된 내용을 PPTX로 만듭니다.' },
    ],
    templates: [
      { id: 'dev', label: '개발자', emoji: '💻', desc: '기술 중심 포트폴리오' },
      { id: 'design', label: '디자이너', emoji: '🎨', desc: '시각 중심 포트폴리오' },
      { id: 'pm', label: 'PM', emoji: '📋', desc: '제품 이야기 중심 포트폴리오' },
    ],
    free: ['3 포트폴리오 파일 저장', '3회 AI 포트폴리오 제작'],
    freeBtn: '무료 시작',
    proBtn: 'Pro 시작',
    proFeatures: ['10 포트폴리오 파일 저장', '30회 AI 포트폴리오 제작'],
    footer: 'AI 생성 결과는 참고용입니다. 발행 전 반드시 검토하세요.',
    pricing: { free: '무료', pro: 'Popular' },
  },
  en: {
    badge: 'AI Portfolio Builder',
    titleMain: 'Turn your ideas into',
    titleAccent: 'a portfolio with AI',
    subtitle: 'Connect projects, posts, and work logs and AI will organize them into a clean portfolio structure.',
    placeholder: 'Describe your background and strengths...',
    action: 'Generate',
    steps: [
      { label: 'Connect data', detail: 'Import project, blog, and skill data.' },
      { label: 'Analyze work', detail: 'AI summarizes your experience into sections.' },
      { label: 'Generate portfolio', detail: 'Produce a polished portfolio in minutes.' },
    ],
    templates: [
      { id: 'dev', label: 'Developer', emoji: '💻', desc: 'Tech-focused portfolio' },
      { id: 'design', label: 'Designer', emoji: '🎨', desc: 'Visual-first portfolio' },
      { id: 'pm', label: 'PM', emoji: '📋', desc: 'Product story portfolio' },
    ],
    free: ['3 portfolio files stored', '3 AI portfolio generations'],
    freeBtn: 'Start free',
    proBtn: 'Try Pro',
    proFeatures: ['10 portfolio files stored', '30 AI portfolio generations'],
    footer: 'AI-generated content is for reference. Review before publishing.',
    pricing: { free: 'Free', pro: 'Popular' },
  },
} as const;

export default function HomePage() {
  const navigate = useNavigate();
  const { setPayModal, isLoggedIn, language } = useApp();
  const [input, setInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const ko = language === 'ko';
  const copy = ko ? HOME_COPY.ko : HOME_COPY.en;

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(prev => (prev + 1) % copy.steps.length), 1800);
    return () => clearInterval(timer);
  }, [copy.steps.length]);

  const handleGenerate = () => {
    navigate(isLoggedIn ? '/generate' : '/login');
  };

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
              {copy.badge}
            </div>

            <h1 className="mb-4 text-5xl font-black leading-tight text-white">
              {copy.titleMain}
              <br />
              <span style={{ background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {copy.titleAccent}
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-zinc-500">{copy.subtitle}</p>

            <div className="mx-auto mb-4 flex max-w-2xl items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
              <Sparkles size={16} className="ml-4 mt-4 text-violet-400" />
              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`;
                }}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
                }}
                placeholder={copy.placeholder}
                rows={2}
                className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder-zinc-700 focus:outline-none resize-none min-h-[76px] max-h-32"
              />
              <button
                onClick={handleGenerate}
                className="m-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white"
              >
                {copy.action} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => (
            <div
              key={step.label}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
              style={{ background: activeStep === index ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-zinc-300">{index + 1}</div>
                <span className="text-sm font-semibold text-white">{step.label}</span>
              </div>
              <p className="text-xs text-zinc-500">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {copy.templates.map(template => (
            <button
              key={template.id}
              onClick={handleGenerate}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-2 text-2xl">{template.emoji}</div>
              <p className="mb-1 text-sm font-semibold text-white">{template.label}</p>
              <p className="text-xs text-zinc-500">{template.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border p-7" style={{ borderColor: 'rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.06)' }}>
            <p className="mb-3 text-xs uppercase tracking-wider text-violet-300">{copy.pricing.free}</p>
            <div className="mb-5 flex items-end gap-2">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="mb-1 text-sm text-zinc-600">/ month</span>
            </div>
            <ul className="mb-6 space-y-2">
              {copy.free.map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <Check size={13} className="text-violet-400" />
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/login')} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              {copy.freeBtn}
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600" />
            <div className="relative rounded-2xl bg-[#0d0d0d] p-7">
              <div className="mb-3 flex items-start justify-between">
                <p className="text-xs uppercase tracking-wider text-violet-400">Pro</p>
                <span className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">{copy.pricing.pro}</span>
              </div>
              <div className="mb-5 flex items-end gap-2">
                <span className="text-4xl font-black text-white">$12.99</span>
                <span className="mb-1 text-sm text-zinc-500">/ month</span>
              </div>
              <ul className="mb-6 space-y-2">
                {copy.proFeatures.map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check size={13} className="text-violet-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setPayModal(true)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-2.5 text-sm font-bold text-white">
                {copy.proBtn}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-zinc-700">
          <Zap size={12} />
          {copy.footer}
        </div>
      </div>
    </div>
  );
}
