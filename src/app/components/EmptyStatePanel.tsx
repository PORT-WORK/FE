type Props = {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  accent?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
};

const ACCENT_STYLES: Record<NonNullable<Props['accent']>, { bg: string; border: string; text: string }> = {
  violet: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.28)', text: '#c4b5fd' },
  blue: { bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.28)', text: '#93c5fd' },
  emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', text: '#6ee7b7' },
  amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', text: '#fcd34d' },
  rose: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.28)', text: '#fda4af' },
};

export default function EmptyStatePanel({
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  accent = 'violet',
}: Props) {
  const palette = ACCENT_STYLES[accent];

  return (
    <div className="w-full min-h-[520px] rounded-[28px] p-10 flex flex-col items-center justify-center text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: palette.bg, border: `1px solid ${palette.border}`, boxShadow: `0 0 24px ${palette.bg}` }}>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className="text-[22px] font-black text-white mb-2 tracking-tight">{title}</p>
      <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${palette.text}, #2563eb)`, boxShadow: `0 0 24px ${palette.bg}` }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
