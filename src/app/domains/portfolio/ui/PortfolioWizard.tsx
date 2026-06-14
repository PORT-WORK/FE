import { useState, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, FileText, Check,
  User, Briefcase, Code, Wrench, Trophy, GitBranch, File, Link as LinkIcon,
  Calendar, Plus, Trash2
} from 'lucide-react';

interface ListItem {
  id: string;
  title: string;
  content: string;
  photoFile: File | null;
  photoPreview: string | null;
}

interface PortfolioData {
  title: string;
  role: string;
  jobType: string;
  overview: string;
  responsibilities: string;
  techStack: string[];
  troubleshootingItems: ListItem[];
  resultsItems: ListItem[];
  processItems: ListItem[];
  mainImage: File | null;
  subImages: File[];
  files: File[];
  startDate: string;
  endDate: string;
  links: { type: string; url: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data?: PortfolioData) => void;
}

const steps = [
  { id: 1, title: '湲곕낯 ?뺣낫', icon: User, description: '?ы듃?대━???쒕ぉ怨???븷' },
  { id: 2, title: '?꾨줈?앺듃 媛쒖슂', icon: Briefcase, description: '?꾨줈?앺듃 ?뚭컻' },
  { id: 3, title: '?대떦 ??븷', icon: User, description: '留≪? ??븷怨?梨낆엫' },
  { id: 4, title: '湲곗닠 ?ㅽ깮', icon: Code, description: '?ъ슜??湲곗닠怨??꾧뎄' },
  { id: 5, title: '?몃윭釉붿뒋??, icon: Wrench, description: '臾몄젣 ?닿껐 寃쏀뿕' },
  { id: 6, title: '?깃낵 諛?寃곌낵', icon: Trophy, description: '?ъ꽦???깃낵' },
  { id: 7, title: '吏꾪뻾 怨쇱젙', icon: GitBranch, description: '?묒뾽 ?꾨줈?몄뒪 (?좏깮)' },
  { id: 8, title: '?대?吏 ?낅줈??, icon: ImageIcon, description: '???諛??쒕툕 ?대?吏' },
  { id: 9, title: '留곹겕 & ?뚯씪', icon: File, description: '愿??留곹겕 諛?臾몄꽌' },
];

const jobTypes = [
  '媛쒕컻??, '?붿옄?대꼫', 'PM', '留덉???, '?곗씠??遺꾩꽍媛', '湲고쉷??,
  '肄섑뀗痢??щ━?먯씠??, '?곸긽 ?쒖옉??, '寃뚯엫 媛쒕컻??, '?곌뎄??, '?곸뾽/鍮꾩쫰?덉뒪', 'HR/?몄궗',
];

const techOptions = [
  'React', 'React Native', 'Kotlin', 'Swift', 'TypeScript', 'JavaScript',
  'Java', 'Spring Boot', 'Python', 'Node.js', 'Next.js',
];

const jobSpecificLinks: Record<string, { label: string; placeholder: string }[]> = {
  '媛쒕컻??: [
    { label: 'GitHub', placeholder: 'https://github.com/username/repo' },
    { label: '?몄뀡', placeholder: 'https://notion.so/...' },
    { label: '湲곗닠 釉붾줈洹?, placeholder: 'https://blog.example.com' },
  ],
  '?붿옄?대꼫': [
    { label: 'Figma', placeholder: 'https://figma.com/file/...' },
    { label: 'Behance', placeholder: 'https://behance.net/...' },
    { label: 'Dribbble', placeholder: 'https://dribbble.com/...' },
  ],
  'PM': [
    { label: '?몄뀡', placeholder: 'https://notion.so/...' },
    { label: 'Jira', placeholder: 'https://jira.atlassian.com/...' },
  ],
  '留덉???: [
    { label: '?몄뀡', placeholder: 'https://notion.so/...' },
    { label: '罹좏럹??留곹겕', placeholder: 'https://example.com/campaign' },
  ],
};

const emptyItem = (): ListItem => ({
  id: Date.now().toString(),
  title: '',
  content: '',
  photoFile: null,
  photoPreview: null,
});

function ListItemForm({
  label,
  items,
  onChange,
}: {
  label: string;
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
}) {
  const [newItem, setNewItem] = useState<ListItem>(emptyItem());
  const photoRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    if (!newItem.title.trim() && !newItem.content.trim()) return;
    onChange([...items, { ...newItem, id: Date.now().toString() }]);
    setNewItem(emptyItem());
  };

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewItem((prev) => ({
        ...prev,
        photoFile: file,
        photoPreview: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                  {item.photoPreview && (
                    <img src={item.photoPreview} alt="泥⑤? ?대?吏" className="mt-2 h-16 w-24 object-cover rounded-lg" />
                  )}
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new item form */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">????ぉ 異붽?</p>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">?쒕ぉ</label>
          <input
            type="text"
            placeholder={`${label} ?쒕ぉ???낅젰?섏꽭??}
            value={newItem.title}
            onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">?댁슜</label>
          <textarea
            placeholder={`${label}??????먯꽭???ㅻ챸?댁＜?몄슂`}
            value={newItem.content}
            onChange={(e) => setNewItem((prev) => ({ ...prev, content: e.target.value }))}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">?ъ쭊 (?좏깮)</label>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          {newItem.photoPreview ? (
            <div className="relative inline-block">
              <img src={newItem.photoPreview} alt="preview" className="h-20 w-28 object-cover rounded-lg" />
              <button
                onClick={() => setNewItem((prev) => ({ ...prev, photoFile: null, photoPreview: null }))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoRef.current?.click()}
              className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              <ImageIcon size={14} />
              ?ъ쭊 異붽?
            </button>
          )}
        </div>
        <button
          onClick={addItem}
          disabled={!newItem.title.trim() && !newItem.content.trim()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={14} />
          ??ぉ 異붽?
        </button>
      </div>
    </div>
  );
}

export default function PortfolioWizard({ isOpen, onClose, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PortfolioData>({
    title: '', role: '', jobType: '媛쒕컻??, overview: '', responsibilities: '',
    techStack: [], troubleshootingItems: [], resultsItems: [], processItems: [],
    mainImage: null, subImages: [], files: [], startDate: '', endDate: '', links: [],
  });

  const mainImageRef = useRef<HTMLInputElement>(null);
  const subImageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const progress = (currentStep / steps.length) * 100;
  const currentStepData = steps[currentStep - 1];

  const handleNext = () => { if (currentStep < steps.length) setCurrentStep((p) => p + 1); };
  const handlePrev = () => { if (currentStep > 1) setCurrentStep((p) => p - 1); };

  const handleComplete = () => {
    onComplete(formData);
    setFormData({
      title: '', role: '', jobType: '媛쒕컻??, overview: '', responsibilities: '',
      techStack: [], troubleshootingItems: [], resultsItems: [], processItems: [],
      mainImage: null, subImages: [], files: [], startDate: '', endDate: '', links: [],
    });
    setCurrentStep(1);
  };

  const toggleTech = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const currentLinkOptions = jobSpecificLinks[formData.jobType] || jobSpecificLinks['媛쒕컻??];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">?ы듃?대━???쒕ぉ</label>
              <input
                type="text"
                placeholder="?? ?댁빱癒몄뒪 ?뚮옯??由щ돱???꾨줈?앺듃"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">吏곷Т ?좏깮</label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((job) => (
                  <button
                    key={job}
                    onClick={() => setFormData((p) => ({ ...p, jobType: job }))}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      formData.jobType === job
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">??븷</label>
              <input
                type="text"
                placeholder="?? Frontend Developer, Product Designer"
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">?꾨줈?앺듃 湲곌컙</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <span className="text-gray-400">~</span>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <label className="block text-sm font-medium mb-1.5">?꾨줈?앺듃 媛쒖슂</label>
            <textarea
              placeholder="?꾨줈?앺듃?????媛꾨왂???ㅻ챸?댁＜?몄슂. ?꾨줈?앺듃??紐⑹쟻, 諛곌꼍 ?깆쓣 ?ы븿?????덉뒿?덈떎."
              value={formData.overview}
              onChange={(e) => setFormData((p) => ({ ...p, overview: e.target.value }))}
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        );
      case 3:
        return (
          <div>
            <label className="block text-sm font-medium mb-1.5">?대떦 ??븷</label>
            <textarea
              placeholder="?꾨줈?앺듃?먯꽌 留≪? ??븷怨?梨낆엫??????ㅻ챸?댁＜?몄슂."
              value={formData.responsibilities}
              onChange={(e) => setFormData((p) => ({ ...p, responsibilities: e.target.value }))}
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium">?ъ슜??湲곗닠 ?ㅽ깮???좏깮?섏꽭??/label>
            <div className="flex flex-wrap gap-2">
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    formData.techStack.includes(tech)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
            {formData.techStack.length > 0 && (
              <p className="text-sm text-gray-500">?좏깮?? {formData.techStack.join(', ')}</p>
            )}
          </div>
        );
      case 5:
        return (
          <ListItemForm
            label="?몃윭釉붿뒋??
            items={formData.troubleshootingItems}
            onChange={(items) => setFormData((p) => ({ ...p, troubleshootingItems: items }))}
          />
        );
      case 6:
        return (
          <ListItemForm
            label="?깃낵 諛?寃곌낵"
            items={formData.resultsItems}
            onChange={(items) => setFormData((p) => ({ ...p, resultsItems: items }))}
          />
        );
      case 7:
        return (
          <ListItemForm
            label="吏꾪뻾 怨쇱젙"
            items={formData.processItems}
            onChange={(items) => setFormData((p) => ({ ...p, processItems: items }))}
          />
        );
      case 8:
        return (
          <div className="space-y-6">
            {/* Main Image */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                ????대?吏 <span className="text-gray-400">(?꾨줈?앺듃 諛곕꼫, 濡쒓퀬 ??</span>
              </label>
              <input ref={mainImageRef} type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFormData((p) => ({ ...p, mainImage: file }));
              }} className="hidden" />
              {formData.mainImage ? (
                <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100">
                  <img src={URL.createObjectURL(formData.mainImage)} alt="????대?吏" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setFormData((p) => ({ ...p, mainImage: null }))}
                    className="absolute right-2 top-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => mainImageRef.current?.click()}
                  className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon size={28} className="text-gray-400" />
                  <span className="text-sm text-gray-400">????대?吏 ?낅줈??/span>
                </button>
              )}
            </div>
            {/* Sub Images */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                ?쒕룞 ?대?吏 <span className="text-gray-400">(?쒕룞 湲곕줉, ?ㅽ겕由곗꺑 ??</span>
              </label>
              <input ref={subImageRef} type="file" accept="image/*" multiple onChange={(e) => {
                const files = e.target.files;
                if (files) setFormData((p) => ({ ...p, subImages: [...p.subImages, ...Array.from(files)] }));
              }} className="hidden" />
              <button
                onClick={() => subImageRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload size={18} className="text-gray-400" />
                <span className="text-sm text-gray-400">?쒕룞 ?대?吏 異붽? (?щ윭 ???좏깮 媛??</span>
              </button>
              {formData.subImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {formData.subImages.map((file, idx) => (
                    <div key={idx} className="group relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setFormData((p) => ({ ...p, subImages: p.subImages.filter((_, i) => i !== idx) }))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <LinkIcon size={14} />
                {formData.jobType} 愿??留곹겕
              </label>
              <div className="space-y-3">
                {currentLinkOptions.map((opt, idx) => (
                  <div key={opt.label}>
                    <label className="block text-xs text-gray-400 mb-1">{opt.label}</label>
                    <input
                      type="text"
                      placeholder={opt.placeholder}
                      value={formData.links[idx]?.url || ''}
                      onChange={(e) => {
                        setFormData((p) => {
                          const links = [...p.links];
                          links[idx] = { type: opt.label, url: e.target.value };
                          return { ...p, links };
                        });
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">臾몄꽌 ?낅줈??(PDF, 臾몄꽌 ??</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple onChange={(e) => {
                const files = e.target.files;
                if (files) setFormData((p) => ({ ...p, files: [...p.files, ...Array.from(files)] }));
              }} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileText size={18} className="text-gray-400" />
                <span className="text-sm text-gray-400">?뚯씪 ?낅줈??/span>
              </button>
              {formData.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button onClick={() => setFormData((p) => ({ ...p, files: p.files.filter((_, i) => i !== idx) }))}>
                        <X size={14} className="text-gray-400 hover:text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">?ы듃?대━??留뚮뱾湲?/h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-400">{currentStep} / {steps.length} ?④퀎</span>
              <span className="font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center">
              <currentStepData.icon size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{currentStepData.title}</p>
              <p className="text-xs text-gray-400">{currentStepData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            ?댁쟾
          </button>
          {currentStep === steps.length ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Check size={16} />
              ?꾨즺
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              ?ㅼ쓬
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
