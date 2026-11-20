import { describe, expect, it } from 'vitest';
import { adviceInput, adviceMetrics, becameCompleted } from './advice';
import type { Entry } from './management';
describe('Private recommendations and completion measurement', () => {
  it('uses only the chosen space metrics and no personal fields', () => {
    const rows = [{ management_type: 'store', kind: 'sale', amount: 100, title: 'Private customer', detail: 'Private notes', status: 'done' }, { management_type: 'finance', kind: 'income', amount: 999 }] as Entry[];
    expect(adviceMetrics('store', rows).income).toBe(100);
    expect(JSON.stringify(adviceMetrics('store', rows))).not.toContain('Private');
  });
  it('counts completed records once per transition, not when editing a done record', () => {
    expect(becameCompleted(undefined, 'done')).toBe(true);
    expect(becameCompleted('pending', 'done')).toBe(true);
    expect(becameCompleted('done', 'done')).toBe(false);
    expect(becameCompleted('done', 'pending')).toBe(false);
  });
  it('requires goals and a supported space', () => {
    expect(adviceInput.safeParse({ management_type: 'store', goals: '', context: '' }).success).toBe(false);
    expect(adviceInput.safeParse({ management_type: 'other', goals: 'Grow', context: '' }).success).toBe(false);
    expect(adviceInput.safeParse({ management_type: 'services', goals: 'Grow', context: '' }).success).toBe(true);
  });
});