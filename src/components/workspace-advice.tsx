import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateAdvice, saveAdvice } from '@/lib/advice.functions';
import type { ManagementType } from '@/lib/management';
import type { Tables } from '@/integrations/supabase/types';
const GOAL_EXAMPLES: Record<ManagementType, string> = {
  store: 'Quiero aumentar mis ventas un 10% y evitar productos sin existencias…',
  projects: 'Quiero completar las tareas prioritarias de mi proyecto antes de fin de mes…',
  services: 'Quiero reducir las citas canceladas y conseguir clientes recurrentes…',
  finance: 'Quiero reducir mis gastos y ahorrar para una meta concreta…',
};

export function WorkspaceAdvice({ type, advice }: { type: ManagementType; advice: Tables<'workspace_advice'> | null }) {
  const [goals, setGoals] = useState(advice?.goals ?? '');
  const [context, setContext] = useState(advice?.context ?? '');
  const [text, setText] = useState(advice?.recommendation ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'save' | 'generate' | null>(null);
  const generate = useServerFn(generateAdvice);
  const save = useServerFn(saveAdvice);
  const qc = useQueryClient();
  async function run(action: 'save' | 'generate') {
    setBusy(action); setError('');
    try {
      const data = { management_type: type, goals, context };
      if (action === 'save') { await save({ data }); toast.success('Metas guardadas'); }
      else { const result = await generate({ data }); if (result.text) setText(result.text); if (result.error) setError(result.error); }
      await qc.invalidateQueries({ queryKey: ['workspace'] });
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo continuar.'); }
    finally { setBusy(null); }
  }
  return <section className="border-t border-border py-7 grid lg:grid-cols-2 gap-8">
    <div className="space-y-4"><h2 className="font-bold text-xl flex items-center gap-2"><Sparkles className="size-5 text-primary"/>Metas y recomendaciones</h2>
      <div className="space-y-2"><Label htmlFor="advice-goals">Tus metas</Label><Textarea id="advice-goals" maxLength={3000} rows={3} placeholder={GOAL_EXAMPLES[type]} value={goals} onChange={e => setGoals(e.target.value)} disabled={!!busy}/></div>
      <div className="space-y-2"><Label htmlFor="advice-context">Datos adicionales y dificultades</Label><Textarea id="advice-context" maxLength={5000} rows={4} placeholder="Presupuesto disponible, tiempo, obstáculos y resultados recientes…" value={context} onChange={e => setContext(e.target.value)} disabled={!!busy}/></div>
      <p className="text-xs text-muted-foreground">Al generar, tus metas, contexto e indicadores de este espacio se envían a Lovable AI. No incluyas información sensible.</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!!busy || !goals.trim()} onClick={() => run('save')}><Save className="size-4"/>Guardar metas</Button><Button disabled={!!busy || !goals.trim()} onClick={() => run('generate')}>{busy === 'generate' ? <Loader2 className="size-4 animate-spin"/> : <Sparkles className="size-4"/>}{busy === 'generate' ? 'Analizando tu espacio…' : 'Generar recomendaciones'}</Button></div>
    </div>
    <div className="min-w-0" aria-live="polite"><h3 className="font-bold mb-4">Tu próximo paso</h3>{error && <p role="alert" className="text-destructive mb-4 break-words">{error}</p>}{busy === 'generate' && <p role="status" className="flex items-center gap-2 text-primary mb-4 text-sm"><Loader2 className="size-4 animate-spin shrink-0"/>Preparando acciones según tus metas y registros…</p>}{text ? <><div className="recommendation-content break-words text-sm leading-7"><Markdown>{text}</Markdown></div>{advice?.generated_at && <p className="text-xs text-muted-foreground mt-4">Último análisis: {new Date(advice.generated_at).toLocaleString('es-CO')}</p>}<p className="text-xs text-muted-foreground mt-4">Orientación generada con IA; revisa las cifras antes de tomar decisiones.</p></> : <p className="text-sm text-muted-foreground">Aún no hay recomendaciones guardadas.</p>}</div>
  </section>;
}