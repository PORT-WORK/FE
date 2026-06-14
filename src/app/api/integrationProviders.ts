export type IntegrationProviderKey = 'github' | 'notion' | 'figma';

export const INTEGRATION_PROVIDER_KEYS = ['github', 'notion', 'figma'] as const satisfies readonly IntegrationProviderKey[];

export function isIntegrationProviderKey(value: string | null | undefined): value is IntegrationProviderKey {
  return value === 'github' || value === 'notion' || value === 'figma';
}

export function normalizeIntegrationProviderKey(value: string | null | undefined): IntegrationProviderKey | null {
  return isIntegrationProviderKey(value) ? value : null;
}

export function integrationProviderLabel(provider: IntegrationProviderKey) {
  switch (provider) {
    case 'github':
      return 'GitHub';
    case 'notion':
      return 'Notion';
    case 'figma':
      return 'Figma';
    default:
      return provider;
  }
}
