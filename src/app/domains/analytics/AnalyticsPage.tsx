import { useState } from 'react';
import { ArrowRight, Database, EyeOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';

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

        <EmptyStatePanel
          emoji="📊"
          title={ko ? '분석 데이터가 없습니다' : 'No analytics data yet'}
          description={ko
            ? '현재 백엔드에 노출된 공개 분석 API가 없어 자리표시자 숫자는 보여주지 않습니다.'
            : 'The backend does not currently expose a public analytics API, so we are not showing placeholder numbers here.'}
          actionLabel={ko ? '포트폴리오로 이동' : 'Go to portfolio'}
          onAction={() => navigate('/portfolio')}
          accent="blue"
        />
      </div>
    </div>
  );
}
