import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, Bookmark, Check, Clock3, Download, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react';
import {
  createProjectWritingDocument,
  createProjectWritingPresentation,
  exportProjectWritingPptx,
  fetchProjectWritingSession,
  reviewProjectWritingDocument,
  saveProjectWritingDraft,
  selectProjectWritingSources,
  updatePortfolioProject,
  type ProjectWritingSession,
} from '../../api/contentApi';
import { type IntegrationProviderKey } from '../../api/integrationProviders';
import { useApp } from '../../contexts/AppContext';
import ProjectSourceSelectionModal from './ui/ProjectSourceSelectionModal';
import SectionEditorModal from './ui/SectionEditorModal';
import {
  loadDraft as loadLocalDraft,
  notifyLocalProjectItemsChanged,
  saveDraft as saveLocalDraft,
  type ProjectWritingDraft as LocalProjectWritingDraft,
  upsertLocalProjectItem,
} from '../workspace/projectWriting';

type Role = 'DEVELOPER' | 'PM';
type SourceProvider = IntegrationProviderKey;
type SectionStatus = 'EMPTY' | 'DRAFT' | 'COMPLETED';

type SectionMeta = {
  key: string;
  title: string;
  guide: string;
  placeholder: string;
};

type ImageAsset = {
  id: string;
  name: string;
  url: string;
};

const roleSections: Record<Role, (lang: 'ko' | 'en') => SectionMeta[]> = {
  DEVELOPER: lang => [
    { key: 'overview', title: lang === 'ko' ? '프로젝트 개요' : 'Project overview', guide: lang === 'ko' ? '무엇을 왜 만들었는지, 어떤 문제를 풀었는지 먼저 설명합니다.' : 'Explain what you built, why you built it, and what problem it solved.', placeholder: lang === 'ko' ? '프로젝트 개요를 적어주세요.' : 'Write the project overview.' },
    { key: 'role', title: lang === 'ko' ? '담당 역할' : 'Role', guide: lang === 'ko' ? '본인의 범위를 분리해서 적습니다.' : 'Separate your own scope clearly.', placeholder: lang === 'ko' ? '맡은 역할을 적어주세요.' : 'Write your responsibilities.' },
    { key: 'problem', title: lang === 'ko' ? '문제 정의' : 'Problem definition', guide: lang === 'ko' ? '해결하려는 문제를 사용자 관점에서 설명합니다.' : 'Describe the problem from the user perspective.', placeholder: lang === 'ko' ? '문제를 적어주세요.' : 'Write the problem.' },
    { key: 'tech', title: lang === 'ko' ? '기술 스택' : 'Tech stack', guide: lang === 'ko' ? '실제로 사용한 기술만 적습니다.' : 'List only the technologies you actually used.', placeholder: 'React, TypeScript, Spring Boot...' },
    { key: 'architecture', title: lang === 'ko' ? '시스템 아키텍처' : 'System architecture', guide: lang === 'ko' ? '구조와 데이터 흐름을 간단하게 정리합니다.' : 'Summarize the structure and data flow.', placeholder: lang === 'ko' ? '구조를 적어주세요.' : 'Describe the architecture.' },
    { key: 'core', title: lang === 'ko' ? '핵심 구현' : 'Core implementation', guide: lang === 'ko' ? '가장 중요한 구현 포인트를 적습니다.' : 'Write the key implementation points.', placeholder: lang === 'ko' ? '핵심 구현을 적어주세요.' : 'Write the core implementation.' },
    { key: 'trouble', title: lang === 'ko' ? '트러블슈팅' : 'Troubleshooting', guide: lang === 'ko' ? '문제-원인-해결-결과 순으로 적습니다.' : 'Use problem, cause, fix, and result.', placeholder: lang === 'ko' ? '문제 해결 과정을 적어주세요.' : 'Explain how you solved problems.' },
    { key: 'performance', title: lang === 'ko' ? '성능 개선' : 'Performance', guide: lang === 'ko' ? '전후 비교가 있으면 좋습니다.' : 'Add before/after if possible.', placeholder: lang === 'ko' ? '성능 개선 내용을 적어주세요.' : 'Write the improvement.' },
    { key: 'result', title: lang === 'ko' ? '결과' : 'Result', guide: lang === 'ko' ? '정량/정성 결과를 적습니다.' : 'Add quantitative and qualitative results.', placeholder: lang === 'ko' ? '결과를 적어주세요.' : 'Describe the result.' },
    { key: 'retrospective', title: lang === 'ko' ? '회고' : 'Retrospective', guide: lang === 'ko' ? '배운 점과 개선점을 적습니다.' : 'Write what went well and what to improve.', placeholder: lang === 'ko' ? '회고를 적어주세요.' : 'Write your retrospective.' },
  ],
  PM: lang => [
    { key: 'problem', title: lang === 'ko' ? '문제 정의' : 'Problem definition', guide: lang === 'ko' ? '왜 중요한 문제인지 설명합니다.' : 'Explain why the problem matters.', placeholder: lang === 'ko' ? '문제 정의를 적어주세요.' : 'Write the problem.' },
    { key: 'market', title: lang === 'ko' ? '시장 분석' : 'Market analysis', guide: lang === 'ko' ? '시장과 기회를 정리합니다.' : 'Summarize the market and opportunity.', placeholder: lang === 'ko' ? '시장 분석을 적어주세요.' : 'Write market analysis.' },
    { key: 'competition', title: lang === 'ko' ? '경쟁사 분석' : 'Competitor analysis', guide: lang === 'ko' ? '비교 기준을 명확히 적습니다.' : 'Compare with clear criteria.', placeholder: lang === 'ko' ? '경쟁사 분석을 적어주세요.' : 'Write competitor analysis.' },
    { key: 'user', title: lang === 'ko' ? '사용자 분석' : 'User analysis', guide: lang === 'ko' ? '누가 쓰는지 설명합니다.' : 'Describe the target users.', placeholder: lang === 'ko' ? '사용자 분석을 적어주세요.' : 'Write user analysis.' },
    { key: 'persona', title: lang === 'ko' ? '퍼소나' : 'Persona', guide: lang === 'ko' ? '대표 사용자를 한 명 정리합니다.' : 'Create one representative user.', placeholder: lang === 'ko' ? '퍼소나를 적어주세요.' : 'Write persona.' },
    { key: 'hypothesis', title: lang === 'ko' ? '핵심 가설' : 'Hypothesis', guide: lang === 'ko' ? '검증 가능한 형태로 적습니다.' : 'Write a testable hypothesis.', placeholder: lang === 'ko' ? '가설을 적어주세요.' : 'Write hypothesis.' },
    { key: 'prd', title: 'PRD', guide: lang === 'ko' ? '목표와 범위를 적습니다.' : 'Focus on goal and scope.', placeholder: 'Write PRD.' },
    { key: 'requirements', title: lang === 'ko' ? '요구사항 정의' : 'Requirements', guide: lang === 'ko' ? '기능별로 정리합니다.' : 'Split requirements by feature.', placeholder: lang === 'ko' ? '요구사항을 적어주세요.' : 'Write requirements.' },
    { key: 'priority', title: lang === 'ko' ? '기능 우선순위' : 'Priority', guide: lang === 'ko' ? '우선순위 기준을 적습니다.' : 'Explain why the order makes sense.', placeholder: lang === 'ko' ? '우선순위를 적어주세요.' : 'Write priority.' },
    { key: 'ia', title: 'IA', guide: lang === 'ko' ? '정보 구조를 정리합니다.' : 'Keep information architecture simple.', placeholder: 'Write IA.' },
    { key: 'userFlow', title: 'User Flow', guide: lang === 'ko' ? '사용자 흐름을 적습니다.' : 'Describe the user flow step by step.', placeholder: 'Write user flow.' },
    { key: 'wireframe', title: lang === 'ko' ? '와이어프레임' : 'Wireframe', guide: lang === 'ko' ? '화면 구조와 의도를 적습니다.' : 'Explain the layout and intent.', placeholder: lang === 'ko' ? '와이어프레임을 적어주세요.' : 'Write wireframe notes.' },
    { key: 'policy', title: lang === 'ko' ? '정책 정의' : 'Policy', guide: lang === 'ko' ? '규칙과 예외를 적습니다.' : 'List rules and exceptions.', placeholder: lang === 'ko' ? '정책을 적어주세요.' : 'Write policy.' },
    { key: 'roadmap', title: lang === 'ko' ? '로드맵' : 'Roadmap', guide: lang === 'ko' ? '실행 순서를 정리합니다.' : 'Make the execution order visible.', placeholder: lang === 'ko' ? '로드맵을 적어주세요.' : 'Write roadmap.' },
    { key: 'kpi', title: 'KPI', guide: lang === 'ko' ? '측정 가능한 기준을 적습니다.' : 'Use measurable metrics.', placeholder: 'Write KPI.' },
    { key: 'result', title: lang === 'ko' ? '결과' : 'Result', guide: lang === 'ko' ? '정리된 결과를 적습니다.' : 'Summarize the result.', placeholder: lang === 'ko' ? '결과를 적어주세요.' : 'Write result.' },
    { key: 'retrospective', title: lang === 'ko' ? '회고' : 'Retrospective', guide: lang === 'ko' ? '배운 점과 개선점을 적습니다.' : 'Write lessons learned and next steps.', placeholder: lang === 'ko' ? '회고를 적어주세요.' : 'Write retrospective.' },
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

function normalizeForReview(text: string) {
  return text
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, index, arr) => line.trim() !== '' || (index > 0 && arr[index - 1].trim() !== ''))
    .join('\n')
    .trim();
}

function parsePresentation(json: string | null) {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { slides?: Array<{ type?: string; title?: string; content?: string }> };
    return Array.isArray(parsed.slides) ? parsed.slides : [];
  } catch {
    return [];
  }
}

function extractProjectSummary(documentText: string, reviewedText: string, projectName: string) {
  const source = (reviewedText || documentText || '').trim();
  if (!source) return `${projectName} 프로젝트`;
  const normalized = source.replace(/\s+/g, ' ').trim();
  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

function extractProjectSkills(drafts: Record<string, { value: string; status: SectionStatus }>) {
  const tech = drafts.tech?.value || '';
  return tech
    .split(/[,/|]/g)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

type SnapshotSource = {
  provider?: string;
  resourceId?: string;
  kind?: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  url?: string | null;
  imageUrl?: string | null;
  tags?: string[];
  raw?: Record<string, unknown>;
};

function mergeSources(previous: SnapshotSource[], next: SnapshotSource[]) {
  const map = new Map<string, SnapshotSource>();
  [...previous, ...next].forEach(item => {
    const key = `${String(item.provider || '').toUpperCase()}:${item.resourceId || item.title || ''}`;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function asSourceList(snapshot: Record<string, unknown>) {
  const value = snapshot.sources;
  if (!Array.isArray(value)) return [] as SnapshotSource[];
  return value.filter(Boolean) as SnapshotSource[];
}

function extractSourceBody(source: SnapshotSource) {
  const raw = source.raw && typeof source.raw === 'object' ? source.raw : {};
  const candidates = [
    source.summary,
    raw.content,
    raw.body,
    raw.text,
    raw.readme,
    raw.description,
    raw.markdown,
  ];
  return candidates
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .find(Boolean) || '';
}

function joinSourceText(source: SnapshotSource) {
  const raw = source.raw && typeof source.raw === 'object' ? JSON.stringify(source.raw).slice(0, 280) : '';
  return [
    source.title,
    source.subtitle,
    source.kind,
    source.summary,
    source.tags?.length ? source.tags.join(', ') : '',
    source.url || '',
    raw,
  ]
    .filter(Boolean)
    .join(' 쨌 ');
}

function buildSectionDraftMap(
  role: Role,
  sectionMeta: SectionMeta[],
  sourceSnapshot: Record<string, unknown>,
  baseDrafts: Record<string, { value: string; status: SectionStatus }>,
) {
  const sources = asSourceList(sourceSnapshot);
  if (sources.length === 0) return baseDrafts;

  const sectionKeys = sectionMeta.map(item => item.key);
  const merged = Object.fromEntries(
    sectionKeys.map(key => [
      key,
      {
        value: baseDrafts[key]?.value || '',
        status: baseDrafts[key]?.status || 'EMPTY',
      },
    ]),
  ) as Record<string, { value: string; status: SectionStatus }>;

  const developerRules: Array<{ key: string; terms: string[] }> = [
    { key: 'overview', terms: ['readme', 'overview', 'summary', 'description', 'introduction', 'project'] },
    { key: 'role', terms: ['role', 'responsibility', 'scope', 'owner'] },
    { key: 'problem', terms: ['issue', 'bug', 'problem', 'pain', 'challenge'] },
    { key: 'tech', terms: ['language', 'stack', 'tech', 'framework', 'library', 'dependency'] },
    { key: 'architecture', terms: ['architecture', 'system', 'flow', 'diagram', 'figma', 'page', 'frame'] },
    { key: 'core', terms: ['implementation', 'feature', 'pr', 'pull request', 'code', 'merge'] },
    { key: 'trouble', terms: ['trouble', 'issue', 'error', 'fix', 'debug', 'incident'] },
    { key: 'performance', terms: ['performance', 'optimization', 'speed', 'latency', 'benchmark'] },
    { key: 'result', terms: ['result', 'release', 'outcome', 'impact', 'demo'] },
    { key: 'retrospective', terms: ['retrospective', 'review', 'lesson', 'improve', 'reflection'] },
  ];
  const pmRules: Array<{ key: string; terms: string[] }> = [
    { key: 'problem', terms: ['problem', 'pain', 'issue', 'need'] },
    { key: 'market', terms: ['market', 'trend', 'opportunity', 'analysis'] },
    { key: 'competition', terms: ['competitor', 'comparison', 'benchmark'] },
    { key: 'user', terms: ['user', 'persona', 'target', 'research'] },
    { key: 'persona', terms: ['persona', 'segment', 'profile'] },
    { key: 'hypothesis', terms: ['hypothesis', 'assumption', 'validation'] },
    { key: 'prd', terms: ['prd', 'spec', 'specification'] },
    { key: 'requirements', terms: ['requirement', 'requirements', 'feature', 'scope'] },
    { key: 'priority', terms: ['priority', 'roadmap', 'priority list'] },
    { key: 'ia', terms: ['ia', 'information architecture', 'structure'] },
    { key: 'userFlow', terms: ['user flow', 'flow', 'journey'] },
    { key: 'wireframe', terms: ['wireframe', 'screen', 'layout'] },
    { key: 'policy', terms: ['policy', 'rule', 'exception'] },
    { key: 'roadmap', terms: ['roadmap', 'timeline', 'schedule'] },
    { key: 'kpi', terms: ['kpi', 'metric', 'goal'] },
    { key: 'result', terms: ['result', 'outcome', 'launch', 'release'] },
    { key: 'retrospective', terms: ['retrospective', 'review', 'lesson', 'improve'] },
  ];

  const rules = role === 'PM' ? pmRules : developerRules;
  const fallbackKeys = sectionKeys;
  let cursor = 0;

  sources.forEach(source => {
    const text = joinSourceText(source).toLowerCase();
    let matched = rules.find(rule => rule.terms.some(term => text.includes(term)));
    if (!matched && source.kind) {
      matched = rules.find(rule => text.includes(rule.key.toLowerCase())) || null;
    }
    const targetKey = matched?.key || fallbackKeys[cursor % fallbackKeys.length];
    cursor += 1;

    const nextText = [
      source.title,
      source.subtitle && source.subtitle !== source.title ? source.subtitle : '',
      extractSourceBody(source),
      source.kind ? `Type: ${source.kind}` : '',
      source.tags?.length ? `Tags: ${source.tags.join(', ')}` : '',
      source.url ? `URL: ${source.url}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const current = merged[targetKey]?.value?.trim();
    merged[targetKey] = {
      value: current ? `${current}\n\n${nextText}` : nextText,
      status: 'COMPLETED',
    };
  });

  return merged;
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
  const draftMode = query.get('draft') === '1' || !projectId;
  const viewMode = query.get('view') === '1';
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
  const [imageAssets, setImageAssets] = useState<ImageAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [reviewedText, setReviewedText] = useState('');
  const [step, setStep] = useState<'NOT_STARTED' | 'WRITING' | 'DOCUMENT_CREATED' | 'REVIEWED' | 'PPT_CREATED'>('NOT_STARTED');
  const [resumable, setResumable] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sourceModalDismissed, setSourceModalDismissed] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [reviewConfirmOpen, setReviewConfirmOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (accepted.length === 0) return;
    const nextAssets = await Promise.all(
      accepted.map(async file => ({
        id: `${file.name}:${file.size}:${file.lastModified}`,
        name: file.name,
        url: await readFileAsDataUrl(file),
      })),
    );
    setImageAssets(prev => {
      const map = new Map(prev.map(item => [item.id, item]));
      nextAssets.forEach(item => map.set(item.id, item));
      return Array.from(map.values());
    });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const persistLocalProjectListing = (
    nextDocumentText: string,
    nextReviewedText: string,
    nextStatus: string,
    nextDraftSnapshot: Record<string, { value: string; status: SectionStatus }> = sectionDrafts,
  ) => {
    if (!draftMode && portfolioId > 0) return;
    const summary = extractProjectSummary(nextDocumentText, nextReviewedText, projectName);
    const nextCompletedCount = countCompletedSections(nextDraftSnapshot);
    upsertLocalProjectItem({
      id: projectId || Number(Date.now()),
      portfolioId: portfolioId || 0,
      name: session?.projectName || projectName,
      role,
      summary,
      thumbnailUrl: imageAssets[0]?.url || null,
      skills: extractProjectSkills(nextDraftSnapshot),
      isSynced: nextStatus === 'REVIEWED' || nextStatus === 'PPT_CREATED',
      startDate: null,
      endDate: null,
      orderIndex: Number(session?.progress || nextCompletedCount || 0),
      imageUrls: imageAssets.map(item => item.url),
    });
    notifyLocalProjectItemsChanged();
  };

  useEffect(() => {
    if (sectionMeta.length > 0 && !activeKey) {
      setActiveKey(sectionMeta[0].key);
    }
  }, [activeKey, sectionMeta]);

  useEffect(() => {
    if (draftMode) {
      const existing = loadLocalDraft(projectId) as LocalProjectWritingDraft | null;
      if (existing) {
        const nextDrafts = createEmptySections(sectionMeta);
        Object.entries(existing.sections || {}).forEach(([key, value]) => {
          if (nextDrafts[key]) {
            nextDrafts[key] = {
              value: value?.value || '',
              status: (value?.status as SectionStatus) || inferStatus(value?.value || ''),
            };
          }
        });
        setSectionDrafts(nextDrafts);
        setActiveKey(sectionMeta.find(item => nextDrafts[item.key])?.key || sectionMeta[0]?.key || '');
        setDocumentText(existing.document || '');
        setReviewedText(existing.reviewedDocument || '');
        setStep((existing.writingStatus as any) || 'NOT_STARTED');
        setResumable(Boolean(existing.updatedAt));
      }
      setLoading(false);
      return;
    }

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
        setStep((data.status as any) || 'NOT_STARTED');
        setDocumentText(data.documentText || '');
        setReviewedText(data.reviewedDocument || '');
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
  }, [draftMode, projectId, sectionMeta]);

  const completedCount = useMemo(() => countCompletedSections(sectionDrafts), [sectionDrafts]);
  const progress = useMemo(() => (sectionMeta.length === 0 ? 0 : Math.round((completedCount / sectionMeta.length) * 100)), [completedCount, sectionMeta.length]);
  const allSectionsCompleted = sectionMeta.length > 0 && completedCount === sectionMeta.length;
  const activeSection = sectionMeta.find(item => item.key === activeKey) || sectionMeta[0];
  const nextSectionKey = sectionMeta[(sectionMeta.findIndex(item => item.key === activeKey) + 1) % sectionMeta.length]?.key || sectionMeta[0]?.key || '';
  const sourceSnapshot = session?.sourceSnapshot || {};
  const selectedProvider = (session?.selectedProvider || String(sourceSnapshot.provider || '')).toLowerCase();
  const sourceItems = Array.isArray(sourceSnapshot.sources) ? (sourceSnapshot.sources as Array<Record<string, unknown>>) : [];
  const selectedSlides = parsePresentation(session?.presentationJson || null);
  const selectedSourceCount = session?.selectedSourceIds?.length || sourceItems.length;

  const updateSection = (key: string, value: string) => {
    setSectionDrafts(prev => ({
      ...prev,
      [key]: { value, status: inferStatus(value) },
    }));
    setStep('WRITING');
  };

  const saveSection = (value: string) => {
    if (!editingSection) return;
    setSectionDrafts(prev => ({
      ...prev,
      [editingSection]: { value, status: value.trim() ? 'COMPLETED' : 'EMPTY' },
    }));
    setStep('WRITING');
    setEditingSection(null);
  };

  const handleSelectSources = async (payload: {
    provider: SourceProvider;
    sourceIds: string[];
    sources: SnapshotSource[];
    sourceSelections?: Array<{ provider: SourceProvider; sourceIds: string[] }>;
  }) => {
    if (!projectId) {
      setSourceError('Create a project first.');
      return;
    }
    setSourceError(null);

    if (draftMode || !portfolioId) {
      setSession(prev => ({
        ...(prev || {
          projectId,
          portfolioId: portfolioId || 0,
          projectName,
          role,
          status: 'WRITING',
          progress,
          sectionDrafts: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.value])),
          sectionStatuses: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.status])),
          sourceSnapshot: {},
          selectedProvider: payload.provider.toUpperCase(),
          selectedSourceIds: payload.sourceIds,
          selectedProjectIds: [],
          selectedDocumentIds: [],
          documentText: null,
          reviewedDocument: null,
          presentationJson: null,
          lastError: null,
          lastSavedAt: new Date().toISOString(),
        }),
        sourceSnapshot: (() => {
          const previousSources = asSourceList((prev?.sourceSnapshot || {}) as Record<string, unknown>);
          const nextSources = payload.sources.map(item => ({
            provider: payload.provider.toUpperCase(),
            resourceId: item.resourceId,
            kind: item.kind,
            title: item.title,
            subtitle: item.subtitle,
            summary: item.summary,
            url: item.url || null,
            imageUrl: item.imageUrl || null,
            tags: item.tags || [],
            raw: item.raw || {},
          }));
          return {
            provider: payload.provider.toUpperCase(),
            sources: mergeSources(previousSources, nextSources),
          };
        })(),
        selectedProvider: payload.provider.toUpperCase(),
        selectedSourceIds: Array.from(new Set([...(prev?.selectedSourceIds || []), ...payload.sourceIds])),
        lastSavedAt: new Date().toISOString(),
      }));
      setSourceModalOpen(false);
      return;
    }

    try {
      const next = await selectProjectWritingSources(projectId, {
        portfolioId,
        provider: payload.provider,
        sourceIds: payload.sourceIds,
        sourceSelections: payload.sourceSelections?.map(item => ({
          provider: item.provider,
          sourceIds: item.sourceIds,
        })),
      });
      setSession(next);
      setSectionDrafts(prev => buildSectionDraftMap(role, sectionMeta, next.sourceSnapshot || {}, prev));
      setSourceModalOpen(false);
      setError(next.lastError || null);
      persistLocalProjectListing(
        next.documentText || buildDocumentFromDrafts(sectionDrafts),
        next.reviewedDocument || '',
        next.reviewedDocument ? 'REVIEWED' : 'DOCUMENT_CREATED',
        sectionDrafts,
      );
    } catch {
      setSourceError(ko ? '자료를 연결하지 못했습니다.' : 'Failed to apply selected sources.');
    }
  };

  const fillCompletedStatus = (drafts: Record<string, { value: string; status: SectionStatus }>) => {
    return Object.fromEntries(
      Object.entries(drafts).map(([key, item]) => [
        key,
        { ...item, status: item.value.trim() ? 'COMPLETED' : 'EMPTY' as SectionStatus },
      ]),
    ) as Record<string, { value: string; status: SectionStatus }>;
  };

  const buildDocumentFromDrafts = (drafts: Record<string, { value: string; status: SectionStatus }>) => {
    return [
      `# ${projectName}`,
      `Role: ${role}`,
      '',
      ...sectionMeta.map(section => {
        const value = drafts[section.key]?.value?.trim() || '';
        return value ? `## ${section.title}\n${value}` : '';
      }).filter(Boolean),
    ].join('\n\n').trim();
  };

  const createDocument = async () => {
    if (draftMode) {
      const sourceDrafts = buildSectionDraftMap(role, sectionMeta, session?.sourceSnapshot || sourceSnapshot, sectionDrafts);
      const nextDrafts = fillCompletedStatus(sourceDrafts);
      const content = [
        `PROJECT: ${projectName}`,
        `ROLE: ${role}`,
        '',
        ...sectionMeta.map(section => {
          const value = nextDrafts[section.key]?.value?.trim() || '';
          return value ? `# ${section.title}\n${value}` : `# ${section.title}\n(EMPTY)`;
        }),
      ].join('\n');
      setDocumentBusy(true);
      setError(null);
      setSectionDrafts(nextDrafts);
      setStep('DOCUMENT_CREATED');
      setDocumentText(content);
      setDocumentModalOpen(true);
      setSession(prev => ({
        ...(prev || {
          projectId,
          portfolioId: portfolioId || 0,
          projectName,
          role,
          status: 'WRITING',
          progress,
          sectionDrafts: Object.fromEntries(Object.entries(nextDrafts).map(([key, item]) => [key, item.value])),
          sectionStatuses: Object.fromEntries(Object.entries(nextDrafts).map(([key, item]) => [key, item.status])),
          sourceSnapshot,
          selectedProvider: null,
          selectedSourceIds: [],
          selectedProjectIds: [],
          selectedDocumentIds: [],
          documentText: null,
          reviewedDocument: null,
          presentationJson: null,
          lastError: null,
          lastSavedAt: new Date().toISOString(),
        }),
        documentText: content,
        reviewedDocument: null,
        status: 'DOCUMENT_CREATED',
        lastError: null,
        lastSavedAt: new Date().toISOString(),
      } as ProjectWritingSession));
      persistLocalProjectListing(content, '', 'DOCUMENT_CREATED', nextDrafts);
      setDocumentBusy(false);
      return;
    }

    if (!projectId) return;
    setDocumentBusy(true);
    setError(null);
    try {
      const next = await createProjectWritingDocument(projectId);
      setSession(next);
      setDocumentText(next.documentText || buildDocumentFromDrafts(sectionDrafts));
      setDocumentModalOpen(true);
      const sourceDrafts = buildSectionDraftMap(role, sectionMeta, next.sourceSnapshot || session?.sourceSnapshot || sourceSnapshot, sectionDrafts);
      const nextDrafts = fillCompletedStatus(sourceDrafts);
      setSectionDrafts(nextDrafts);
      setStep('DOCUMENT_CREATED');
      setError(next.lastError || null);
      persistLocalProjectListing(next.documentText || buildDocumentFromDrafts(nextDrafts), '', 'DOCUMENT_CREATED', nextDrafts);
    } catch {
      setError(ko ? '문서 생성에 실패했습니다.' : 'Failed to create the document.');
    } finally {
      setDocumentBusy(false);
    }
  };

  const reviewDocument = async () => {
    const localDocument = documentText.trim() || buildDocumentFromDrafts(sectionDrafts);
    if (!localDocument) {
      setError(ko ? '먼저 한 섹션 이상 작성해주세요.' : 'Write at least one section first.');
      return;
    }

    if (draftMode) {
      setReviewBusy(true);
      setDocumentText(localDocument);
      const reviewed = normalizeForReview(localDocument);
      setReviewedText(reviewed);
      setStep('REVIEWED');
      setDocumentModalOpen(true);
      setSession(prev => ({
        ...(prev || {
          projectId,
          portfolioId: portfolioId || 0,
          projectName,
          role,
          status: 'DOCUMENT_CREATED',
          progress,
          sectionDrafts: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.value])),
          sectionStatuses: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.status])),
          sourceSnapshot,
          selectedProvider: null,
          selectedSourceIds: [],
          selectedProjectIds: [],
          selectedDocumentIds: [],
          documentText: localDocument,
          reviewedDocument: null,
          presentationJson: null,
          lastError: null,
          lastSavedAt: new Date().toISOString(),
        }),
        reviewedDocument: reviewed,
        status: 'REVIEWED',
        lastSavedAt: new Date().toISOString(),
      } as ProjectWritingSession));
      persistLocalProjectListing(localDocument, reviewed, 'REVIEWED');
      setReviewBusy(false);
      return;
    }

    if (!projectId) return;
    setReviewBusy(true);
    setError(null);
    try {
      if (!documentText.trim()) {
        await createDocument();
      }
      const next = await reviewProjectWritingDocument(projectId);
      setSession(next);
      setDocumentText(next.documentText || localDocument);
      setReviewedText(next.reviewedDocument || next.documentText || localDocument);
      setDocumentModalOpen(true);
      setStep('REVIEWED');
      setError(next.lastError || null);
      persistLocalProjectListing(next.documentText || localDocument, next.reviewedDocument || next.documentText || localDocument, 'REVIEWED', sectionDrafts);
    } catch {
      setError(ko ? 'AI 검수에 실패했습니다.' : 'Failed to review the document.');
    } finally {
      setReviewBusy(false);
    }
  };

  const generatePptx = async () => {
    if (draftMode) {
      setGenerateBusy(true);
      setPreviewBlob(new Blob([reviewedText || documentText], { type: 'text/plain' }));
      setStep('PPT_CREATED');
      setSession(prev => ({
        ...(prev || {
          projectId,
          portfolioId: portfolioId || 0,
          projectName,
          role,
          status: 'REVIEWED',
          progress,
          sectionDrafts: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.value])),
          sectionStatuses: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.status])),
          sourceSnapshot,
          selectedProvider: null,
          selectedSourceIds: [],
          selectedProjectIds: [],
          selectedDocumentIds: [],
          documentText,
          reviewedDocument: reviewedText,
          presentationJson: JSON.stringify({ slides: [{ type: 'slide', title: projectName, content: reviewedText || documentText }] }),
          lastError: null,
          lastSavedAt: new Date().toISOString(),
        }),
        status: 'PPT_CREATED',
        lastSavedAt: new Date().toISOString(),
      } as ProjectWritingSession));
      setGenerateBusy(false);
      return;
    }

    if (!projectId) return;
    setGenerateBusy(true);
    setError(null);
    try {
      const next = await createProjectWritingPresentation(projectId);
      setSession(next);
      setStep('PPT_CREATED');
      setError(next.lastError || null);
    } catch {
      setError(ko ? 'PDF 생성에 실패했습니다.' : 'Failed to generate PDF.');
    } finally {
      setGenerateBusy(false);
    }
  };

  const downloadPptx = async () => {
    if (!projectId) return;
    setDownloadBusy(true);
    try {
      const blob = previewBlob || (draftMode ? new Blob([reviewedText || documentText], { type: 'text/plain' }) : await exportProjectWritingPptx(projectId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.pdf`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } finally {
      setDownloadBusy(false);
    }
  };

  const saveDocumentSnapshot = () => {
    const nextDocument = documentText.trim();
    const nextReviewed = reviewedText.trim();

    if (draftMode || !portfolioId) {
      saveLocalDraft({
        projectId: projectId || Number(Date.now()),
        portfolioId: portfolioId || null,
        projectName,
        role,
        writingStatus: nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED',
        sections: sectionDrafts,
        selectedProjectIds: session?.selectedProjectIds || [],
        selectedArticleIds: session?.selectedSourceIds || [],
        imageAssets,
        reviewedDocument: nextReviewed,
        document: nextDocument,
        updatedAt: new Date().toISOString(),
      });
      persistLocalProjectListing(nextDocument, nextReviewed, nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED', sectionDrafts);
      setSession(prev => (prev ? {
        ...prev,
        documentText: nextDocument || prev.documentText,
        reviewedDocument: nextReviewed || prev.reviewedDocument,
        status: nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED',
        lastSavedAt: new Date().toISOString(),
      } : prev));
      setStep(nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED');
      setDocumentModalOpen(false);
      return;
    }

    void (async () => {
      if (!projectId) return;
      setSaving(true);
      try {
        saveLocalDraft({
          projectId,
          portfolioId: portfolioId || null,
          projectName,
          role,
          writingStatus: nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED',
          sections: sectionDrafts,
          selectedProjectIds: session?.selectedProjectIds || [],
          selectedArticleIds: session?.selectedSourceIds || [],
          imageAssets,
          reviewedDocument: nextReviewed,
          document: nextDocument,
          updatedAt: new Date().toISOString(),
        });
        const updated = await saveProjectWritingDraft(projectId, {
          progress,
          sectionDrafts: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.value])),
          sectionStatuses: Object.fromEntries(Object.entries(sectionDrafts).map(([key, item]) => [key, item.status])),
          documentText: nextDocument,
          reviewedDocument: nextReviewed,
        });
        const thumbnail = imageAssets[0]?.url || null;
        if (portfolioId > 0 && thumbnail && thumbnail.length <= 500) {
          await updatePortfolioProject(portfolioId, projectId, {
            name: session?.projectName || projectName,
            role,
            summary: extractProjectSummary(nextDocument, nextReviewed, projectName),
            skills: extractProjectSkills(sectionDrafts).join(','),
            thumbnailUrl: thumbnail,
          }).catch(() => undefined);
        }
        setSession(updated);
        setError(updated.lastError || null);
        persistLocalProjectListing(nextDocument, nextReviewed, nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED', sectionDrafts);
        setStep(nextReviewed ? 'REVIEWED' : 'DOCUMENT_CREATED');
        setDocumentModalOpen(false);
        navigate('/workspace', { replace: true, state: { portfolioId } });
      } catch {
        setError(ko ? '문서 저장에 실패했습니다.' : 'Failed to save the document.');
      } finally {
        setSaving(false);
      }
    })();
  };

  const requestReview = () => {
    setReviewConfirmOpen(true);
  };

  const runConfirmedReview = () => {
    setReviewConfirmOpen(false);
    void reviewDocument();
  };

  const mergedDocument = (reviewedText.trim() || documentText.trim()).trim();
  const documentOnlyMode =
    !documentModalOpen &&
    mergedDocument.length > 0 &&
    (viewMode || step === 'DOCUMENT_CREATED' || step === 'REVIEWED' || step === 'PPT_CREATED');

  const busyOverlay = (documentBusy || reviewBusy) ? (
    <div className="fixed inset-0 z-[390] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <div className="rounded-[28px] border border-white/10 bg-[#101010] px-8 py-7 text-center shadow-2xl">
        <Loader2 size={22} className="mx-auto mb-4 animate-spin text-violet-300" />
        <p className="text-lg font-black text-white">{documentBusy ? '문서를 생성하는 중' : 'AI 검수 중'}</p>
        <p className="mt-2 text-sm text-zinc-500">잠시만 기다려주세요.</p>
      </div>
    </div>
  ) : null;

  const reviewConfirmModal = reviewConfirmOpen ? (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#101010] p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-200">
          <Wand2 size={20} />
        </div>
        <h3 className="mt-5 text-lg font-black text-white">{ko ? 'AI 검수를 진행하시겠습니까?' : 'Run AI review?'}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {ko ? '현재 합쳐진 문서를 백엔드 AI 검수 API로 보내 문장과 흐름을 다듬습니다.' : 'The merged document will be sent to the backend AI review API.'}
        </p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setReviewConfirmOpen(false)}
            className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300"
          >
            {ko ? '취소' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={runConfirmedReview}
            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
          >
            {ko ? '진행' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#050505]">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 size={14} className="animate-spin" />
          {ko ? '프로젝트 초안을 불러오는 중...' : 'Loading project draft...'}
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
          <p className="mt-2 text-sm text-zinc-500">{ko ? '먼저 프로젝트를 만든 뒤 다시 열어주세요.' : 'Create a project first, then reopen this page.'}</p>
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

  if (documentOnlyMode) {
    return (
      <div className="min-h-full overflow-y-auto bg-[#050505] px-6 py-6 lg:px-8">
        {busyOverlay}
        {reviewConfirmModal}
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <ArrowLeft size={14} />
              {ko ? '프로젝트로 돌아가기' : 'Back to projects'}
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock3 size={12} />
              {session?.lastSavedAt ? new Date(session.lastSavedAt).toLocaleString() : '-'}
            </div>
          </div>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Project document</p>
                <h1 className="mt-2 text-3xl font-black text-white">{session?.projectName || projectName}</h1>
                <p className="mt-2 text-sm text-zinc-500">{role}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={requestReview}
                  disabled={reviewBusy}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-200 disabled:opacity-50"
                >
                  {ko ? 'AI 검수' : 'AI Review'}
                </button>
                <button
                  type="button"
                  onClick={saveDocumentSnapshot}
                  disabled={saving}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#2563eb)' }}
                >
                  {saving ? (ko ? '저장 중' : 'Saving') : (ko ? '확인' : 'Confirm')}
                </button>
              </div>
            </div>
            <textarea
              value={reviewedText || documentText}
              onChange={event => (reviewedText ? setReviewedText(event.target.value) : setDocumentText(event.target.value))}
              className="mt-6 min-h-[620px] w-full resize-y rounded-[26px] border border-white/8 bg-black/25 px-6 py-5 text-sm leading-8 text-zinc-100 outline-none focus:border-violet-500/35"
            />
          </section>
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
        onClose={() => {
          setSourceModalOpen(false);
          if (!session?.selectedSourceIds?.length) setSourceModalDismissed(true);
        }}
        onConfirm={payload => {
          setSourceModalDismissed(false);
          void handleSelectSources(payload);
        }}
      />

      <SectionEditorModal
        open={Boolean(editingSection)}
        title={sectionMeta.find(item => item.key === editingSection)?.title || ''}
        guide={sectionMeta.find(item => item.key === editingSection)?.guide || ''}
        initialValue={editingSection ? sectionDrafts[editingSection]?.value || '' : ''}
        onClose={() => setEditingSection(null)}
        onSave={saveSection}
        onOpenSources={() => setSourceModalOpen(true)}
      />

      {busyOverlay}
      {reviewConfirmModal}

      {documentModalOpen && (
        <div className="fixed inset-0 z-[380] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md" onClick={() => setDocumentModalOpen(false)}>
          <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[#090909] p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Project document</p>
                <h3 className="mt-2 text-2xl font-black text-white">합쳐진 문서</h3>
              </div>
              <button onClick={() => setDocumentModalOpen(false)} className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200">×</button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">{ko ? '원본' : 'Before'}</p>
                <textarea
                  value={documentText}
                  onChange={event => setDocumentText(event.target.value)}
                  className="min-h-[520px] w-full resize-y rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-zinc-100 outline-none"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-300">{ko ? 'AI 검수본' : 'Reviewed'}</p>
                <textarea
                  value={reviewedText}
                  onChange={event => setReviewedText(event.target.value)}
                  className="min-h-[520px] w-full resize-y rounded-[24px] border border-violet-500/20 bg-violet-500/[0.06] px-5 py-4 text-sm leading-7 text-zinc-100 outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={requestReview}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                {ko ? 'AI 검수' : 'AI Review'}
              </button>
              <button
                onClick={saveDocumentSnapshot}
                className="rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#22c55e,#2563eb)' }}
              >
                {ko ? '확인' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {resumable && (
          <div className="rounded-2xl border border-violet-500/18 bg-violet-500/8 px-4 py-3 text-sm text-violet-100">
            {ko ? '작성 중인 초안이 있습니다. 이어서 작성할 수 있습니다.' : 'A draft exists. You can continue writing from here.'}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className="space-y-6">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                    <Sparkles size={12} />
                    {ko ? '프로젝트 초안' : 'Project draft'}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white">{session?.projectName || projectName}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    {ko ? '자료를 선택하고 섹션을 하나씩 작성한 뒤, AI 검수 후 PDF로 내보냅니다.' : 'Choose sources, edit sections one by one, review once with AI, then export the PDF.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSourceModalOpen(true)}
                  className="hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {ko ? '자료 불러오기' : 'Select sources'}
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{session?.role || role}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{ko ? `${selectedSourceCount}개 자료` : `${selectedSourceCount} sources`}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{ko ? `${completedCount}/${sectionMeta.length} 완료` : `Completed ${completedCount}/${sectionMeta.length}`}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1">{progress}%</span>
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
                <div className="mt-1">{saving ? (ko ? '저장 중...' : 'Saving...') : ko ? '저장 버튼을 눌러 저장' : 'Save manually'}</div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {sectionMeta.map(item => {
                  const current = sectionDrafts[item.key];
                  const active = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveKey(item.key)}
                      onDoubleClick={() => setEditingSection(item.key)}
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
          </section>
          <aside className="space-y-6">
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">{ko ? '생성 흐름' : 'Generation pipeline'}</h2>
                  <p className="mt-1 text-xs text-zinc-500">{ko ? '초안 작성 → AI 검수 → PDF 생성' : 'Draft writing → AI review → PDF generation'}</p>
                </div>
                <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-200">{step}</span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { key: 'draft', title: ko ? '초안 작성' : 'Write draft', desc: ko ? '각 섹션을 직접 작성합니다.' : 'Write each section manually.' },
                  { key: 'review', title: ko ? 'AI 검수 1회' : 'AI review once', desc: ko ? '문서를 검수해 문장과 흐름을 다듬습니다.' : 'Review the generated document in the modal.' },
                ].map((item, index) => {
                  const active = (index === 0 && step === 'WRITING') || (index === 1 && step === 'DOCUMENT_CREATED');
                  const done = (index === 0 && ['DOCUMENT_CREATED', 'REVIEWED', 'PPT_CREATED'].includes(step)) || (index === 1 && ['REVIEWED', 'PPT_CREATED'].includes(step));
                  return (
                    <div
                      key={item.key}
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
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-sm font-bold text-white">{ko ? '실행' : 'Actions'}</h3>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setSourceModalOpen(true)}
                  className="hidden w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.05]"
                >
                  <span>{ko ? '자료 불러오기' : 'Select sources'}</span>
                  <Sparkles size={14} className="text-violet-300" />
                </button>
                <button
                  type="button"
                  onClick={() => void createDocument()}
                  disabled={documentBusy || !allSectionsCompleted}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {documentBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {ko ? '문서 생성' : 'Create document'}
                </button>
                <button
                  type="button"
                  onClick={saveDocumentSnapshot}
                  disabled={!documentText.trim() && !reviewedText.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.04] disabled:opacity-40"
                >
                  <Bookmark size={14} />
                  {ko ? '저장' : 'Save'}
                </button>
                {false && (
                  <button
                    type="button"
                    onClick={() => void generatePptx()}
                    disabled={generateBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#2563eb)' }}
                  >
                    {generateBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {ko ? 'PDF 생성' : 'Generate PDF'}
                  </button>
                )}
                {false && (
                  <button
                    type="button"
                    onClick={() => void downloadPptx()}
                    disabled={downloadBusy || (step !== 'PPT_CREATED' && !previewBlob)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 px-4 py-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05] disabled:opacity-40"
                  >
                    {downloadBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {ko ? '다운로드' : 'Download'}
                  </button>
                )}
              </div>
            </div>

            <div className="hidden rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
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
                    {ko ? 'PPT 생성 후 미리보기가 표시됩니다.' : 'A preview appears after generation.'}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{ko ? '이미지 추가' : 'Add images'}</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {ko ? '컴퓨터에서 사진을 선택해 업로드할 수 있습니다.' : 'Select images from your computer and upload them here.'}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-violet-300">{imageAssets.length}</span>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={event => {
                  void handleImageFiles(event.target.files);
                }}
              />

              <div className="mt-4 rounded-[26px] border border-dashed border-violet-500/25 bg-violet-500/[0.06] p-5 text-center">
                <p className="text-sm font-semibold text-violet-100">{ko ? '이미지 블록 업로드' : 'Image block upload'}</p>
                <p className="mt-1 text-xs leading-6 text-zinc-400">
                  {ko ? '프로젝트 화면, 캡처, 디자인 시안을 업로드한 뒤 필요할 때 다시 확인할 수 있습니다.' : 'Upload screenshots or design references and review them whenever you need.'}
                </p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                >
                  {ko ? '컴퓨터에서 사진 선택' : 'Choose files'}
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {imageAssets.length > 0 ? (
                  imageAssets.map(item => (
                    <div key={item.id} className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                      <div className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
                        <p className="truncate text-xs text-zinc-400">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => setImageAssets(prev => prev.filter(current => current.id !== item.id))}
                          className="text-xs text-zinc-500 transition-colors hover:text-white"
                        >
                          {ko ? '삭제' : 'Remove'}
                        </button>
                      </div>
                      <div className="aspect-[16/9] bg-[#0b0b0b]">
                        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-4 py-8 text-center text-sm text-zinc-500">
                    {ko ? '추가된 이미지가 없습니다.' : 'No images added yet.'}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
