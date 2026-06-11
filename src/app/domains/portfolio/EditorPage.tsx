import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';

export default function EditorPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <div className="max-w-4xl mx-auto px-8 py-10">
        <button
          onClick={() => navigate('/workspace')}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {navigator.language.startsWith('ko') ? '프로젝트로 돌아가기' : 'Back to project'}
        </button>

        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Sparkles size={12} />
            Project editor
          </div>
          <h1 className="text-3xl font-black text-white">{navigator.language.startsWith('ko') ? '프로젝트 글 작성 화면' : 'Project writing flow'}</h1>
          <p className="text-sm text-zinc-600 mt-3 leading-6">
            {navigator.language.startsWith('ko')
              ? '새 프로젝트를 만들고, 그 안의 Notion 스타일 글과 블록을 정리한 뒤 발행까지 이어지는 기존 흐름을 다시 사용합니다.'
              : 'Create a project, organize Notion-style posts and blocks, then publish through the restored flow.'}
          </p>

          <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)' }}>
                <FileText size={18} className="text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{navigator.language.startsWith('ko') ? 'Notion 스타일 작성' : 'Notion-style writing'}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {navigator.language.startsWith('ko')
                    ? '프로젝트 안에서 글을 작성하고, 블록을 추가하고, AI 생성 단계에서 백엔드 API로 넘깁니다.'
                    : 'Write inside the project, add blocks, and hand the payload to the backend AI pipeline.'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/workspace')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            {navigator.language.startsWith('ko') ? '프로젝트로 이동' : 'Go to project'}
          </button>
        </div>
      </div>
    </div>
  );
}
