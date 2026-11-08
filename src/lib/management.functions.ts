import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { acceptsKind, type Profile } from './management';

const managementType = z.enum(['store', 'projects', 'services', 'finance']);
export const readWorkspace = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: profile, error } = await context.supabase.from('profiles').select('*').eq('id', context.userId).single();
  if (error) throw new Error('No se pudo cargar tu perfil.');
  const { data: entries, error: entriesError } = await context.supabase.from('management_entries').select('*').eq('user_id', context.userId).eq('management_type', profile.management_type ?? 'projects').order('created_at', { ascending: false });
  if (entriesError) throw new Error('No se pudieron cargar tus registros.');
  return { profile: profile as Profile, entries: entries ?? [] };
});
export const saveProfile = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ display_name: z.string().trim().min(1).max(100), workspace_name: z.string().trim().min(1).max(100), management_type: managementType, currency: z.enum(['COP','USD','EUR']) })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('profiles').update(data).eq('id', context.userId);
  if (error) throw new Error('No se pudo guardar tu perfil.');
  return { success: true };
});
export const saveEntry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid().optional(), management_type: managementType, kind: z.string(), title: z.string().trim().min(1).max(200), amount: z.number().finite().min(0), quantity: z.number().int().min(0), status: z.enum(['pending','in_progress','done']), entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v))), detail: z.string().max(2000) })).handler(async ({ data, context }) => {
  if (!acceptsKind(data.management_type, data.kind)) throw new Error('Este registro no corresponde a tu actividad.');
  const { data: profile } = await context.supabase.from('profiles').select('management_type').eq('id', context.userId).single();
  if (profile?.management_type !== data.management_type) throw new Error('Selecciona primero esta actividad en tu perfil.');
  const { id, ...values } = data;
  const result = id
    ? await context.supabase.from('management_entries').update(values).eq('id', id).eq('user_id', context.userId).select('id').single()
    : await context.supabase.from('management_entries').insert({ ...values, user_id: context.userId }).select('id').single();
  if (result.error) throw new Error('No se pudo guardar el registro.');
  return result.data;
});
export const deleteEntry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from('management_entries').delete().eq('id', data.id).eq('user_id', context.userId);
  if (error) throw new Error('No se pudo eliminar el registro.');
  return { success: true };
});