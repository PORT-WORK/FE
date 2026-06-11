import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { buildOauthLoginUrl } from '../../api/client';

export default function LoginPage() {
  const { t, isLoggedIn, authReady } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [authReady, isLoggedIn, navigate]);

  const handleLogin = (provider: 'kakao' | 'google') => {
    localStorage.removeItem('port-auth-logged-out');
    window.location.assign(buildOauthLoginUrl(provider));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050505' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-2/3 left-1/3 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">PORT</h1>
          <p className="text-sm text-zinc-500">{t('login_subtitle')}</p>
        </div>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-bold text-white text-center mb-2">{t('login_title')}</h2>
          <p className="text-xs text-zinc-600 text-center mb-8">Sign in to sync your profile and AI usage.</p>

          <button onClick={() => handleLogin('kakao')} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-bold mb-3 transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ background: '#FEE500', color: '#191919' }}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[11px] font-black">K</span>
            {t('login_kakao')}
          </button>

          <button onClick={() => handleLogin('google')} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold mb-6 transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ background: 'white', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="relative flex h-5 w-5 items-center justify-center rounded-full overflow-hidden" aria-hidden="true">
              <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(#ea4335 0 25%, #fbbc05 25% 50%, #34a853 50% 75%, #4285f4 75% 100%)' }} />
              <span className="absolute inset-1 rounded-full bg-white" />
              <span className="relative text-[10px] font-black text-zinc-700">G</span>
            </span>
            {t('login_google')}
          </button>
        </div>
      </div>
    </div>
  );
}
