type PortfolioData = {
  title: string;
  role: string;
  jobType: string;
  overview: string;
  responsibilities: string;
  techStack: string[];
  troubleshootingItems: Array<{ id: string; title: string; content: string; photoFile: File | null; photoPreview: string | null }>;
  resultsItems: Array<{ id: string; title: string; content: string; photoFile: File | null; photoPreview: string | null }>;
  processItems: Array<{ id: string; title: string; content: string; photoFile: File | null; photoPreview: string | null }>;
  mainImage: File | null;
  subImages: File[];
  files: File[];
  startDate: string;
  endDate: string;
  links: { type: string; url: string }[];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data?: PortfolioData) => void;
}

export default function PortfolioWizard({ isOpen }: Props) {
  if (!isOpen) return null;
  return null;
}
