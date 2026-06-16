import { useEffect, useState } from 'react';
import { FilePlus2, Save, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  guide: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
  onOpenSources?: () => void;
};

export default function SectionEditorModal({
  open,
  title,
  guide,
  initialValue,
  onClose,
  onSave,
  onOpenSources,
}: Props) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [initialValue, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[360] flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-[920px] overflow-hidden rounded-[32px] border border-white/10 bg-[#090909] shadow-2xl shadow-black/50"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
              섹션 편집
            </div>
            <h3 className="text-2xl font-black text-white">{title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{guide}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          <section className="rounded-[28px] border border-white/8 bg-black/20 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-zinc-600">Answer</p>
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
              </div>
              {onOpenSources && (
                <button
                  type="button"
                  onClick={onOpenSources}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
                >
                  <FilePlus2 size={13} />
                  자료 불러오기
                </button>
              )}
            </div>

            <textarea
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="질문에 대한 답변을 자연스럽게 작성하세요. 필요하면 자료 불러오기에서 GitHub, Notion, Figma 내용을 참고할 수 있습니다."
              className="min-h-[430px] w-full resize-none rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-zinc-100 outline-none transition-colors placeholder:text-zinc-700 focus:border-violet-500/35"
            />
          </section>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-white/8 px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.04]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onSave(value.trim())}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
            >
              <Save size={14} />
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
