import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { fetchCurrentUser } from '../../api/contentApi';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('로그인 정보를 확인하는 중입니다...');

  useEffect(() => {
    let alive = true;

    void fetchCurrentUser()
      .then(() => {
        if (!alive) return;
        setMessage('로그인이 완료되었습니다. 이동합니다...');
        setTimeout(() => {
          if (alive) navigate('/', { replace: true });
        }, 500);
      })
      .catch(() => {
        if (!alive) return;
        setMessage('로그인에 실패했습니다. 다시 시도해 주세요.');
        setTimeout(() => {
          if (alive) navigate('/login', { replace: true });
        }, 1200);
      });

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050505' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
        >
          <CheckCircle2 size={24} className="text-white" />
        </div>
        <h1 className="text-lg font-bold text-white">PORT 로그인</h1>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400">
          <Loader2 size={13} className="animate-spin" />
          OAuth callback
        </div>
      </div>
    </div>
  );
}
