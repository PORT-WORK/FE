import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus, Search, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import EmptyStatePanel from '../../components/EmptyStatePanel';
import { listMyPortfolios, type PortfolioSummary } from '../../api/contentApi';

function EmptyState({ ko, onAction }: { ko: boolean; onAction: () => void }) {
  return (
    <div
      className="flex min-h-[560px] w-full flex-col items-center justify-center rounded-3xl p-12 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
      >
        <span className="text-2xl">📁</span>
      </div>
      <p className="mb-2 text-lg font-semibold text-white">{ko ? '저장된 포트폴리오가 없습니다' : 'No saved portfolios yet.'}</p>
      <p className="mx-auto max-w-md text-sm text-zinc-600">{ko ? '프로젝트 안의 글을 선택해 포트폴리오로 만들면 여기에 표시됩니다.' : 'Select project posts to build a portfolio and store it here.'}</p>
      <button
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
      >
        <Sparkles size={14} />
        {ko ? '포트폴리오 생성하기' : 'Create portfolio'}
      </button>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const ko = language === 'ko';
  const [files, setFiles] = useState<PortfolioSummary[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void listMyPortfolios().then(setFiles).catch(() => setFiles([]));
  }, []);

  const filtered = useMemo(
    () =>
      files.filter(item =>
        [item.title, item.jobRole, item.summary || ''].join(' ').toLowerCase().includes(search.toLowerCase()),
      ),
    [files, search],
  );

  const hasFiles = files.length > 0;
  const openGenerate = () => navigate('/generate');

  return (
    <div className="flex h-full" style={{ background: '#050505' }}>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {(hasFiles || search) && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={ko ? '파일 검색...' : 'Search files...'}
                  className="w-full rounded-xl py-2 pl-8 pr-3 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                />
              </div>
              <div className="text-xs text-zinc-600">
                {filtered.length} {ko ? '개 파일' : 'files'}
              </div>
            </div>

            {hasFiles && (
              <button
                onClick={openGenerate}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                <Plus size={14} />
                {ko ? '포트폴리오 생성하기' : 'Create portfolio'}
              </button>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyStatePanel
            emoji="📁"
            title={ko ? '저장된 포트폴리오가 없습니다' : 'No saved portfolios yet.'}
            description={ko ? '프로젝트 안의 글을 선택해 포트폴리오로 만들면 여기에 표시됩니다.' : 'Select project posts to build a portfolio and store it here.'}
            actionLabel={ko ? '포트폴리오 생성하기' : 'Create portfolio'}
            onAction={openGenerate}
            accent="violet"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(file => (
              <button
                key={file.id}
                onClick={() => navigate('/workspace', { state: { portfolioId: file.id } })}
                className="overflow-hidden rounded-2xl text-left transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex h-32 items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <FileText size={28} className="text-zinc-700" />
                </div>
                <div className="p-5">
                  <p className="mb-1 text-sm font-semibold text-white">{file.title}</p>
                  <p className="mb-3 text-xs text-zinc-500">{file.jobRole}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Sparkles size={12} />
                    {ko ? '생성된 결과물' : 'Published result'}
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
