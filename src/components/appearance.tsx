import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { resolveDark, resolveTone, type AppearanceMode, type Tone } from '@/lib/appearance';
import { TYPES, type ManagementType } from '@/lib/management';

const AppearanceContext = createContext<{ setBusiness: (type: ManagementType) => void }>({ setBusiness: () => {} });
export function useBusinessTone(type: ManagementType | null) {
  const { setBusiness } = useContext(AppearanceContext);
  useEffect(() => { if (type) setBusiness(type); }, [type, setBusiness]);
}
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppearanceMode>('system');
  const [tone, setTone] = useState<Tone>('auto');
  const [business, setBusiness] = useState<ManagementType>('store');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('workspace-mode');
      const savedTone = localStorage.getItem('workspace-tone');
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') setMode(savedMode);
      if (savedTone === 'auto' || TYPES.some(t => t.id === savedTone)) setTone(savedTone as Tone);
    } catch { /* Storage may be disabled. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.classList.toggle('dark', resolveDark(mode, media.matches));
      document.documentElement.dataset['tone'] = resolveTone(tone, business);
    };
    apply(); media.addEventListener('change', apply);
    try { localStorage.setItem('workspace-mode', mode); localStorage.setItem('workspace-tone', tone); } catch { /* Storage may be disabled. */ }
    return () => media.removeEventListener('change', apply);
  }, [mode, tone, business, ready]);
  return <AppearanceContext.Provider value={{ setBusiness }}>{children}
    <div className="fixed bottom-4 left-4 z-40">
      <Popover><PopoverTrigger asChild><Button variant="outline" size="icon" className="bg-card shadow-card" aria-label="Apariencia" title="Apariencia"><Palette className="size-5"/></Button></PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-72 space-y-4">
          <h2 className="font-semibold">Apariencia</h2>
          <div className="flex gap-1" role="group" aria-label="Modo de apariencia">{([{ value: 'light', label: 'Claro', icon: Sun }, { value: 'dark', label: 'Oscuro', icon: Moon }, { value: 'system', label: 'Sistema', icon: Monitor }] as const).map(m => <Button key={m.value} size="sm" variant={mode === m.value ? 'default' : 'outline'} aria-pressed={mode === m.value} onClick={() => setMode(m.value)}><m.icon className="size-4"/>{m.label}</Button>)}</div>
          <h3 className="text-sm font-semibold">Tonalidad</h3>
          <Button className="w-full justify-between" variant={tone === 'auto' ? 'secondary' : 'ghost'} aria-pressed={tone === 'auto'} onClick={() => setTone('auto')}>Según mi espacio{tone === 'auto' && <Check className="size-4"/>}</Button>
          <div className="grid grid-cols-2 gap-1">{TYPES.map(t => <Button key={t.id} variant={tone === t.id ? 'secondary' : 'ghost'} className="justify-start h-auto whitespace-normal text-left" aria-pressed={tone === t.id} onClick={() => setTone(t.id)}><span className={`tone-swatch tone-${t.id} size-3 rounded-full shrink-0`}/>{t.label}</Button>)}</div>
        </PopoverContent>
      </Popover>
    </div>
  </AppearanceContext.Provider>;
}