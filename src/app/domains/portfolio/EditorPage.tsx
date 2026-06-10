import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';

export default function EditorPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <div className="max-w-4xl mx-auto px-8 py-10">
        <button
          onClick={() => navigate('/portfolio')}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to portfolio
        </button>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Sparkles size={12} />
            Portfolio editor
          </div>
          <h1 className="text-3xl font-black text-white">에디터는 프로젝트로 이동되었습니다</h1>
          <p className="text-sm text-zinc-600 mt-3 leading-6">
            지금부터 게시글 작성과 블록 편집은 Project 영역에서 관리합니다.
            새 프로젝트를 만들고, 그 안에 Notion 스타일 글을 쌓은 뒤 포트폴리오 만들기에서 선택해 주세요.
          </p>

          <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)' }}>
                <FileText size={18} className="text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Notion-style writing flow</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Workspace에서 프로젝트를 만들고, 문서와 블록을 추가한 뒤, AI 생성 단계에서 실제 BE API로 넘깁니다.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/workspace')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            Go to project
          </button>
        </div>
      </div>
    </div>
  );
}
