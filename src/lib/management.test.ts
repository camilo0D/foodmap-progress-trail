import { describe, expect, it } from 'vitest';
import { MODULES, acceptsKind, summarize, monthTotals, type Entry } from './management';
const row = (kind: string, amount = 0, other: Partial<Entry> = {}): Entry => ({ id: 'a', user_id: 'u', management_type: 'store', kind, title: 'Record', amount, quantity: 0, status: 'done', entry_date: '2026-11-08', detail: '', created_at: '2026-11-08T00:00:00Z', ...other });
describe('Purpose-specific management', () => {
 it('offers inventory, sales, customers, orders and expenses for stores', () => {
  expect(MODULES.store.map(m => m.kind)).toEqual(['product','sale','customer','order','expense']);
  expect(acceptsKind('store', 'appointment')).toBe(false);
 });
 it('offers tasks and expenses for projects', () => {
  expect(MODULES.projects.map(m => m.kind)).toEqual(['task','expense']);
  expect(acceptsKind('projects','product')).toBe(false);
 });
 it('offers customers, appointments, jobs and money records for services', () => {
  expect(MODULES.services.map(m => m.kind)).toEqual(['customer','appointment','job','income','expense']);
  expect(acceptsKind('services','budget')).toBe(false);
 });
 it('offers income, expenses and budgets for personal finances', () => {
  expect(MODULES.finance.map(m => m.kind)).toEqual(['income','expense','budget']);
  expect(acceptsKind('finance','order')).toBe(false);
 });
 it('counts sales and received income, not pending orders or budgets as revenue', () => {
  expect(summarize([row('sale',100),row('income',50),row('expense',30),row('order',400),row('budget',500)])).toMatchObject({ income:150, expense:30, balance:120 });
 });
 it('counts inventory units and completed tasks separately', () => {
  expect(summarize([row('product',50,{ quantity:8 }),row('task',0),row('task',0,{status:'pending'})])).toMatchObject({stock:8,tasks:2,completed:1});
 });
 it('groups received money and expenses by their own month', () => {
  const months = monthTotals([row('income',100), row('expense',25),row('sale',40,{entry_date:'2026-10-01'})],new Date(2026,10,8));
  expect(months.at(-1)).toMatchObject({Ingresos:100,Gastos:25});
  expect(months.at(-2)).toMatchObject({Ingresos:40,Gastos:0});
 });
});