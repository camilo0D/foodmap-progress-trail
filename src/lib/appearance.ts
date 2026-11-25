import type { ManagementType } from './management';
export type AppearanceMode = 'light' | 'dark' | 'system';
export type Tone = 'auto' | ManagementType;
export function resolveTone(tone: Tone, business: ManagementType): ManagementType {
  return tone === 'auto' ? business : tone;
}
export function resolveDark(mode: AppearanceMode, systemDark: boolean) {
  return mode === 'dark' || (mode === 'system' && systemDark);
}