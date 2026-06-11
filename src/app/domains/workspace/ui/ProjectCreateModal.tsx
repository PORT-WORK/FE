import { useMemo, useState } from 'react';
import { Calendar, Plus, Sparkles, X } from 'lucide-react';
import { createPortfolioProject, type ProjectItem } from '../../../api/contentApi';
import { type ProjectRole, WRITING_ROLES } from '../projectWriting';

type Props = {
  open: boolean;
  portfolioId: number;
  onClose: () => void;
  onCreated?: (project: ProjectItem) => void;
};

export default function ProjectCreateModal({ open, portfolioId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ProjectRole>('DEVELOPER');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => name.trim().length > 0 && portfolioId > 0, [name, portfolioId]);

  if (!open) return null;

  const reset = () => {
    setName('');
    setRole('DEVELOPER');
    setYear(String(new Date().getFullYear()));
    setSummary('');
    setSkills('');
    setError(null);
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);

    try {
      const created = await createPortfolioProject(portfolioId, {
        name: name.trim(),
        role,
        summary: summary.trim() || undefined,
        startDate: year.trim() ? `${year}-01-01` : undefined,
        endDate: year.trim() ? `${year}-12-31` : undefined,
        skills: skills.trim() || undefined,
      });
      onCreated?.(created);
      reset();
      onClose();
    } catch {
      setError('프로젝트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-violet-300 mb-2" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.18)' }}>
              <Sparkles size={11} />
              Project
            </div>
            <p className="text-lg font-black text-white">새 프로젝트</p>
            <p className="text-xs text-zinc-500 mt-1">프로젝트를 만든 뒤, 안의 글을 모아서 작성 화면으로 이어집니다.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-zinc-300 rounded-xl hover:bg-white/[0.05] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {WRITING_ROLES.map(item => {
              const active = role === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setRole(item.key)}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(124,58,237,0.28)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-2">프로젝트 이름 *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 이커머스 플랫폼 리뉴얼"
              className="w-full px-4 py-3 rounded-2xl text-sm text-zinc-200 outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-2">연도</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="2026"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-zinc-200 outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-2">기술</label>
              <input
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="React, TypeScript, Node.js"
                className="w-full px-4 py-3 rounded-2xl text-sm text-zinc-200 outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-2">프로젝트 설명</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="프로젝트의 배경, 문제, 해결 방식, 결과를 간단히 적어주세요."
              rows={4}
              className="w-full px-4 py-3 rounded-2xl text-sm text-zinc-200 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {error && (
            <div className="rounded-2xl px-4 py-3 text-xs text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => void submit()}
            disabled={!canSubmit || busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.32)' }}
          >
            <Plus size={14} />
            {busy ? '저장 중...' : '프로젝트 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
