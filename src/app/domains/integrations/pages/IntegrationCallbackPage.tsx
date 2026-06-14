import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { connectIntegration } from '../../../api/contentApi';
import { clearAuthTokens, getAccessToken, setAccessToken, setRefreshToken } from '../../../api/client';
import { refreshAuthToken } from '../../../api/contentApi';
import { integrationProviderLabel, normalizeIntegrationProviderKey, type IntegrationProviderKey } from '../../../api/integrationProviders';

const WORKSPACE_URL_KEY = 'port-integration-workspace-url';

function normalizeProvider(value: string | null): IntegrationProviderKey | null {
  return normalizeIntegrationProviderKey(value);
}

export default function IntegrationCallbackPage({ provider }: { provider: IntegrationProviderKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const startedRef = useRef(false);

  useEffect(() => {
    const resolvedProvider = normalizeProvider(provider);
    if (!resolvedProvider || startedRef.current) {
      if (!resolvedProvider) {
        setStatus('error');
        setMessage('Unsupported provider.');
      }
      return;
    }

    startedRef.current = true;

    let alive = true;
    const timer = { id: 0 };
    const code = searchParams.get('code');
    const callbackProvider = normalizeProvider(location.pathname.split('/')[2] ?? null);
    const nextProvider = callbackProvider ?? resolvedProvider;
    const workspaceUrl = searchParams.get('workspaceUrl') || sessionStorage.getItem(`${WORKSPACE_URL_KEY}:${nextProvider}`) || undefined;

    const run = async () => {
      if (!code) {
        setStatus('error');
        setMessage('Authorization code was not returned.');
        return;
      }

      if (!getAccessToken()) {
        try {
          clearAuthTokens();
          const token = await refreshAuthToken();
          if (token.accessToken) setAccessToken(token.accessToken);
          if (token.refreshToken) setRefreshToken(token.refreshToken);
        } catch {
          if (!alive) return;
          setStatus('error');
          setMessage('로그인 토큰을 확인하지 못했습니다. 다시 로그인해주세요.');
          return;
        }
      }

      try {
        await connectIntegration(nextProvider, code, workspaceUrl);
        if (!alive) return;
        setStatus('success');
        setMessage(`${integrationProviderLabel(nextProvider)} connected successfully.`);
        timer.id = window.setTimeout(() => {
          navigate('/settings', { replace: true });
        }, 700);
      } catch {
        if (!alive) return;
        setStatus('error');
        setMessage(`Failed to connect ${integrationProviderLabel(nextProvider)}.`);
      }
    };

    void run();

    return () => {
      alive = false;
      if (timer.id) window.clearTimeout(timer.id);
    };
  }, [location.pathname, navigate, provider, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
          {status === 'success' ? <CheckCircle2 size={28} /> : status === 'error' ? <ShieldAlert size={28} /> : <Loader2 size={28} className="animate-spin" />}
        </div>
        <h1 className="mt-5 text-2xl font-black text-white">
          {status === 'success' ? '연동 완료' : status === 'error' ? '연동 실패' : '연동 처리 중'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{message || '잠시만 기다려주세요.'}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          {status === 'error' ? (
            <button
              type="button"
              onClick={() => navigate('/settings', { replace: true })}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.07]"
            >
              설정으로 이동
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate('/settings', { replace: true })}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
