import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Check, Clock3, Download, FileText, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { exportPortfolioPptx, fetchPortfolioData, type PortfolioDataResponse } from '../../api/contentApi';
import PortfolioSelectionModal from '../generate/ui/PortfolioSelectionModal';
import { type ProjectRole, SECTION_TEMPLATES, createEmptyDraft, type ProjectWritingDraft, type ProjectWritingStatus, loadDraft, saveDraft, type SectionStatus } from '../workspace/projectWriting';

type Selection = {
  portfolioId: number;
  projectIds: number[];
  articleIds: string[];
};

function parseRole(value: string | null): ProjectRole {
  return value === 'PM' ? 'PM' : 'DEVELOPER';
}

function countCompletedSections(draft: ProjectWritingDraft) {
  return Object.values(draft.sections).filter(section => section.status === 'COMPLETED').length;
}

function updateSectionStatus(value: string): SectionStatus {
  const trimmed = value.trim();
  if (!trimmed) return 'EMPTY';
  return trimmed.length > 40 ? 'COMPLETED' : 'DRAFT';
}

function buildSourceText(data: PortfolioDataResponse, selection: Selection, documentText: string) {
  const selectedProjectIds = new Set(selection.projectIds);
  const selectedArticleIds = new Set(selection.articleIds.map(String));
  const projectDocuments = data.projects
    .filter(item => selectedProjectIds.has(item.project.id))
    .flatMap(item => item.documents.map(doc => ({
      project: item.project,
      document: doc.document,
      blocks: doc.blocks,
    })));

  const projectText = data.projects
    .filter(item => selectedProjectIds.has(item.project.id))
    .map(item => [
      `Project: ${item.project.name}`,
      `Role: ${item.project.role || ''}`,
      `Summary: ${item.project.summary || ''}`,
      `Skills: ${Array.isArray(item.project.skills) ? item.project.skills.join(', ') : item.project.skills || ''}`,
    ].join('\n'))
    .join('\n\n');

  const articleText = (selectedArticleIds.size > 0 ? projectDocuments.filter(item => selectedArticleIds.has(String(item.document.id))) : projectDocuments)
    .map(item => {
      const blockText = item.blocks
        .map(block => {
          const content = block.content && typeof block.content === 'object'
            ? Object.values(block.content).filter(Boolean).join(' ')
            : '';
          return content.trim();
        })
        .filter(Boolean)
        .join('\n');

      return [
        `Post: ${item.document.title}`,
        `Project: ${item.project.name}`,
        `Category: ${item.document.category}`,
        `Content: ${blockText}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    projectText,
    articleText,
    documentText.trim(),
  ].filter(Boolean).join('\n\n---\n\n');
}

function normalizeForReview(text: string) {
  return text
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, index, arr) => line.trim() !== '' || (index > 0 && arr[index - 1].trim() !== ''))
    .join('\n')
    .trim();
}

function formatDate(value: string | null) {
  if (!value) return '없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const projectId = Number(params.get('projectId') || 0);
  const portfolioId = Number(params.get('portfolioId') || 0);
  const projectName = params.get('name') || '새 프로젝트';
  const role = parseRole(params.get('role'));

  const [draft, setDraft] = useState<ProjectWritingDraft>(() => createEmptyDraft(projectId || Date.now(), portfolioId || null, role, projectName));
  const [modalOpen, setModalOpen] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [step, setStep] = useState<ProjectWritingStatus>('NOT_STARTED');
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [sourceBusy, setSourceBusy] = useState(false);
  const [sourcePreview, setSourcePreview] = useState<string>('');
  const [documentText, setDocumentText] = useState('');
  const [reviewedText, setReviewedText] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumable, setResumable] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setLoadingDraft(false);
      return;
    }

    const existing = loadDraft(projectId);
    if (existing) {
      setDraft(existing);
      setSelection(existing.selectedArticleIds.length || existing.selectedProjectIds.length
        ? {
            portfolioId: existing.portfolioId || portfolioId,
            projectIds: existing.selectedProjectIds,
            articleIds: existing.selectedArticleIds,
          }
        : null);
      setDocumentText(existing.document || '');
      setReviewedText(existing.reviewedDocument || '');
      setStep(existing.writingStatus);
      setResumable(Boolean(existing.updatedAt));
    }
    setLoadingDraft(false);
  }, [portfolioId, projectId]);

  useEffect(() => {
    if (!projectId || loadingDraft) return;
    const nextDraft = {
      ...draft,
      projectId,
      portfolioId: portfolioId || draft.portfolioId,
      projectName,
      role,
      selectedProjectIds: selection?.projectIds || [],
      selectedArticleIds: selection?.articleIds || [],
      document: documentText,
      reviewedDocument: reviewedText,
      writingStatus: step,
    };
    saveDraft(nextDraft);
  }, [draft, documentText, loadingDraft, portfolioId, projectId, projectName, role, reviewedText, selection, step]);

  const sections = SECTION_TEMPLATES[role];
  const completed = countCompletedSections(draft);
  const progress = sections.length === 0 ? 0 : (completed / sections.length) * 100;

  const updateSection = (key: string, value: string) => {
    const updatedAt = new Date().toISOString();
    setDraft(prev => ({
      ...prev,
      updatedAt,
      sections: {
        ...prev.sections,
        [key]: {
          value,
          status: updateSectionStatus(value),
        },
      },
    }));
    setStep('WRITING');
  };

  const selectSources = async (nextSelection: Selection) => {
    const updatedAt = new Date().toISOString();
    setSelection(nextSelection);
    setModalOpen(false);
    setStep('WRITING');
    setError(null);
    if (!nextSelection.portfolioId) return;
    setSourceBusy(true);
    try {
      const data = await fetchPortfolioData(nextSelection.portfolioId);
      const merged = buildSourceText(data, nextSelection, documentText);
      setSourcePreview(merged);
      setDraft(prev => ({
        ...prev,
        updatedAt,
        portfolioId: nextSelection.portfolioId,
        selectedProjectIds: nextSelection.projectIds,
        selectedArticleIds: nextSelection.articleIds,
      }));
    } catch {
      setError('자료를 불러오지 못했습니다. 선택은 저장되었지만 미리보기는 실패했습니다.');
    } finally {
      setSourceBusy(false);
    }
  };

  const createDocument = async () => {
    if (!selection?.portfolioId) {
      setError('자료를 먼저 선택해 주세요.');
      return;
    }

    setError(null);
    setStep('DOCUMENT_CREATED');
    setDraft(prev => ({ ...prev, updatedAt: new Date().toISOString() }));
    const content = [
      `PROJECT: ${draft.projectName}`,
      `ROLE: ${draft.role}`,
      '',
      ...sections.map(section => {
        const value = draft.sections[section.key]?.value?.trim() || '';
        return value ? `# ${section.title}\n${value}` : `# ${section.title}\n(EMPTY)`;
      }),
      '',
      sourcePreview ? `# SOURCES\n${sourcePreview}` : '# SOURCES\n(EMPTY)',
    ].join('\n');
    setDocumentText(content);
  };

  const reviewDocument = async () => {
    if (!documentText.trim()) {
      setError('먼저 문서를 생성해 주세요.');
      return;
    }

    setStep('REVIEWED');
    setDraft(prev => ({ ...prev, updatedAt: new Date().toISOString() }));
    setReviewedText(normalizeForReview(documentText));
  };

  const exportPptx = async () => {
    if (!selection?.portfolioId) {
      setError('포트폴리오를 선택해 주세요.');
      return;
    }
    const sourceText = reviewedText.trim() || documentText.trim();
    if (!sourceText) {
      setError('먼저 검토본 또는 문서를 생성해 주세요.');
      return;
    }

    setExportBusy(true);
    setError(null);
    try {
      const blob = await exportPortfolioPptx(selection.portfolioId, sourceText);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `portfolio-${selection.portfolioId}.pptx`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStep('PPT_CREATED');
      setDraft(prev => ({ ...prev, updatedAt: new Date().toISOString() }));
      navigate('/portfolio');
    } catch {
      setError('PPTX 생성에 실패했습니다.');
    } finally {
      setExportBusy(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#050505' }}>
        <div className="text-zinc-500 text-sm flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          불러오는 중...
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center px-6" style={{ background: '#050505' }}>
        <div className="max-w-md w-full rounded-3xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <FileText size={22} className="text-violet-300" />
          </div>
          <p className="text-lg font-black text-white">프로젝트를 먼저 만들어주세요</p>
          <p className="mt-2 text-sm text-zinc-500">프로젝트가 있어야 섹션 작성과 자료 선택을 이어갈 수 있습니다.</p>
          <button
            onClick={() => navigate('/workspace')}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            프로젝트로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#050505' }}>
      <PortfolioSelectionModal
        open={modalOpen}
        portfolioId={selection?.portfolioId || portfolioId || null}
        onClose={() => setModalOpen(false)}
        onConfirm={selectSources}
      />

      <div className="mx-auto max-w-7xl px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={14} />
            프로젝트로 돌아가기
          </button>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock3 size={12} />
            마지막 저장 {formatDate(draft.updatedAt)}
          </div>
        </div>

        {resumable && (
          <div className="mb-5 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <div>
              <p className="text-sm font-semibold text-white">작성 중인 포트폴리오가 있습니다.</p>
              <p className="text-xs text-zinc-500 mt-1">이어서 작성하거나 새로 시작할 수 있습니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setResumable(false)} className="px-3 py-2 rounded-xl text-xs text-zinc-400" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                계속하기
              </button>
              <button onClick={() => { localStorage.removeItem(`port-project-draft:${projectId}`); window.location.reload(); }} className="px-3 py-2 rounded-xl text-xs text-red-300" style={{ border: '1px solid rgba(239,68,68,0.18)' }}>
                삭제
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-violet-300 mb-4" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                  <Sparkles size={12} />
                  Project writing
                </div>
                <h1 className="text-3xl font-black text-white">{draft.projectName}</h1>
                <p className="text-sm text-zinc-500 mt-2">직무별 가이드를 따라 작성하고, 자료를 선택해 문서와 PPTX로 이어갑니다.</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 0 22px rgba(124,58,237,0.28)' }}
              >
                <Sparkles size={14} />
                자료 선택
              </button>
            </div>

            <div className="mb-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{completed} / {sections.length} 완료</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#2563eb)' }} />
              </div>
            </div>

            <div className="space-y-4">
              {sections.map(section => {
                const current = draft.sections[section.key];
                return (
                  <div key={section.key} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-bold text-white">{section.title}</p>
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{section.guide}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.24em] ${current?.status === 'COMPLETED' ? 'text-emerald-300' : current?.status === 'DRAFT' ? 'text-violet-300' : 'text-zinc-600'}`}>
                        {current?.status || 'EMPTY'}
                      </span>
                    </div>
                    <textarea
                      value={current?.value || ''}
                      onChange={e => updateSection(section.key, e.target.value)}
                      placeholder={section.placeholder}
                      rows={section.key === 'overview' || section.key === 'problem' || section.key === 'prd' ? 7 : 5}
                      className="w-full rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    />
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">작성 상태</p>
                <p className="text-xs text-zinc-500 mt-1">문서 생성, 검토, PPTX 생성 순서로 진행합니다.</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-violet-300">{step}</span>
            </div>

            <div className="space-y-3 rounded-2xl p-4 mb-5" style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                ['문서 생성', '섹션을 합쳐 원고를 만듭니다.'],
                ['AI 검토', '표현을 정리하고 중복을 줄입니다.'],
                ['PPTX 생성', '검토본을 기반으로 결과물을 만듭니다.'],
              ].map(([title, desc], index) => {
                const active = (index === 0 && step === 'WRITING') || (index === 1 && step === 'DOCUMENT_CREATED') || (index === 2 && (step === 'REVIEWED' || step === 'PPT_CREATED'));
                const done = (index === 0 && (step === 'DOCUMENT_CREATED' || step === 'REVIEWED' || step === 'PPT_CREATED')) || (index === 1 && (step === 'REVIEWED' || step === 'PPT_CREATED')) || (index === 2 && step === 'PPT_CREATED');
                return (
                  <div key={title} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)', border: `1px solid ${active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: done ? 'rgba(16,185,129,0.14)' : active ? 'rgba(124,58,237,0.14)' : 'rgba(255,255,255,0.05)' }}>
                      {done ? <Check size={12} className="text-emerald-300" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => void createDocument()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                <FileText size={14} />
                문서 생성
              </button>
              <button
                onClick={() => void reviewDocument()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-zinc-300"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <RefreshCw size={14} />
                AI 검토
              </button>
              <button
                onClick={() => void exportPptx()}
                disabled={exportBusy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#22c55e,#2563eb)' }}
              >
                {exportBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                PPTX 생성 및 저장
              </button>
            </div>

            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">자료 요약</p>
                <button onClick={() => setModalOpen(true)} className="text-xs text-violet-300">다시 선택</button>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                선택한 프로젝트 {selection?.projectIds.length || 0}개, 게시글 {selection?.articleIds.length || 0}개
              </p>
              <p className="mt-2 text-[11px] text-zinc-600 leading-relaxed">
                {sourceBusy ? '자료를 불러오는 중입니다...' : sourcePreview || '아직 자료가 선택되지 않았습니다.'}
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-semibold text-white mb-2">문서 미리보기</p>
              <div className="max-h-[360px] overflow-y-auto rounded-2xl p-4 text-[12px] leading-6 text-zinc-400" style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {reviewedText || documentText || '문서를 생성하면 미리보기가 여기에 표시됩니다.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
