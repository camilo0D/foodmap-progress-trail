import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Layers3, LogOut, Settings2, Plus, Pencil, Trash2, Search, Store, FolderKanban, CalendarDays, Wallet, AlertCircle, Package, ArrowUpRight, ArrowDownRight, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { deleteEntry } from '@/lib/management.functions';
import { TYPES, MODULES, summarize, monthTotals, isManagementType, type Entry, type Profile } from '@/lib/management';
import { ProfileForm } from './profile-form';
import { EntryDialog } from './entry-dialog';
const ICONS = { store: Store, projects: FolderKanban, services: CalendarDays, finance: Wallet };
const STATUS = { pending: 'Pendiente', in_progress: 'En progreso', done: 'Hecho' };
export function WorkspaceDashboard({ profile, entries }: { profile: Profile; entries: Entry[] }) {
 const navigate = useNavigate();
 const qc = useQueryClient();
 const [settings, setSettings] = useState(false);
 const [kind, setKind] = useState('');
 const [search, setSearch] = useState('');
 const [editor, setEditor] = useState<{ entry: Entry | null; kind: string } | null>(null);
 const [deleting, setDeleting] = useState<Entry | null>(null);
 const [loggingOut, setLoggingOut] = useState(false);
 const remove = useMutation({ mutationFn: (id: string) => deleteEntry({ data: { id } }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['workspace'] }); setDeleting(null); toast.success('Registro eliminado'); }, onError: e => toast.error(e.message) });
 async function logout() {
  setLoggingOut(true);
  try { await qc.cancelQueries(); qc.clear(); const { error } = await supabase.auth.signOut(); if (error) throw error; await navigate({ to: '/auth', replace: true }); }
  catch { toast.error('No se pudo cerrar la sesión.'); setLoggingOut(false); }
 }
 if (!isManagementType(profile.management_type) || !profile.display_name.trim() || !profile.workspace_name.trim()) return <main className="min-h-screen bg-background px-6 py-8"><div className="max-w-xl mx-auto"><header className="flex items-center justify-between mb-12"><span className="font-display font-bold text-xl flex gap-2 items-center"><Layers3 className="text-primary"/>Mi espacio</span><Button variant="ghost" onClick={logout} disabled={loggingOut}><LogOut className="size-4"/>Salir</Button></header><h1 className="font-bold text-3xl mb-6">¿Qué vas a administrar?</h1><ProfileForm profile={profile}/></div></main>;
 const type = profile.management_type;
 const modules = MODULES[type];
 const active = modules.find(m => m.kind === kind) ?? modules[0];
 if (!active) return null;
 const Icon = ICONS[type];
 const total = summarize(entries);
 const money = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: profile.currency, maximumFractionDigits: 0 }).format(v);
 const filtered = entries.filter(e => e.kind === active.kind && `${e.title} ${e.detail}`.toLowerCase().includes(search.toLowerCase()));
 const pending = entries.filter(e => ['task','appointment','job','order'].includes(e.kind) && e.status !== 'done');
 const lowStock = entries.filter(e => e.kind === 'product' && e.quantity === 0);
 const month = new Date().toLocaleDateString('en-CA').slice(0, 7);
 const monthly = entries.filter(e => e.entry_date.startsWith(month));
 const monthlyExpenses = summarize(monthly).expense;
 const monthlyBudget = monthly.filter(e => e.kind === 'budget').reduce((a, e) => a + e.amount, 0);
 const cards = type === 'store' ? [
  { title: 'Ventas registradas', value: money(total.income), icon: ArrowUpRight }, { title: 'Gastos registrados', value: money(total.expense), icon: ArrowDownRight },
  { title: 'Balance ventas − gastos', value: money(total.balance), icon: Wallet }, { title: 'Unidades en inventario', value: total.stock, icon: Package },
 ] : type === 'projects' ? [
  { title: 'Tareas', value: total.tasks, icon: FolderKanban }, { title: 'Hechas', value: total.completed, icon: CircleCheck },
  { title: 'Pendientes', value: pending.length, icon: CalendarDays }, { title: 'Gastos', value: money(total.expense), icon: Wallet },
 ] : type === 'services' ? [
  { title: 'Clientes', value: entries.filter(e => e.kind === 'customer').length, icon: Store }, { title: 'Citas y trabajos abiertos', value: pending.length, icon: CalendarDays },
  { title: 'Ingresos recibidos', value: money(total.income), icon: ArrowUpRight }, { title: 'Balance', value: money(total.balance), icon: Wallet },
 ] : [
  { title: 'Ingresos', value: money(total.income), icon: ArrowUpRight }, { title: 'Gastos', value: money(total.expense), icon: ArrowDownRight },
  { title: 'Balance', value: money(total.balance), icon: Wallet }, { title: 'Presupuesto de este mes', value: money(monthlyBudget), icon: CalendarDays },
 ];
 return <main className="min-h-screen bg-background">
 <header className="border-b border-border"><div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap items-center gap-3"><Link to="/administrar" className="font-display font-bold text-xl flex items-center gap-2 mr-auto"><Layers3 className="text-primary"/>Mi espacio</Link><span className="text-sm text-muted-foreground hidden sm:block">{profile.display_name}</span><Button variant="outline" size="sm" onClick={() => setSettings(true)}><Settings2 className="size-4"/>Mi perfil</Button><Button variant="ghost" size="sm" onClick={logout} disabled={loggingOut}><LogOut className="size-4"/>Salir</Button></div></header>
 <div className="max-w-7xl mx-auto px-5 py-8 space-y-8">
 <section className="flex flex-wrap items-center gap-4"><div className="mr-auto min-w-0"><div className="text-xs font-mono uppercase tracking-widest text-primary flex items-center gap-2 mb-2"><Icon className="size-4"/>{TYPES.find(t => t.id === type)?.label}</div><h1 className="text-3xl sm:text-4xl font-extrabold break-words">{profile.workspace_name}</h1></div>{type === 'projects' && <Button variant="outline" asChild><Link to="/panel">FoodMap Móvil<ArrowUpRight className="size-4"/></Link></Button>}</section>
 <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(c => <div key={c.title} className="border border-border rounded-lg bg-card p-5 min-w-0"><div className="text-sm text-muted-foreground flex gap-2 items-center"><c.icon className="text-primary size-4 shrink-0"/>{c.title}</div><div className="font-display font-bold text-2xl mt-3 break-words">{c.value}</div></div>)}</section>
 <section className="grid lg:grid-cols-[2fr_1fr] gap-8 border-y border-border py-7">
 <div className="min-w-0"><h2 className="font-bold text-lg mb-5">{type === 'projects' ? 'Estado de las tareas' : 'Ingresos y gastos · últimos 6 meses'}</h2>
 <ResponsiveContainer width="100%" height={220}><BarChart data={type === 'projects' ? ['pending','in_progress','done'].map(s => ({ name: STATUS[s as keyof typeof STATUS], Tareas: entries.filter(e => e.kind === 'task' && e.status === s).length })) : monthTotals(entries)}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}/><YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={55}/><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} /><Legend/>{type === 'projects' ? <Bar dataKey="Tareas" fill="var(--primary)" radius={[4,4,0,0]}/> : <><Bar dataKey="Ingresos" fill="var(--success)" radius={[4,4,0,0]}/><Bar dataKey="Gastos" fill="var(--primary)" radius={[4,4,0,0]}/></>}</BarChart></ResponsiveContainer>
 </div>
 <div className="space-y-4"><h2 className="font-bold text-lg">En foco</h2>{entries.length === 0 ? <p className="text-sm text-muted-foreground">Sin registros todavía.</p> : <>
 {type === 'store' && <Focus text={lowStock.length ? `${lowStock.length} producto(s) sin existencias.` : 'Todos los productos registrados tienen existencias.'}/>}
 {type === 'projects' && <><div className="text-3xl font-bold">{total.tasks ? Math.round(total.completed / total.tasks * 100) : 0}% <span className="text-sm text-muted-foreground font-normal">completado</span></div><Progress value={total.tasks ? total.completed / total.tasks * 100 : 0}/></>}
 {type !== 'finance' && <Focus text={pending.length ? `${pending.length} ${type === 'store' ? 'pedido(s)' : type === 'services' ? 'cita(s) o trabajo(s)' : 'tarea(s)'} por completar.` : 'Sin pendientes registrados.'}/>}
 {type === 'finance' && <><Focus text={monthlyBudget > 0 ? `Gastos del mes: ${money(monthlyExpenses)} de ${money(monthlyBudget)}.` : 'Sin presupuesto registrado para este mes.'}/>{monthlyBudget > 0 && <Progress value={Math.min(100, monthlyExpenses / monthlyBudget * 100)}/>}</>}
 {type !== 'projects' && <Focus text={total.balance < 0 ? 'Tus gastos registrados superan tus ingresos.' : 'Tus ingresos registrados cubren tus gastos.'}/>}</>}
 </div></section>
 <section>
 <div className="flex flex-wrap gap-1 border-b border-border mb-6" role="tablist" aria-label="Opciones de administración">{modules.map(m => <Button role="tab" aria-selected={active.kind === m.kind} key={m.kind} variant="ghost" className={`rounded-none border-b-2 ${active.kind === m.kind ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`} onClick={() => { setKind(m.kind); setSearch(''); }}>{m.label}<span className="text-xs font-mono">{entries.filter(e => e.kind === m.kind).length}</span></Button>)}</div>
 <div className="flex flex-wrap gap-3 items-center mb-5"><h2 className="font-bold text-xl mr-auto">{active.label}</h2><div className="relative w-full sm:w-56"><Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Buscar registros" className="pl-9" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)}/></div><Button onClick={() => setEditor({ entry: null, kind: active.kind })}><Plus className="size-4"/>Añadir {active.singular.toLowerCase()}</Button></div>
 <div role="tabpanel" className="divide-y divide-border">{filtered.map(e => <div key={e.id} className="flex items-start sm:items-center gap-3 py-4"><div className="flex-1 min-w-0"><div className="font-semibold break-words">{e.title}</div>{e.detail && <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">{e.detail}</p>}<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">{active.dated && <span>{new Date(`${e.entry_date}T12:00:00`).toLocaleDateString('es-CO')}</span>}{active.quantity && <span className={e.quantity === 0 ? 'text-destructive' : ''}>{e.quantity} unidades</span>}{active.money && <span>{money(e.amount)}</span>}{active.status && <span className={e.status === 'done' ? 'text-success' : 'text-primary'}>{STATUS[e.status as keyof typeof STATUS]}</span>}</div></div><Button size="icon" variant="ghost" title="Editar registro" aria-label={`Editar ${e.title}`} onClick={() => setEditor({ entry: e, kind: e.kind })}><Pencil className="size-4"/></Button><Button size="icon" variant="ghost" title="Eliminar registro" aria-label={`Eliminar ${e.title}`} onClick={() => setDeleting(e)}><Trash2 className="size-4 text-destructive"/></Button></div>)}{!filtered.length && <div className="py-12 text-center text-muted-foreground">{search ? 'No hay resultados.' : `Sin ${active.label.toLowerCase()} todavía.`}</div>}</div>
 </section></div>
 <Dialog open={settings} onOpenChange={setSettings}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Mi perfil y preferencias</DialogTitle></DialogHeader><ProfileForm profile={profile} onSaved={() => { setKind(''); setSettings(false); }}/></DialogContent></Dialog>
 {editor && <EntryDialog key={`${editor.kind}-${editor.entry?.id ?? 'new'}`} type={type} kind={editor.kind} entry={editor.entry} onClose={() => setEditor(null)}/>}
 <AlertDialog open={!!deleting} onOpenChange={open => { if (!open && !remove.isPending) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle><AlertDialogDescription>{deleting?.title}. No podrás recuperarlo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={remove.isPending} onClick={e => { e.preventDefault(); if (deleting) remove.mutate(deleting.id); }}>{remove.isPending ? 'Eliminando…' : 'Eliminar'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </main>;
}
function Focus({ text }: { text: string }) { return <div className="flex gap-2 text-sm text-muted-foreground"><AlertCircle className="size-4 shrink-0 text-primary mt-0.5"/><span>{text}</span></div>; }
