import { z } from 'zod';
import { MODULES, summarize, type Entry, type ManagementType } from './management';

export const adviceInput = z.object({ management_type: z.enum(['store', 'projects', 'services', 'finance']), goals: z.string().trim().min(1).max(3000), context: z.string().trim().max(5000) });
export function adviceMetrics(type: ManagementType, entries: Entry[]) {
  const own = entries.filter(e => e.management_type === type);
  return { ...summarize(own), modules: MODULES[type].map(m => ({ kind: m.kind, count: own.filter(e => e.kind === m.kind).length, pending: own.filter(e => e.kind === m.kind && e.status !== 'done').length })), monthlyBudget: own.filter(e => e.kind === 'budget').reduce((sum, e) => sum + e.amount, 0) };
}
export function becameCompleted(previous: string | undefined, next: string) { return next === 'done' && previous !== 'done'; }