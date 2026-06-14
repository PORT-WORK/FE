import { useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { createPortfolioProject, type ProjectItem } from '../../../api/contentApi';
import { type ProjectRole, WRITING_ROLES } from '../projectWriting';

type Props = {
  open: boolean;
  portfolioId?: number | null;
  initialRole?: ProjectRole;
  onClose: () => void;
  onCreated?: (project: ProjectItem) => void;
};

const DEFAULT_PROJECT_NAME = '새 프로젝트';

export default function ProjectCreateModal({ open, portfolioId, initialRole = 'DEVELOPER', onClose, onCreated }: Props) {
  const [role, setRole] = useState<ProjectRole>(initialRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => Boolean(role), [role]);

  useEffect(() => {
    if (open) {
      setRole(initialRole);
      setError(null);
    }
  }, [initialRole, open]);

  if (!open) return null;

  const reset = () => {
    setRole(initialRole);
    setError(null);
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);

    try {
      const payload = {
        name: DEFAULT_PROJECT_NAME,
        role,
      };

      const created = portfolioId && portfolioId > 0
        ? await createPortfolioProject(portfolioId, payload)
        : ({
            id: Number(Date.now()),
            portfolioId: 0,
            name: DEFAULT_PROJECT_NAME,
            role,
            summary: null,
            thumbnailUrl: null,
            skills: [],
            isSynced: false,
            startDate: null,
            endDate: null,
            orderIndex: 0,
          } satisfies ProjectItem);

      onCreated?.(created);
      reset();
      onClose();
    } catch {
      setError('프로젝트를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div
              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-violet-300"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.18)' }}
            >
              <Sparkles size={11} />
              Project
            </div>
            <p className="text-lg font-black text-white">프로젝트 만들기</p>
            <p className="mt-1 text-xs text-zinc-500">직무만 먼저 선택하고 나머지는 상세 화면에서 작성할 수 있습니다.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
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
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{item.description}</p>
                </button>
              );
            })}
          </div>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-xs text-red-300"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => void submit()}
            disabled={!canSubmit || busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.32)' }}
          >
            <Plus size={14} />
            {busy ? '생성 중...' : '프로젝트 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
