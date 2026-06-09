"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  User,
  Briefcase,
  Code,
  Wrench,
  Trophy,
  GitBranch,
  File,
  Link as LinkIcon,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PortfolioWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: PortfolioData) => void
}

interface PortfolioData {
  title: string
  role: string
  jobType: string
  overview: string
  responsibilities: string
  techStack: string[]
  troubleshooting: string
  results: string
  process: string
  mainImage: File | null
  subImages: File[]
  files: File[]
  startDate: string
  endDate: string
  links: { type: string; url: string }[]
}

const steps = [
  { id: 1, title: "기본 정보", icon: User, description: "포트폴리오 제목과 역할" },
  { id: 2, title: "프로젝트 개요", icon: Briefcase, description: "프로젝트 소개" },
  { id: 3, title: "담당 역할", icon: User, description: "맡은 역할과 책임" },
  { id: 4, title: "기술 스택", icon: Code, description: "사용한 기술과 도구" },
  { id: 5, title: "트러블슈팅", icon: Wrench, description: "문제 해결 경험" },
  { id: 6, title: "성과 및 결과", icon: Trophy, description: "달성한 성과" },
  { id: 7, title: "진행 과정", icon: GitBranch, description: "작업 프로세스 (선택)" },
  { id: 8, title: "이미지 업로드", icon: ImageIcon, description: "대표 및 서브 이미지" },
  { id: 9, title: "링크 & 파일", icon: File, description: "관련 링크 및 문서" },
]

const jobTypes = [
  "개발자", "디자이너", "PM", "마케터", "데이터 분석가", "기획자",
  "콘텐츠 크리에이터", "영상 제작자", "게임 개발자", "연구원", "영업/비즈니스", "HR/인사"
]

const jobSpecificLinks: Record<string, { label: string; placeholder: string }[]> = {
  "개발자": [
    { label: "GitHub", placeholder: "https://github.com/username/repo" },
    { label: "노션", placeholder: "https://notion.so/..." },
    { label: "기술 블로그", placeholder: "https://blog.example.com" },
  ],
  "디자이너": [
    { label: "Figma", placeholder: "https://figma.com/file/..." },
    { label: "Behance", placeholder: "https://behance.net/..." },
    { label: "Dribbble", placeholder: "https://dribbble.com/..." },
  ],
  "PM": [
    { label: "노션", placeholder: "https://notion.so/..." },
    { label: "Jira", placeholder: "https://jira.atlassian.com/..." },
    { label: "Confluence", placeholder: "https://confluence.atlassian.com/..." },
  ],
  "마케터": [
    { label: "노션", placeholder: "https://notion.so/..." },
    { label: "캠페인 링크", placeholder: "https://example.com/campaign" },
    { label: "포트폴리오 사이트", placeholder: "https://portfolio.example.com" },
  ],
  "데이터 분석가": [
    { label: "GitHub", placeholder: "https://github.com/username/repo" },
    { label: "Kaggle", placeholder: "https://kaggle.com/username" },
    { label: "노션", placeholder: "https://notion.so/..." },
  ],
  "기획자": [
    { label: "노션", placeholder: "https://notion.so/..." },
    { label: "기획서 링크", placeholder: "https://docs.google.com/..." },
  ],
  "콘텐츠 크리에이터": [
    { label: "YouTube", placeholder: "https://youtube.com/@channel" },
    { label: "Instagram", placeholder: "https://instagram.com/username" },
    { label: "TikTok", placeholder: "https://tiktok.com/@username" },
  ],
  "영상 제작자": [
    { label: "YouTube", placeholder: "https://youtube.com/@channel" },
    { label: "Vimeo", placeholder: "https://vimeo.com/username" },
    { label: "포트폴리오 사이트", placeholder: "https://portfolio.example.com" },
  ],
  "게임 개발자": [
    { label: "GitHub", placeholder: "https://github.com/username/repo" },
    { label: "itch.io", placeholder: "https://username.itch.io/game" },
    { label: "Steam", placeholder: "https://store.steampowered.com/app/..." },
  ],
  "연구원": [
    { label: "Google Scholar", placeholder: "https://scholar.google.com/..." },
    { label: "ResearchGate", placeholder: "https://researchgate.net/..." },
    { label: "논문 링크", placeholder: "https://arxiv.org/..." },
  ],
  "영업/비즈니스": [
    { label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
    { label: "노션", placeholder: "https://notion.so/..." },
  ],
  "HR/인사": [
    { label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
    { label: "노션", placeholder: "https://notion.so/..." },
  ],
}

const techOptions = [
  "React", "Vue", "Angular", "Next.js", "Nuxt.js", "TypeScript", "JavaScript",
  "Python", "Java", "Go", "Node.js", "Express", "Django", "Spring",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "AWS", "GCP", "Azure",
  "Docker", "Kubernetes", "Git", "Figma", "Sketch", "Adobe XD",
  "Tailwind CSS", "Sass", "GraphQL", "REST API"
]

export function PortfolioWizard({ isOpen, onClose, onComplete }: PortfolioWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<PortfolioData>({
    title: "",
    role: "",
    jobType: "개발자",
    overview: "",
    responsibilities: "",
    techStack: [],
    troubleshooting: "",
    results: "",
    process: "",
    mainImage: null,
    subImages: [],
    files: [],
    startDate: "",
    endDate: "",
    links: [],
  })
  
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const subImageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    onComplete(formData)
    setFormData({
      title: "", role: "", jobType: "개발자", overview: "", responsibilities: "",
      techStack: [], troubleshooting: "", results: "", process: "",
      mainImage: null, subImages: [], files: [], startDate: "", endDate: "", links: [],
    })
    setCurrentStep(1)
  }

  const toggleTech = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech]
    }))
  }

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, mainImage: file }))
    }
  }

  const handleSubImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setFormData(prev => ({
        ...prev,
        subImages: [...prev.subImages, ...Array.from(files)]
      }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...Array.from(files)]
      }))
    }
  }

  const removeSubImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subImages: prev.subImages.filter((_, i) => i !== index)
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const updateLink = (index: number, url: string) => {
    setFormData(prev => {
      const newLinks = [...prev.links]
      newLinks[index] = { ...newLinks[index], url }
      return { ...prev, links: newLinks }
    })
  }

  const currentLinkOptions = jobSpecificLinks[formData.jobType] || jobSpecificLinks["개발자"]

  // Initialize links when job type changes
  const initializeLinks = (jobType: string) => {
    const linkOptions = jobSpecificLinks[jobType] || jobSpecificLinks["개발자"]
    setFormData(prev => ({
      ...prev,
      jobType,
      links: linkOptions.map(opt => ({ type: opt.label, url: "" }))
    }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">포트폴리오 제목</label>
              <Input
                placeholder="예: 이커머스 플랫폼 리뉴얼 프로젝트"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">직무 선택</label>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((job) => (
                  <button
                    key={job}
                    onClick={() => initializeLinks(job)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      formData.jobType === job
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">역할</label>
              <Input
                placeholder="예: Frontend Developer, Product Designer"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">프로젝트 기간</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <span className="text-muted-foreground">~</span>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">프로젝트 개요</label>
            <Textarea
              placeholder="프로젝트에 대해 간략히 설명해주세요. 프로젝트의 목적, 배경 등을 포함할 수 있습니다."
              value={formData.overview}
              onChange={(e) => setFormData(prev => ({ ...prev, overview: e.target.value }))}
              rows={8}
            />
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">담당 역할</label>
            <Textarea
              placeholder="프로젝트에서 맡은 역할과 책임에 대해 설명해주세요."
              value={formData.responsibilities}
              onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
              rows={8}
            />
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">사용한 기술 스택을 선택하세요</label>
            <div className="flex flex-wrap gap-2">
              {techOptions.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    formData.techStack.includes(tech)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {tech}
                </button>
              ))}
            </div>
            {formData.techStack.length > 0 && (
              <p className="text-sm text-muted-foreground">
                선택됨: {formData.techStack.join(", ")}
              </p>
            )}
          </div>
        )
      case 5:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">트러블슈팅 / 문제 해결 경험</label>
            <Textarea
              placeholder="프로젝트 진행 중 겪은 문제와 어떻게 해결했는지 설명해주세요."
              value={formData.troubleshooting}
              onChange={(e) => setFormData(prev => ({ ...prev, troubleshooting: e.target.value }))}
              rows={8}
            />
          </div>
        )
      case 6:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">성과 및 결과</label>
            <Textarea
              placeholder="프로젝트를 통해 달성한 성과와 결과를 구체적인 수치와 함께 설명해주세요."
              value={formData.results}
              onChange={(e) => setFormData(prev => ({ ...prev, results: e.target.value }))}
              rows={8}
            />
          </div>
        )
      case 7:
        return (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-medium">진행 과정 (선택)</label>
            <Textarea
              placeholder="프로젝트 진행 과정, 방법론, 협업 방식 등을 설명해주세요. (선택 사항)"
              value={formData.process}
              onChange={(e) => setFormData(prev => ({ ...prev, process: e.target.value }))}
              rows={8}
            />
          </div>
        )
      case 8:
        return (
          <div className="space-y-6">
            {/* Main Image Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                대표 이미지 <span className="text-muted-foreground">(프로젝트 배너, 로고 등)</span>
              </label>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="hidden"
              />
              {formData.mainImage ? (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <img
                    src={URL.createObjectURL(formData.mainImage)}
                    alt="대표 이미지"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, mainImage: null }))}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => mainImageInputRef.current?.click()}
                  className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">대표 이미지 업로드</span>
                </button>
              )}
            </div>

            {/* Sub Images Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                서브 이미지 <span className="text-muted-foreground">(활동 기록, 스크린샷 등)</span>
              </label>
              <input
                ref={subImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSubImageUpload}
                className="hidden"
              />
              <button
                onClick={() => subImageInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">서브 이미지 추가 (여러 장 선택 가능)</span>
              </button>
              {formData.subImages.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {formData.subImages.map((file, index) => (
                    <div key={index} className="group relative aspect-video overflow-hidden rounded-lg bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => removeSubImage(index)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      case 9:
        return (
          <div className="space-y-6">
            {/* Job-specific Links */}
            <div>
              <label className="mb-3 block text-sm font-medium">
                <span className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  {formData.jobType} 관련 링크
                </span>
              </label>
              <div className="space-y-3">
                {currentLinkOptions.map((linkOpt, index) => (
                  <div key={linkOpt.label}>
                    <label className="mb-1 block text-xs text-muted-foreground">{linkOpt.label}</label>
                    <Input
                      placeholder={linkOpt.placeholder}
                      value={formData.links[index]?.url || ""}
                      onChange={(e) => updateLink(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="mb-2 block text-sm font-medium">문서 업로드 (PDF, 문서 등)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">파일 업로드</span>
              </button>
              {formData.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(index)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const currentStepData = steps[currentStep - 1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">포트폴리오 만들기</h2>
            <button 
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {currentStep} / {steps.length} 단계
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <currentStepData.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          
          {currentStep === steps.length ? (
            <Button onClick={handleComplete} className="gap-2">
              <Check className="h-4 w-4" />
              완료
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
