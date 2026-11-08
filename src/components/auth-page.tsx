import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, Layers3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PurposePicker } from './purpose-picker';
import { type ManagementType } from '@/lib/management';
import deskImage from '@/assets/management-desk.jpg';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in'|'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [purpose, setPurpose] = useState<ManagementType>('store');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: '/administrar', replace: true }); }); }, [navigate]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Correo o contraseña incorrectos.');
        await navigate({ to: '/administrar', replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim(), workspace_name: workspace.trim(), management_type: purpose } } });
        if (error) throw error;
        if (data.session) await navigate({ to: '/administrar', replace: true });
        else setConfirmation(true);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo continuar.'); }
    finally { setLoading(false); }
  }
  async function google() {
    setLoading(true);
    try { const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin }); if (r.error) throw r.error; const { data } = await supabase.auth.getUser(); if (data.user) await navigate({ to: '/administrar', replace: true }); }
    catch { toast.error('No se pudo entrar con Google.'); } finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-background">
    <header className="max-w-6xl mx-auto px-6 py-6 flex items-center gap-2 font-display font-bold text-xl"><Layers3 className="text-primary size-6"/>Mi espacio<span className="ml-auto text-xs font-mono text-muted-foreground hidden sm:block">FoodMap Móvil · 2026</span></header>
    <div className="max-w-6xl mx-auto px-6 pb-12 grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-20 items-start">
      <section className="pt-6 lg:pt-16"><div className="text-xs text-primary font-mono uppercase tracking-widest mb-4">Cada idea, a su ritmo</div><h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">Tu tienda.<br/>Tus proyectos.<br/><span className="text-primary">Tu espacio.</span></h1><img src={deskImage} alt="Tienda en miniatura con una libreta, calendario y calculadora" width={1152} height={576} className="w-full mt-8 rounded-lg"/><div className="mt-5 text-sm text-muted-foreground">FoodMap Móvil sigue en tu espacio de proyectos.</div></section>
      <section className="lg:pt-4">
        <div className="flex border-b border-border mb-7"><Button variant="ghost" className={`rounded-none flex-1 border-b-2 ${mode === 'in' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => { setMode('in'); setConfirmation(false); }}>Iniciar sesión</Button><Button variant="ghost" className={`rounded-none flex-1 border-b-2 ${mode === 'up' ? 'border-primary text-primary' : 'border-transparent'}`} onClick={() => { setMode('up'); setConfirmation(false); }}>Registrarte</Button></div>
        {confirmation ? <div className="py-12 space-y-4"><CheckCircle2 className="size-12 text-success"/><h2 className="text-2xl font-bold">Confirma tu correo</h2><p className="text-muted-foreground">Te enviamos un enlace a {email}. Confirma tu cuenta y después inicia sesión.</p><Button onClick={() => { setConfirmation(false); setMode('in'); }}>Volver a iniciar sesión<ArrowRight/></Button></div> : <form onSubmit={submit} className="space-y-4">
          <h2 className="text-2xl font-bold">{mode === 'in' ? 'Bienvenido de nuevo' : 'Crea tu espacio'}</h2>
          {mode === 'up' && <><div className="space-y-2"><Label htmlFor="name">Tu nombre</Label><Input id="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete="name"/></div><Label>¿Qué quieres administrar?</Label><PurposePicker value={purpose} onChange={setPurpose}/><div className="space-y-2"><Label htmlFor="workspace">Nombre de tu espacio</Label><Input id="workspace" required maxLength={100} placeholder={purpose === 'store' ? 'Mi tienda' : purpose === 'projects' ? 'Mi proyecto' : purpose === 'services' ? 'Mis servicios' : 'Mis finanzas'} value={workspace} onChange={e => setWorkspace(e.target.value)}/></div></>}
          <div className="space-y-2"><Label htmlFor="email">Correo</Label><Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/></div>
          <div className="space-y-2"><Label htmlFor="pw">Contraseña</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'}/></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}<ArrowRight className="size-4"/></Button>
          <div className="text-center text-xs text-muted-foreground">o</div><Button type="button" variant="outline" className="w-full" disabled={loading} onClick={google}>Continuar con Google</Button>
        </form>}
      </section>
    </div>
  </main>;
}