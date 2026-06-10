import { useState } from 'react';
import { ArrowRight, Database, EyeOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../contexts/AppContext';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-6">
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['7d', '30d', '90d'] as const).map(label => (
              <button
                key={label}
                onClick={() => setPeriod(label)}
                className="px-3.5 py-2 text-xs font-medium transition-all"
                style={{ background: period === label ? 'rgba(124,58,237,0.2)' : 'transparent', color: period === label ? '#a78bfa' : '#71717a', borderRight: label !== '90d' ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Database size={26} className="text-violet-400" />
          </div>
          <p className="text-lg font-semibold text-white mb-2">{ko ? '분석 데이터가 없습니다' : 'No analytics data yet'}</p>
          <p className="text-sm text-zinc-600 max-w-xl mx-auto mb-6">
            {ko
              ? '현재 백엔드에 노출된 공개 분석 API가 없어 자리표시자 숫자는 보여주지 않습니다.'
              : 'The backend does not currently expose a public analytics API, so we are not showing placeholder numbers here.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/portfolio')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              {ko ? '포트폴리오로 이동' : 'Go to portfolio'} <ArrowRight size={14} />
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-zinc-400" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <RefreshCw size={14} />{ko ? '새로고침' : 'Refresh'}
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-700">
            <EyeOff size={12} />
            {ko ? '데이터가 준비되면 차트가 표시됩니다.' : 'Charts will appear once real data is wired.'}
          </div>
        </div>
      </div>
    </div>
  );
}
