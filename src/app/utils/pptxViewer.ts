function isViewableUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:');
}

function isPdfUrl(value: string) {
  const lower = value.toLowerCase();
  return lower.startsWith('blob:') || lower.startsWith('data:application/pdf') || lower.includes('.pdf') || lower.includes('/pdf') || lower.includes('resource_type=raw');
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
  if (!isViewableUrl(trimmed) || !isPdfUrl(trimmed)) return '';
  return trimmed;
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
  return isViewableUrl(trimmed) ? trimmed : '';
}

export function buildPdfPageUrl(url: string, page: number) {
  if (!url) return '';
  const separator = url.includes('#') ? '&' : '#';
  return `${url}${separator}toolbar=0&navpanes=0&scrollbar=0&page=${Math.max(1, page)}`;
}
