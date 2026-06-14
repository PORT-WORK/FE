import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../contexts/AppContext';

const HOME_COPY = {
  ko: {
    badge: 'PORT Project Builder',
    title: '\uD504\uB85C\uC81D\uD2B8\uB97C \uB9CC\uB4E4\uACE0\n\uAE00\uC4F0\uAE30 \uD750\uB984\uC744 \uBC14\uB85C \uC2DC\uC791\uD558\uC138\uC694',
    description: '\uD14D\uC2A4\uD2B8 \uC785\uB825 \uBC15\uC2A4\uB294 \uC81C\uAC70\uD558\uACE0, \uD504\uB85C\uC81D\uD2B8 \uC0DD\uC131\uB9CC \uBE60\uB974\uAC8C \uC2DC\uC791\uD560 \uC218 \uC788\uAC8C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4.',
    action: '\uD504\uB85C\uC81D\uD2B8 \uC0DD\uC131\uD558\uAE30',
  },
  en: {
    badge: 'PORT Project Builder',
    title: 'Create a project and\nstart writing right away',
    description: 'The prompt box has been removed so you can start a new project faster.',
    action: 'Create project',
  },
} as const;

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn, language } = useApp();
  const copy = language === 'ko' ? HOME_COPY.ko : HOME_COPY.en;

  const handleCreateProject = (role?: 'PM') => {
    navigate(isLoggedIn ? `/workspace?create=1${role ? `&role=${role}` : ''}` : '/login');
  };

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16" style={{ background: '#050505' }}>
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.02] px-8 py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-10 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-blue-600/18 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
            <Sparkles size={11} className="text-violet-400" />
            {copy.badge}
          </div>

          <h1 className="whitespace-pre-line text-4xl font-black leading-tight text-white sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">{copy.description}</p>

          <button
            type="button"
            onClick={() => handleCreateProject()}
            className="mt-10 inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.32)' }}
          >
            {copy.action}
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleCreateProject('PM')}
            className="mt-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300"
          >
            PM start
          </button>
        </div>
      </div>
    </div>
  );
}
