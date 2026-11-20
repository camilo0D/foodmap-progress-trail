import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { saveEntry } from '@/lib/management.functions';
import { MODULES, type Entry, type ManagementType } from '@/lib/management';
import { becameCompleted } from '@/lib/advice';
export function EntryDialog({ type, kind, entry, onClose }: { type: ManagementType; kind: string; entry: Entry | null; onClose: () => void }) {
 const module = MODULES[type].find(m => m.kind === kind);
 const qc = useQueryClient();
 const [title, setTitle] = useState(entry?.title ?? '');
 const [amount, setAmount] = useState(String(entry?.amount ?? 0));
 const [quantity, setQuantity] = useState(String(entry?.quantity ?? 0));
 const [status, setStatus] = useState<'pending'|'in_progress'|'done'>(entry?.status === 'done' || entry?.status === 'in_progress' ? entry.status : 'pending');
 const [date, setDate] = useState(entry?.entry_date ?? new Date().toLocaleDateString('en-CA'));
 const [detail, setDetail] = useState(entry?.detail ?? '');
 const save = useMutation({ mutationFn: () => saveEntry({ data: { id: entry?.id, management_type: type, kind, title, amount: Number(amount), quantity: Number(quantity), status: module?.status ? status : 'done', entry_date: date, detail } }), onSuccess: async () => { if (becameCompleted(entry?.status, module?.status ? status : 'done')) window.__lovableEvents?.track?.('project.management_entry_completed', { management_type: type, kind }); await qc.invalidateQueries({ queryKey: ['workspace'] }); toast.success('Registro guardado'); onClose(); }, onError: e => toast.error(e.message) });
 if (!module) return null;
 return <Dialog open onOpenChange={open => { if (!open && !save.isPending) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{entry ? 'Editar' : 'Nuevo'} · {module.singular}</DialogTitle></DialogHeader>
 <form className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
 <div className="space-y-2"><Label htmlFor="entry-title">{kind === 'customer' ? 'Nombre del cliente' : 'Nombre o concepto'}</Label><Input id="entry-title" autoFocus required maxLength={200} value={title} onChange={e => setTitle(e.target.value)}/></div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {module.money && <div className="space-y-2"><Label htmlFor="entry-amount">{module.money}</Label><Input id="entry-amount" type="number" min="0" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}/></div>}
 {module.quantity && <div className="space-y-2"><Label htmlFor="entry-quantity">{module.quantity}</Label><Input id="entry-quantity" type="number" min="0" step="1" required value={quantity} onChange={e => setQuantity(e.target.value)}/></div>}
 {module.dated && <div className="space-y-2"><Label htmlFor="entry-date">{kind === 'budget' ? 'Mes del presupuesto' : kind === 'task' || kind === 'job' || kind === 'order' ? 'Fecha prevista' : 'Fecha'}</Label><Input id="entry-date" type="date" required value={date} onChange={e => setDate(e.target.value)}/></div>}
 {module.status && <div className="space-y-2"><Label htmlFor="entry-status">Estado</Label><Select value={status} onValueChange={v => { if (v === 'pending' || v === 'in_progress' || v === 'done') setStatus(v); }}><SelectTrigger id="entry-status"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="in_progress">En progreso</SelectItem><SelectItem value="done">Hecho</SelectItem></SelectContent></Select></div>}
 </div>
 <div className="space-y-2"><Label htmlFor="entry-detail">{kind === 'customer' ? 'Contacto y notas' : 'Notas'}</Label><Textarea id="entry-detail" rows={3} maxLength={2000} value={detail} onChange={e => setDetail(e.target.value)}/></div>
 <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Cancelar</Button><Button type="submit" disabled={save.isPending || !title.trim()}>{save.isPending ? 'Guardando…' : 'Guardar registro'}</Button></div>
 </form></DialogContent></Dialog>;
}
