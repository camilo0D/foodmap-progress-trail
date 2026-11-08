import { Store, FolderKanban, CalendarDays, Wallet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPES, type ManagementType } from '@/lib/management';
const icons = { store: Store, projects: FolderKanban, services: CalendarDays, finance: Wallet };
export function PurposePicker({ value, onChange }: { value: ManagementType; onChange: (v: ManagementType) => void }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Qué administrar">
    {TYPES.map(t => { const Icon = icons[t.id]; return <Button key={t.id} type="button" variant={value === t.id ? 'secondary' : 'outline'} aria-pressed={value === t.id} onClick={() => onChange(t.id)} className={`h-auto min-h-20 justify-start whitespace-normal text-left p-3 ${value === t.id ? 'border border-primary' : ''}`}><Icon className="size-5 shrink-0 text-primary"/><span className="flex-1"><span className="block font-semibold">{t.label}</span><span className="block text-xs text-muted-foreground font-normal mt-1">{t.detail}</span></span>{value === t.id && <Check className="size-4 shrink-0 text-primary"/>}</Button>; })}
  </div>;
}