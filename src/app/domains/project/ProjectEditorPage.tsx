import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Check, Clock3, Download, FileText, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import {
  createProjectWritingDocument,
  createProjectWritingPresentation,
  exportProjectWritingPptx,
  fetchProjectWritingSession,
  reviewProjectWritingDocument,
  saveProjectWritingDraft,
  selectProjectWritingSources,
  type ProjectWritingSession,
} from '../../api/contentApi';
import { useApp } from '../../contexts/AppContext';
import ProjectSourceSelectionModal from './ui/ProjectSourceSelectionModal';

type Role = 'DEVELOPER' | 'PM';
type SourceProvider = 'github' | 'notion' | 'figma';
type SectionStatus = 'EMPTY' | 'DRAFT' | 'COMPLETED';

type SectionMeta = {
  key: string;
  title: string;
  guide: string;
  placeholder: string;
};

type SlidePreview = {
  type?: string;
  title?: string;
  content?: string;
};

const roleSections: Record<Role, (lang: 'ko' | 'en') => SectionMeta[]> = {
  DEVELOPER: lang => [
    { key: 'overview', title: lang === 'ko' ? '프로젝트 개요' : 'Project overview', guide: lang === 'ko' ? '무엇을 왜 만들었는지, 어떤 문제를 풀었는지 먼저 설명합니다.' : 'Explain what you built, why you built it, and which problem it solved first.', placeholder: lang === 'ko' ? '프로젝트의 배경과 목표를 적어주세요.' : 'Describe the background and goal of the project.' },
    { key: 'role', title: lang === 'ko' ? '담당 역할' : 'Role', guide: lang === 'ko' ? '본인이 맡은 범위와 책임을 분리해서 적습니다.' : 'Separate your scope and responsibilities clearly.', placeholder: lang === 'ko' ? '내가 맡은 역할과 책임을 작성하세요.' : 'Write your scope and responsibilities.' },
    { key: 'problem', title: lang === 'ko' ? '문제 정의' : 'Problem definition', guide: lang === 'ko' ? '해결하려는 문제를 사용자 관점에서 선명하게 설명합니다.' : 'State the problem clearly from the user perspective.', placeholder: lang === 'ko' ? '이 프로젝트가 해결한 문제를 적어주세요.' : 'Write the problem this project solved.' },
    { key: 'tech', title: lang === 'ko' ? '기술 스택' : 'Tech stack', guide: lang === 'ko' ? '실제로 사용한 기술만 간결하게 작성합니다.' : 'List only the technologies you actually used.', placeholder: lang === 'ko' ? 'React, TypeScript, Spring Boot...' : 'React, TypeScript, Spring Boot...' },
    { key: 'architecture', title: lang === 'ko' ? '시스템 아키텍처' : 'System architecture', guide: lang === 'ko' ? '구조와 흐름을 간단한 설명으로 정리합니다.' : 'Summarize the structure and data flow briefly.', placeholder: lang === 'ko' ? '아키텍처 구조와 흐름을 설명하세요.' : 'Describe architecture and flow.' },
    { key: 'core', title: lang === 'ko' ? '핵심 구현' : 'Core implementation', guide: lang === 'ko' ? '가장 중요한 구현 포인트 2~3개를 적습니다.' : 'Add the 2-3 most important implementation points.', placeholder: lang === 'ko' ? '핵심 구현 내용을 적어주세요.' : 'Describe the core implementation.' },
    { key: 'trouble', title: lang === 'ko' ? '트러블슈팅' : 'Troubleshooting', guide: lang === 'ko' ? '문제-원인-해결-결과 순서로 적습니다.' : 'Use problem, cause, fix, and result structure.', placeholder: lang === 'ko' ? '어떤 문제를 어떻게 해결했는지 적어주세요.' : 'Explain the problem and how you solved it.' },
    { key: 'performance', title: lang === 'ko' ? '성능 개선' : 'Performance', guide: lang === 'ko' ? '전후 비교가 있으면 가장 좋습니다.' : 'Show before/after if possible.', placeholder: lang === 'ko' ? '성능 개선 내용을 적어주세요.' : 'Write the performance improvement.' },
    { key: 'result', title: lang === 'ko' ? '결과' : 'Result', guide: lang === 'ko' ? '정량/정성 결과를 모두 적어도 좋습니다.' : 'Add both quantitative and qualitative results.', placeholder: lang === 'ko' ? '프로젝트 결과를 적어주세요.' : 'Describe the final result.' },
    { key: 'retrospective', title: lang === 'ko' ? '회고' : 'Retrospective', guide: lang === 'ko' ? '잘한 점과 아쉬운 점, 다음 개선 포인트를 적습니다.' : 'Write what went well, what was hard, and what to improve next.', placeholder: lang === 'ko' ? '회고를 적어주세요.' : 'Write your retrospective.' },
  ],
  PM: lang => [
    { key: 'overview', title: lang === 'ko' ? '프로젝트 개요' : 'Project overview', guide: lang === 'ko' ? '문제와 목표를 아주 간단하고 분명하게 정리합니다.' : 'Summarize the goal and problem clearly.', placeholder: lang === 'ko' ? '프로젝트 개요를 적어주세요.' : 'Write the project overview.' },
    { key: 'problem', title: lang === 'ko' ? '문제 정의' : 'Problem definition', guide: lang === 'ko' ? '왜 이 문제가 중요한지 적습니다.' : 'Explain why this problem matters.', placeholder: lang === 'ko' ? '문제를 작성하세요.' : 'Write the problem statement.' },
    { key: 'market', title: lang === 'ko' ? '시장 분석' : 'Market analysis', guide: lang === 'ko' ? '시장 흐름과 기회 포인트를 정리합니다.' : 'Summarize market trends and opportunities.', placeholder: lang === 'ko' ? '시장 분석 내용을 적어주세요.' : 'Write the market analysis.' },
    { key: 'competition', title: lang === 'ko' ? '경쟁사 분석' : 'Competitor analysis', guide: lang === 'ko' ? '비교 기준을 명확히 두고 정리합니다.' : 'Compare against a few clear criteria.', placeholder: lang === 'ko' ? '경쟁사 분석을 적어주세요.' : 'Write the competitor analysis.' },
    { key: 'user', title: lang === 'ko' ? '사용자 분석' : 'User analysis', guide: lang === 'ko' ? '누가 왜 사용하는지 적습니다.' : 'Describe who uses it and why.', placeholder: lang === 'ko' ? '사용자 분석을 적어주세요.' : 'Write the user analysis.' },
    { key: 'persona', title: lang === 'ko' ? '페르소나' : 'Persona', guide: lang === 'ko' ? '대표 사용자 한 명을 구체적으로 그립니다.' : 'Create one representative user profile.', placeholder: lang === 'ko' ? '페르소나를 적어주세요.' : 'Write the persona.' },
    { key: 'hypothesis', title: lang === 'ko' ? '핵심 가설' : 'Hypothesis', guide: lang === 'ko' ? '검증 가능한 가설 형태로 적습니다.' : 'Write a testable hypothesis.', placeholder: lang === 'ko' ? '핵심 가설을 적어주세요.' : 'Write the hypothesis.' },
    { key: 'prd', title: 'PRD', guide: lang === 'ko' ? '목표와 범위를 중심으로 적습니다.' : 'Focus on goal and scope.', placeholder: lang === 'ko' ? 'PRD 내용을 적어주세요.' : 'Write the PRD.' },
    { key: 'requirements', title: lang === 'ko' ? '요구사항 정의' : 'Requirements', guide: lang === 'ko' ? '기능별 요구를 나눠서 적습니다.' : 'Split requirements by feature.', placeholder: lang === 'ko' ? '요구사항을 적어주세요.' : 'Write requirements.' },
    { key: 'priority', title: lang === 'ko' ? '기능 우선순위' : 'Priority', guide: lang === 'ko' ? '왜 이 순서인지 한 줄로 설명합니다.' : 'Explain why the order makes sense.', placeholder: lang === 'ko' ? '우선순위를 적어주세요.' : 'Write feature priority.' },
    { key: 'ia', title: 'IA', guide: lang === 'ko' ? '정보 구조를 단순하게 정리합니다.' : 'Keep information architecture simple.', placeholder: lang === 'ko' ? 'IA 내용을 적어주세요.' : 'Write IA.' },
    { key: 'userFlow', title: 'User Flow', guide: lang === 'ko' ? '사용 흐름을 단계별로 적습니다.' : 'Describe the user flow step by step.', placeholder: lang === 'ko' ? 'User Flow를 적어주세요.' : 'Write the user flow.' },
    { key: 'wireframe', title: lang === 'ko' ? '와이어프레임' : 'Wireframe', guide: lang === 'ko' ? '화면 구조와 의도를 설명합니다.' : 'Explain the layout and intent.', placeholder: lang === 'ko' ? '와이어프레임 내용을 적어주세요.' : 'Write the wireframe notes.' },
    { key: 'policy', title: lang === 'ko' ? '정책 정의' : 'Policy', guide: lang === 'ko' ? '예외와 규칙을 분명히 적습니다.' : 'List rules and exceptions clearly.', placeholder: lang === 'ko' ? '정책을 적어주세요.' : 'Write the policy.' },
    { key: 'roadmap', title: lang === 'ko' ? '로드맵' : 'Roadmap', guide: lang === 'ko' ? '실행 순서가 보이게 정리합니다.' : 'Make the execution order visible.', placeholder: lang === 'ko' ? '로드맵을 적어주세요.' : 'Write the roadmap.' },
    { key: 'kpi', title: 'KPI', guide: lang === 'ko' ? '측정 가능한 기준으로 적습니다.' : 'Use measurable metrics.', placeholder: lang === 'ko' ? 'KPI를 적어주세요.' : 'Write KPI metrics.' },
    { key: 'result', title: lang === 'ko' ? '결과' : 'Result', guide: lang === 'ko' ? '정리된 결과를 적습니다.' : 'Summarize the result.', placeholder: lang === 'ko' ? '결과를 적어주세요.' : 'Write the result.' },
    { key: 'retrospective', title: lang === 'ko' ? '회고' : 'Retrospective', guide: lang === 'ko' ? '배운 점과 다음 개선점을 적습니다.' : 'Write lessons learned and next steps.', placeholder: lang === 'ko' ? '회고를 적어주세요.' : 'Write the retrospective.' },
  ],
};

function createEmptySections(items: SectionMeta[]) {
  return items.reduce<Record<string, { value: string; status: SectionStatus }>>((acc, item) => {
    acc[item.key] = { value: '', status: 'EMPTY' };
    return acc;
  }, {});
}

function inferStatus(value: string): SectionStatus {
  const trimmed = value.trim();
  if (!trimmed) return 'EMPTY';
  return trimmed.length > 40 ? 'COMPLETED' : 'DRAFT';
}

function countCompletedSections(sectionDrafts: Record<string, { value: string; status: SectionStatus }>) {
  return Object.values(sectionDrafts).filter(section => section.status === 'COMPLETED').length;
}

function parsePresentation(json: string | null): SlidePreview[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { slides?: SlidePreview[] };
    return Array.isArray(parsed.slides) ? parsed.slides : [];
  } catch {
    return [];
  }
}

function providerLabel(provider: SourceProvider) {
  return provider === 'github' ? 'GitHub' : provider === 'notion' ? 'Notion' : 'Figma';
}

export default function ProjectEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();
  const ko = language === 'ko';
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const projectId = Number(query.get('projectId') || 0);
  const portfolioId = Number(query.get('portfolioId') || 0);
  const projectName = query.get('name') || (ko ? '새 프로젝트' : 'New project');
  const role = (query.get('role') === 'PM' ? 'PM' : 'DEVELOPER') as Role;
  const sectionMeta = useMemo(() => roleSections[role](language), [language, role]);

  const [session, setSession] = useState<ProjectWritingSession | null>(null);
  const [activeKey, setActiveKey] = useState(sectionMeta[0]?.key || '');
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, { value: string; status: SectionStatus }>>(() => createEmptySections(sectionMeta));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (sectionMeta.length > 0 && !activeKey) {
      setActiveKey(sectionMeta[0].key);
    }
  }, [activeKey, sectionMeta]);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let alive = true;
    void fetchProjectWritingSession(projectId)
      .then(data => {
        if (!alive) return;
        setSession(data);
        const nextDrafts = createEmptySections(sectionMeta);
        Object.entries(data.sectionDrafts || {}).forEach(([key, value]) => {
          if (nextDrafts[key]) {
            nextDrafts[key] = { value: value || '', status: inferStatus(value || '') };
          }
        });
        Object.entries(data.sectionStatuses || {}).forEach(([key, status]) => {
          if (nextDrafts[key]) {
            nextDrafts[key] = { ...nextDrafts[key], status: (status as SectionStatus) || nextDrafts[key].status };
          }
        });
        setSectionDrafts(nextDrafts);
        setActiveKey(sectionMeta.find(item => nextDrafts[item.key])?.key || sectionMeta[0]?.key || '');
        setError(data.lastError || null);
      })
      .catch(() => {
        if (!alive) return;
        setSession(null);
        setSectionDrafts(createEmptySections(sectionMeta));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [projectId, sectionMeta]);

  const completedCount = useMemo(() => countCompletedSections(sectionDrafts), [sectionDrafts]);
  const progress = useMemo(() => {
    if (sectionMeta.length === 0) return 0;
    return Math.round((completedCount / sectionMeta.length) * 100);
  }, [completedCount, sectionMeta.length]);

  const sourceSnapshot = session?.sourceSnapshot || {};
  const selectedProvider = (session?.selectedProvider || String(sourceSnapshot.provider || '')).toLowerCase();
  const sourceItems = Array.isArray(sourceSnapshot.sources) ? (sourceSnapshot.sources as Array<Record<string, unknown>>) : [];
  const selectedSlides = parsePresentation(session?.presentationJson || null);
  const selectedSourceCount = session?.selectedSourceIds?.length || sourceItems.length;

  const persistDraft = async (nextDrafts: Record<string, { value: string; status: SectionStatus }>) => {
    if (!projectId) return;
    setSaving(true);
    try {
      const payload = {
        progress,
        sectionDrafts: Object.fromEntries(Object.entries(nextDrafts).map(([key, item]) => [key, item.value])),
        sectionStatuses: Object.fromEntries(Object.entries(nextDrafts).map(([key, item]) => [key, item.status])),
      };
      const updated = await saveProjectWritingDraft(projectId, payload);
      setSession(updated);
      setError(updated.lastError || null);
    } catch {
      setError(ko ? '임시 저장에 실패했습니다.' : 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!projectId || loading) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      void persistDraft(sectionDrafts);
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionDrafts, projectId, loading]);

  const updateSection = (key: string, value: string) => {
    setSectionDrafts(prev => ({
      ...prev,
      [key]: {
        value,
        status: inferStatus(value),
      },
    }));
  };

  const handleSelectSources = async (payload: { provider: SourceProvider; sourceIds: string[] }) => {
    if (!projectId || !portfolioId) return;
    setSourceError(null);
    try {
      const next = await selectProjectWritingSources(projectId, {
        portfolioId,
        provider: payload.provider,
        sourceIds: payload.sourceIds,
      });
      setSession(next);
      setSourceModalOpen(false);
      setPreviewBlob(null);
      setError(next.lastError || null);
    } catch {
      setSourceError(ko ? '자료를 연결하지 못했습니다.' : 'Failed to apply selected sources.');
    }
  };

  const createDocument = async () => {
    if (!projectId) return;
    if (selectedSourceCount === 0) {
      setError(ko ? '먼저 자료를 선택해 주세요.' : 'Select sources first.');
      return;
    }
    setDocumentBusy(true);
    setError(null);
    try {
      const next = await createProjectWritingDocument(projectId);
      setSession(next);
      setPreviewBlob(null);
      setError(next.lastError || null);
    } catch {
      setError(ko ? '문서 생성에 실패했습니다.' : 'Failed to create the document.');
    } finally {
      setDocumentBusy(false);
    }
  };

  const reviewDocument = async () => {
    if (!projectId) return;
    setReviewBusy(true);
    setError(null);
    try {
      const next = await reviewProjectWritingDocument(projectId);
      setSession(next);
      setPreviewBlob(null);
      setError(next.lastError || null);
    } catch {
      setError(ko ? 'AI 검수에 실패했습니다.' : 'Failed to review the document.');
    } finally {
      setReviewBusy(false);
    }
  };

  const generatePptx = async () => {
    if (!projectId) return;
    if (!session?.reviewedDocument) {
      setError(ko ? '먼저 AI 검수를 진행해 주세요.' : 'Please run AI review first.');
      return;
    }
    setGenerateBusy(true);
    setError(null);
    try {
      const next = await createProjectWritingPresentation(projectId);
      setSession(next);
      const blob = await exportProjectWritingPptx(projectId);
      setPreviewBlob(blob);
      setError(next.lastError || null);
    } catch {
      setError(ko ? 'PPTX 생성에 실패했습니다.' : 'Failed to generate the PPTX.');
    } finally {
      setGenerateBusy(false);
    }
  };

  const downloadPptx = async () => {
    if (!projectId) return;
    setDownloadBusy(true);
    try {
      const blob = previewBlob || (await exportProjectWritingPptx(projectId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadBusy(false);
    }
  };

  const activeSection = sectionMeta.find(item => item.key === activeKey) || sectionMeta[0];
  const activeDraft = activeSection ? sectionDrafts[activeSection.key] : null;
  const nextSectionKey = sectionMeta[(sectionMeta.findIndex(item => item.key === activeKey) + 1) % sectionMeta.length]?.key || sectionMeta[0]?.key || '';

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={14} className="animate-spin" />
          {ko ? '프로젝트를 불러오는 중...' : 'Loading project draft...'}
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center bg-[#050505] px-6">
        <div className="w-full max-w-lg rounded-[28px] border border-white/8 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
            <FileText size={22} />
          </div>
          <h1 className="text-xl font-black text-white">{ko ? '프로젝트가 필요합니다' : 'Project required'}</h1>
          <p className="mt-2 text-sm text-zinc-500">{ko ? '새 프로젝트를 만든 뒤 다시 열어 주세요.' : 'Create a project first, then reopen this page.'}</p>
          <button
            type="button"
            onClick={() => navigate('/workspace')}
            className="mt-6 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            {ko ? '워크스페이스로 이동' : 'Go to workspace'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-y-auto bg-[#050505] px-6 py-6 lg:px-8">
      <ProjectSourceSelectionModal
        open={sourceModalOpen}
        initialProvider={(selectedProvider as SourceProvider) || 'github'}
        initialSourceIds={session?.selectedSourceIds || []}
        onClose={() => setSourceModalOpen(false)}
        onConfirm={handleSelectSources}
      />

      <div className="mx-auto max-w-[1480px] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/workspace')}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
          >
            <ArrowLeft size={14} />
            {ko ? '워크스페이스로 돌아가기' : 'Back to workspace'}
          </button>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Clock3 size={12} />
            {ko ? '마지막 저장' : 'Last saved'} {session?.lastSavedAt ? new Date(session.lastSavedAt).toLocaleString() : '-'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className="space-y-6">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                    <Sparkles size={12} />
                    {ko ? '프로젝트 원고' : 'Project draft'}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white">{session?.projectName || projectName}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    {ko
                      ? '외부 자료를 고르고, 섹션별로 원고를 작성하고, AI 검수를 한 번 거친 뒤 PPTX를 생성합니다.'
                      : 'Choose external sources, write each section one by one, review once with AI, then generate the PPTX.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSourceModalOpen(true)}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {ko ? '자료 선택' : 'Select sources'}
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{session?.role || role}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                    {ko ? `선택 ${selectedSourceCount}개` : `${selectedSourceCount} sources`}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">
                    {ko ? `완료 ${completedCount}/${sectionMeta.length}` : `Completed ${completedCount}/${sectionMeta.length}`}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{Math.round(progress)}%</span>
                  {session?.status && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                      {session.status}
                    </span>
                  )}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">{activeSection?.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{activeSection?.guide}</p>
                </div>
                <div className="text-right text-xs text-zinc-600">
                  <div className="uppercase tracking-[0.24em]">{activeDraft?.status || 'EMPTY'}</div>
                  <div className="mt-1">{saving ? (ko ? '저장 중...' : 'Saving...') : ko ? '자동 저장' : 'Auto save'}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {sectionMeta.map(item => {
                  const current = sectionDrafts[item.key];
                  const active = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveKey(item.key)}
                      className="rounded-2xl p-4 text-left transition-all"
                      style={{
                        background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        {current?.status === 'COMPLETED' ? <Check size={13} className="text-emerald-300" /> : null}
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-zinc-500 line-clamp-2">{item.guide}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[26px] border border-white/8 bg-black/20 p-4">
                <textarea
                  value={activeDraft?.value || ''}
                  onChange={e => updateSection(activeSection.key, e.target.value)}
                  placeholder={activeSection.placeholder}
                  rows={10}
                  className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-700"
                />
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>{ko ? '한 번에 길게 쓰기보다, 섹션 하나씩 채워가면 됩니다.' : 'Write one section at a time. Keep it short and focused.'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (nextSectionKey) setActiveKey(nextSectionKey);
                    }}
                    className="rounded-full border border-white/8 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/[0.05]"
                  >
                    {ko ? '다음 섹션' : 'Next section'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {sourceError && (
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {sourceError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{ko ? '선택한 자료' : 'Selected sources'}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {ko ? '선택한 자료는 프로젝트 원고와 PPT 생성에 함께 사용됩니다.' : 'Selected items are used in the draft and final PPT.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSourceModalOpen(true)}
                    className="rounded-xl border border-white/8 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.05]"
                  >
                    {ko ? '선택 변경' : 'Edit'}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {sourceItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-5 text-sm text-zinc-500">
                      {ko ? '아직 연결한 자료가 없습니다.' : 'No connected sources yet.'}
                    </div>
                  ) : sourceItems.map((item, index) => (
                    <div key={String(item.resourceId || index)} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{String(item.title || '')}</p>
                          <p className="mt-1 text-xs text-zinc-500">{String(item.subtitle || '')}</p>
                        </div>
                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-200">
                          {String(item.kind || '').toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-zinc-500">{String(item.summary || '')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
                <h3 className="text-sm font-bold text-white">{ko ? '문서 미리보기' : 'Document preview'}</h3>
                <div className="mt-4 rounded-[26px] border border-white/8 bg-black/25 p-4">
                  <div className="max-h-[280px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                    {session?.reviewedDocument || session?.documentText || (ko ? '문서를 생성하면 미리보기가 여기에 표시됩니다.' : 'Create the document to see the preview here.')}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                    {ko ? '자료를 선택한 뒤 문서를 생성하세요.' : 'Select sources, then generate the document.'}
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3">
                    {ko ? 'AI 검수는 한 번만 진행됩니다.' : 'AI review runs only once.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">{ko ? '생성 과정' : 'Generation pipeline'}</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {ko ? '원고 작성 → AI 검수 1회 → PPTX 생성 순서로 진행됩니다.' : 'Draft writing → one AI review → PPTX generation.'}
                  </p>
                </div>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-200">{session?.status || 'NOT_STARTED'}</span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { key: 'draft', title: ko ? '원고 작성' : 'Write draft', desc: ko ? '섹션별 내용을 직접 작성합니다.' : 'Write each section manually.' },
                  { key: 'review', title: ko ? 'AI 검수 1회' : 'AI review once', desc: ko ? '문장 정리와 흐름만 다듬습니다.' : 'Polish the wording and flow only.' },
                  { key: 'ppt', title: ko ? 'PPTX 생성' : 'Build PPTX', desc: ko ? '검수된 문서로 PPT를 만듭니다.' : 'Generate the PPT from the reviewed document.' },
                ].map((step, index) => {
                  const active = (index === 0 && session?.status === 'WRITING') || (index === 1 && session?.status === 'DOCUMENT_CREATED') || (index === 2 && session?.status === 'REVIEWED') || session?.status === 'PPT_CREATED';
                  const done = index === 0
                    ? ['DOCUMENT_CREATED', 'REVIEWED', 'PPT_CREATED'].includes(session?.status || '')
                    : index === 1
                      ? ['REVIEWED', 'PPT_CREATED'].includes(session?.status || '')
                      : session?.status === 'PPT_CREATED';
                  return (
                    <div
                      key={step.key}
                      className="flex items-start gap-3 rounded-2xl p-4"
                      style={{
                        background: active ? 'rgba(124,58,237,0.10)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.24)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
                        {done ? <Check size={12} className="text-emerald-300" /> : index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-sm font-bold text-white">{ko ? '실행 버튼' : 'Actions'}</h3>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setSourceModalOpen(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.05]"
                >
                  <span>{ko ? '외부 자료 선택' : 'Select external sources'}</span>
                  <Sparkles size={14} className="text-violet-300" />
                </button>
                <button
                  type="button"
                  onClick={() => void createDocument()}
                  disabled={documentBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {documentBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {ko ? '문서 생성' : 'Create document'}
                </button>
                <button
                  type="button"
                  onClick={() => void reviewDocument()}
                  disabled={reviewBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                >
                  {reviewBusy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {ko ? 'AI 검수' : 'AI review'}
                </button>
                <button
                  type="button"
                  onClick={() => void generatePptx()}
                  disabled={generateBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#2563eb)' }}
                >
                  {generateBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  {ko ? 'PPTX 생성' : 'Generate PPTX'}
                </button>
                <button
                  type="button"
                  onClick={() => void downloadPptx()}
                  disabled={downloadBusy || !previewBlob}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                >
                  {downloadBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {ko ? '다운로드' : 'Download'}
                </button>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{ko ? 'PPT 미리보기' : 'PPT preview'}</h3>
                <span className="text-xs text-zinc-500">{selectedSlides.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {selectedSlides.length > 0 ? (
                  selectedSlides.map((slide, index) => (
                    <div key={`${slide.type || 'slide'}-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.24em] text-violet-300">{slide.type || `SLIDE ${index + 1}`}</span>
                        <span className="text-[10px] text-zinc-500">{index + 1}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{slide.title || (ko ? '제목 없음' : 'Untitled')}</p>
                      <p className="mt-2 line-clamp-3 text-xs leading-6 text-zinc-500">{slide.content || ''}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-8 text-center text-sm text-zinc-500">
                    {ko ? 'PPTX를 생성하면 여기에 미리보기가 보입니다.' : 'A preview appears here after generation.'}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-sm font-bold text-white">{ko ? '연결 상태' : 'Connection'}</h3>
              <div className="mt-4 space-y-3">
                {(['github', 'notion', 'figma'] as SourceProvider[]).map(provider => {
                  const connected = Boolean(session?.selectedProvider?.toLowerCase() === provider || sourceSnapshot.provider === provider.toUpperCase());
                  return (
                    <div key={provider} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <span className="text-sm text-zinc-200">{providerLabel(provider)}</span>
                      <span className={`text-[10px] ${connected ? 'text-emerald-300' : 'text-zinc-600'}`}>{connected ? (ko ? '사용 중' : 'In use') : (ko ? '미사용' : 'Idle')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
