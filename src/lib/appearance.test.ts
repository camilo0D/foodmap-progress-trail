import { describe, expect, it } from 'vitest';
import { resolveDark, resolveTone } from './appearance';
describe('Adaptive appearance', () => {
  it('adapts automatic tone to each business', () => {
    expect(resolveTone('auto', 'store')).toBe('store');
    expect(resolveTone('auto', 'projects')).toBe('projects');
    expect(resolveTone('auto', 'services')).toBe('services');
    expect(resolveTone('auto', 'finance')).toBe('finance');
  });
  it('preserves a manually selected tone', () => { expect(resolveTone('services', 'store')).toBe('services'); });
  it('supports explicit dark and light modes and follows system only in automatic mode', () => {
    expect(resolveDark('dark', false)).toBe(true);
    expect(resolveDark('light', true)).toBe(false);
    expect(resolveDark('system', true)).toBe(true);
    expect(resolveDark('system', false)).toBe(false);
  });
});