import { useState } from 'react';
import { TrendingUp, Users, Eye, Briefcase, ChevronDown, TrendingDown, Trophy } from 'lucide-react';

const PERIODS = ['7d', '30d', '90d'];

const STATS = [
  { label: 'Views', values: ['14,291', '3,840', '9,120'], deltas: ['+12%', '+5%', '+28%'], ups: [true, true, true], icon: <Eye size={16} />, color: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.2)', iconColor: '#a78bfa' },
  { label: 'Visitors', values: ['3,847', '1,023', '2,640'], deltas: ['+8%', '+2%', '+19%'], ups: [true, true, true], icon: <Users size={16} />, color: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)', iconColor: '#60a5fa' },
  { label: 'Inquiries', values: ['127', '34', '89'], deltas: ['+23%', '-4%', '+11%'], ups: [true, false, true], icon: <Briefcase size={16} />, color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', iconColor: '#34d399' },
  { label: 'Bookmarks', values: ['489', '132', '310'], deltas: ['+15%', '+7%', '+22%'], ups: [true, true, true], icon: <TrendingUp size={16} />, color: 'rgba(202,138,4,0.1)', border: 'rgba(202,138,4,0.2)', iconColor: '#fbbf24' },
];

const POPULAR = [
  { rank: 1, name: 'Portfolio Revamp', views: 5840, pct: 100 },
  { rank: 2, name: 'AI Recommendation System', views: 3210, pct: 55 },
  { rank: 3, name: 'Design System Case Study', views: 1840, pct: 31 },
];

const SOURCES = [
  { src: 'Direct', pct: 38 },
  { src: 'GitHub', pct: 27 },
  { src: 'LinkedIn', pct: 18 },
  { src: 'Google', pct: 10 },
  { src: 'Other', pct: 7 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(1);

  return (
    <div className="px-8 py-8 overflow-y-auto" style={{ background: '#050505', minHeight: '100%' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Analytics</h2>
            <p className="text-sm text-zinc-600">Simple overview of portfolio traffic and engagement.</p>
          </div>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {PERIODS.map((label, idx) => (
              <button
                key={label}
                onClick={() => setPeriod(idx)}
                className="px-3.5 py-2 text-xs font-medium transition-all"
                style={{ background: period === idx ? 'rgba(124,58,237,0.2)' : 'transparent', color: period === idx ? '#a78bfa' : '#71717a', borderRight: idx < PERIODS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {STATS.map(stat => {
            const value = stat.values[period];
            const delta = stat.deltas[period];
            const up = stat.ups[period];
            return (
              <div key={stat.label} className="p-5 rounded-2xl" style={{ background: stat.color, border: `1px solid ${stat.border}` }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: stat.iconColor, background: 'rgba(0,0,0,0.2)' }}>{stat.icon}</div>
                </div>
                <p className="text-2xl font-black text-white mb-2">{value}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: up ? '#34d399' : '#f87171' }}>
                    {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {delta}
                  </div>
                  <span className="text-[10px] text-zinc-700">vs previous period</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Visits trend</p>
              <span className="text-xs text-zinc-600">{PERIODS[period]}</span>
            </div>
            <div className="space-y-3">
              {[72, 58, 80, 66, 90, 86, 95].map((value, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-700 w-8">{idx + 1}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-semibold text-white mb-4">Traffic sources</p>
            <div className="space-y-3">
              {SOURCES.map(source => (
                <div key={source.src}>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                    <span>{source.src}</span>
                    <span className="text-zinc-500">{source.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{ width: `${source.pct}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} className="text-yellow-400" />
            <p className="text-sm font-semibold text-white">Top projects</p>
          </div>
          <div className="space-y-3">
            {POPULAR.map(project => (
              <div key={project.rank} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: project.rank === 1 ? 'rgba(234,179,8,0.15)' : 'rgba(148,163,184,0.1)', color: project.rank === 1 ? '#fbbf24' : '#94a3b8' }}>
                  {project.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate mb-1.5">{project.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${project.pct}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)' }} />
                    </div>
                    <span className="text-[10px] text-zinc-600 flex-shrink-0 flex items-center gap-1"><Eye size={9} />{project.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
