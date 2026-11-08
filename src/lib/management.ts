import type { Tables } from '@/integrations/supabase/types';

export type ManagementType = 'store' | 'projects' | 'services' | 'finance';
export type Entry = Tables<'management_entries'>;
export type Profile = Tables<'profiles'>;
export const TYPES = [
  { id: 'store', label: 'Tienda', detail: 'Productos, ventas y pedidos', icon: 'store' },
  { id: 'projects', label: 'Proyectos', detail: 'Tareas, avances y gastos', icon: 'projects' },
  { id: 'services', label: 'Servicios', detail: 'Clientes, citas y trabajos', icon: 'services' },
  { id: 'finance', label: 'Finanzas personales', detail: 'Ingresos, gastos y presupuestos', icon: 'finance' },
] as const;
export const MODULES: Record<ManagementType, { kind: string; label: string; singular: string; money?: string; quantity?: string; dated?: boolean; status?: boolean }[]> = {
  store: [
    { kind: 'product', label: 'Inventario', singular: 'Producto', money: 'Precio unitario', quantity: 'Existencias' },
    { kind: 'sale', label: 'Ventas', singular: 'Venta', money: 'Ingreso total', dated: true },
    { kind: 'customer', label: 'Clientes', singular: 'Cliente' },
    { kind: 'order', label: 'Pedidos', singular: 'Pedido', money: 'Valor del pedido', dated: true, status: true },
    { kind: 'expense', label: 'Gastos', singular: 'Gasto', money: 'Importe', dated: true },
  ],
  projects: [
    { kind: 'task', label: 'Tareas', singular: 'Tarea', dated: true, status: true },
    { kind: 'expense', label: 'Gastos', singular: 'Gasto', money: 'Importe', dated: true },
  ],
  services: [
    { kind: 'customer', label: 'Clientes', singular: 'Cliente' },
    { kind: 'appointment', label: 'Citas', singular: 'Cita', dated: true, status: true },
    { kind: 'job', label: 'Trabajos', singular: 'Trabajo', money: 'Valor acordado', dated: true, status: true },
    { kind: 'income', label: 'Ingresos', singular: 'Ingreso', money: 'Importe recibido', dated: true },
    { kind: 'expense', label: 'Gastos', singular: 'Gasto', money: 'Importe', dated: true },
  ],
  finance: [
    { kind: 'income', label: 'Ingresos', singular: 'Ingreso', money: 'Importe', dated: true },
    { kind: 'expense', label: 'Gastos', singular: 'Gasto', money: 'Importe', dated: true },
    { kind: 'budget', label: 'Presupuestos', singular: 'Presupuesto', money: 'Límite mensual', dated: true },
  ],
};
export function isManagementType(value: unknown): value is ManagementType {
  return TYPES.some(t => t.id === value);
}
export function acceptsKind(type: ManagementType, kind: string) {
  return MODULES[type].some(m => m.kind === kind);
}
export function summarize(entries: Entry[]) {
  const sum = (kind: string) => entries.filter(e => e.kind === kind).reduce((a, e) => a + Number(e.amount), 0);
  const income = sum('income') + sum('sale');
  const expense = sum('expense');
  return { income, expense, balance: income - expense, stock: entries.filter(e => e.kind === 'product').reduce((a, e) => a + e.quantity, 0), completed: entries.filter(e => e.kind === 'task' && e.status === 'done').length, tasks: entries.filter(e => e.kind === 'task').length };
}
export function monthTotals(entries: Entry[], now = new Date()) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rows = entries.filter(e => e.entry_date.startsWith(period));
    const s = summarize(rows);
    return { name: d.toLocaleDateString('es', { month: 'short' }), Ingresos: s.income, Gastos: s.expense };
  });
}