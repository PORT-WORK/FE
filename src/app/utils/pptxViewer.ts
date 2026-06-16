const GOOGLE_VIEWER_BASE = 'https://docs.google.com/gview?embedded=1&url=';

function isViewableUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:');
}

type PreviewInput = {
  pdfUrl?: string | null;
  pptxUrl?: string | null;
};

export function buildPptxViewerUrl(input?: string | PreviewInput | null) {
  if (!input) return '';
  if (typeof input === 'object') {
    const pdfUrl = input.pdfUrl?.trim() || '';
    if (pdfUrl) return pdfUrl;
    return buildPptxViewerUrl(input.pptxUrl || null);
  }
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/\.pdf(?:$|\?)/i.test(trimmed)) return trimmed;
  if (/view\.officeapps\.live\.com|docs\.google\.com/i.test(trimmed)) return trimmed;
  if (!isViewableUrl(trimmed)) return trimmed;
  return `${GOOGLE_VIEWER_BASE}${encodeURIComponent(trimmed)}`;
}

export function buildPptxTabUrl(input?: string | PreviewInput | null) {
  if (!input) return '';
  if (typeof input === 'object') {
    const pdfUrl = input.pdfUrl?.trim() || '';
    if (pdfUrl) return pdfUrl;
    return buildPptxTabUrl(input.pptxUrl || null);
  }
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed;
}
