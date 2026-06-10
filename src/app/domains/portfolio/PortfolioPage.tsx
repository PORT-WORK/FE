import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus, Search, Presentation, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { listMyPortfolios, type PortfolioSummary } from '../../api/contentApi';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';
  const [files, setFiles] = useState<PortfolioSummary[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listMyPortfolios().then(setFiles);
  }, []);

  const filtered = files.filter(item =>
    [item.title, item.jobRole, item.summary || ''].join(' ').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full flex" style={{ background: '#050505' }}>
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
              <span>{ko ? '포트폴리오' : 'Portfolio'}</span>
              <span>•</span>
              <span className="text-zinc-300">{ko ? 'PPTX 보관함' : 'PPTX archive'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{ko ? 'PPTX 파일' : 'PPTX files'}</h2>
            <p className="text-xs text-zinc-600 mt-1">{ko ? '완성된 PPTX 결과물만 저장됩니다.' : 'Only completed PPTX files are stored here.'}</p>
          </div>
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            <Plus size={14} />
            {ko ? '새 PPTX 만들기' : 'New PPTX'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ko ? '파일 검색...' : 'Search files...'}
              className="w-full pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 rounded-xl focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>
          <div className="text-xs text-zinc-600">{filtered.length} files</div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
              <Presentation size={24} className="text-violet-400" />
            </div>
            <p className="text-sm text-zinc-300 mb-1">{ko ? '저장된 PPTX가 없습니다' : 'No saved PPTX files yet.'}</p>
            <p className="text-xs text-zinc-700 mb-5">{ko ? '워크스페이스에서 작성 후 발행하면 여기에 표시됩니다.' : 'Publish from Project to store the result here.'}</p>
            <button onClick={() => navigate('/workspace')} className="px-5 py-2.5 rounded-xl text-xs font-medium text-violet-400 transition-all hover:bg-violet-500/10" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
              {ko ? '프로젝트로 이동' : 'Go to Project'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(file => (
              <button
                key={file.id}
                onClick={() => navigate('/workspace', { state: { portfolioId: file.id } })}
                className="rounded-2xl overflow-hidden text-left transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="h-32 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <FileText size={28} className="text-zinc-700" />
                </div>
                <div className="p-5">
                  <p className="text-sm font-semibold text-white mb-1">{file.title}</p>
                  <p className="text-xs text-zinc-500 mb-3">{file.jobRole}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Sparkles size={12} />
                    {ko ? '발행된 결과물' : 'Published result'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
