import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PurposePicker } from './purpose-picker';
import { saveProfile } from '@/lib/management.functions';
import { isManagementType, type Profile, type ManagementType } from '@/lib/management';
export function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved?: () => void }) {
 const qc = useQueryClient();
 const [name, setName] = useState(profile.display_name);
 const [workspace, setWorkspace] = useState(profile.workspace_name);
 const [purpose, setPurpose] = useState<ManagementType>(isManagementType(profile.management_type) ? profile.management_type : 'store');
 const [currency, setCurrency] = useState<'COP'|'USD'|'EUR'>(profile.currency === 'USD' || profile.currency === 'EUR' ? profile.currency : 'COP');
 const save = useMutation({ mutationFn: () => saveProfile({ data: { display_name: name, workspace_name: workspace, management_type: purpose, currency } }), onSuccess: async () => { if (purpose !== profile.management_type) window.__lovableEvents?.track?.('project.management_selected', { management_type: purpose, source: 'profile' }); await qc.invalidateQueries({ queryKey: ['workspace'] }); toast.success('Tu espacio está listo'); onSaved?.(); }, onError: e => toast.error(e.message) });
 return <form className="space-y-5" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
 <div className="space-y-2"><Label htmlFor="profile-name">Tu nombre</Label><Input id="profile-name" required maxLength={100} value={name} onChange={e => setName(e.target.value)}/></div>
 <div className="space-y-2"><Label>¿Qué quieres administrar?</Label><PurposePicker value={purpose} onChange={setPurpose}/></div>
 <div className="space-y-2"><Label htmlFor="profile-workspace">Nombre de tu espacio</Label><Input id="profile-workspace" required maxLength={100} value={workspace} onChange={e => setWorkspace(e.target.value)}/></div>
 <div className="space-y-2"><Label htmlFor="currency">Moneda</Label><Select value={currency} onValueChange={v => { if (v === 'COP' || v === 'USD' || v === 'EUR') setCurrency(v); }}><SelectTrigger id="currency"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="COP">Peso colombiano · COP</SelectItem><SelectItem value="USD">Dólar · USD</SelectItem><SelectItem value="EUR">Euro · EUR</SelectItem></SelectContent></Select></div>
 <Button className="w-full" type="submit" disabled={save.isPending || !name.trim() || !workspace.trim()}>{save.isPending ? 'Guardando…' : 'Guardar mi espacio'}</Button></form>;
}
