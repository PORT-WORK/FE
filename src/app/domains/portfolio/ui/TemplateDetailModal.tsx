import { useState } from 'react';
import { X, Sparkles, FileText, Upload, Check } from 'lucide-react';

interface Template {
  id: string;
  label: string;
  image: string;
  category: string;
}

interface Props {
  template: Template;
  templates: Template[];
  onClose: () => void;
  onConfirm: () => void;
}

const slideCounts = ['5-10 ?щ씪?대뱶', '10-15 ?щ씪?대뱶', '15-20 ?щ씪?대뱶', '20-25 ?щ씪?대뱶'];

type Mode = 'generate' | 'paste' | 'upload';

const modes: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: 'generate', label: '?앹꽦', icon: Sparkles },
  { id: 'paste', label: '?띿뒪??遺숈뿬?ｊ린', icon: FileText },
  { id: 'upload', label: '?뚯씪 ?낅줈??, icon: Upload },
];

export default function TemplateDetailModal({ template, templates, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<Template>(template);
  const [mode, setMode] = useState<Mode>('generate');
  const [input, setInput] = useState('');
  const [slideCount, setSlideCount] = useState(slideCounts[2]);
  const [lang, setLang] = useState('?쒓뎅??);

  const placeholder: Record<Mode, string> = {
    generate: '二쇱젣瑜??낅젰?섎㈃ ?쒖떇媛꾩뿉 ?щ씪?대뱶媛 ?앹꽦?⑸땲??,
    paste: '?명듃, ?꾩슦?몃씪???먮뒗 湲곗〈 ?띿뒪?몃? 遺숈뿬?ｌ뼱 ?щ씪?대뱶瑜?留뚮뱶?몄슂.',
    upload: '?뚯씪???뚯뼱???볤굅???대┃?섏뿬 ?낅줈?쒗븯?몄슂',
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-white">
      {/* LEFT: Template list - narrow fixed */}
      <div className="w-40 border-r border-gray-100 overflow-y-auto flex-shrink-0 py-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`w-full px-3 py-2 flex flex-col gap-1 hover:bg-gray-50 transition-colors ${
              selected.id === t.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="relative">
              <img
                src={t.image}
                alt={t.label}
                className="w-full aspect-video object-cover rounded-lg border border-gray-200"
              />
              {selected.id === t.id && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 text-left truncate">{t.label}</p>
          </button>
        ))}
      </div>

      {/* CENTER: Preview - fills remaining space */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <h3 className="font-medium text-gray-900">{selected.label}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <img
            src={selected.image}
            alt={selected.label}
            className="w-full max-w-2xl rounded-2xl shadow-xl object-cover"
            style={{ aspectRatio: '16/9' }}
          />
        </div>
      </div>

      {/* RIGHT: Settings panel - fixed width prompt area */}
      <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col bg-white">
        {/* Mode tabs - fixed, no text wrapping */}
        <div className="border-b border-gray-100 px-3 pt-4 pb-0">
          <div className="flex gap-0">
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-xs font-medium border-b-2 transition-colors ${
                    mode === m.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="whitespace-nowrap text-center" style={{ fontSize: '10px' }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text area */}
        <div className="flex-1 p-5 overflow-y-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder[mode]}
            className="w-full h-48 resize-none text-sm text-gray-700 placeholder-gray-400 outline-none border border-gray-200 rounded-xl p-3 focus:border-blue-400"
          />

          {/* Options */}
          <div className="mt-5 space-y-4 max-w-md">
            <div>
              <label className="block text-xs text-gray-500 mb-1">?щ씪?대뱶 ??/label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                {slideCounts.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">?몄뼱</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="?쒓뎅??>?눖?눟 ?쒓뎅??/option>
                <option value="English">?눣?눡 English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Confirm button */}
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Sparkles size={14} />
            怨꾩냽
          </button>
        </div>
      </div>
    </div>
  );
}
