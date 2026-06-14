const OFFICE_VIEWER_BASE = 'https://view.officeapps.live.com/op/embed.aspx?src=';
const OFFICE_VIEWER_TAB_BASE = 'https://view.officeapps.live.com/op/view.aspx?src=';

function isViewableUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:');
}

export function buildPptxViewerUrl(pptxUrl?: string | null) {
  if (!pptxUrl) return '';
  const trimmed = pptxUrl.trim();
  if (!trimmed) return '';
  if (/view\.officeapps\.live\.com|docs\.google\.com/i.test(trimmed)) return trimmed;
  if (!isViewableUrl(trimmed)) return trimmed;
  return `${OFFICE_VIEWER_BASE}${encodeURIComponent(trimmed)}`;
}

export function buildPptxTabUrl(pptxUrl?: string | null) {
  if (!pptxUrl) return '';
  const trimmed = pptxUrl.trim();
  if (!trimmed) return '';
  if (/view\.officeapps\.live\.com|docs\.google\.com/i.test(trimmed)) return trimmed;
  if (!isViewableUrl(trimmed)) return trimmed;
  return `${OFFICE_VIEWER_TAB_BASE}${encodeURIComponent(trimmed)}`;
}
