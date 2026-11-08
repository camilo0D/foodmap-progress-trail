import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Circle, Info, LogOut, Search, Timer, TrendingUp, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  EPICS, PROJECT_START, SPRINT_GOALS, STORIES, TOTAL_POINTS, currentSprint,
  type Status, type Story,
} from "@/lib/backlog";
import { computeInsights, statusOf, type ProgressRow, type Tone } from "@/lib/insights";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Mi avance · FoodMap Móvil" },
      { name: "description", content: "Gráficas, sprints y recomendaciones del proyecto FoodMap Móvil." },
      { property: "og:title", content: "Mi avance · FoodMap Móvil" },
      { property: "og:description", content: "Gráficas, sprints y recomendaciones del proyecto FoodMap Móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Panel,
});

const STATUS_LABEL: Record<Status, string> = { pending: "Pendiente", in_progress: "En progreso", done: "Hecho" };
const NEXT: Record<Status, Status> = { pending: "in_progress", in_progress: "done", done: "pending" };
const C = { done: "var(--chart-1)", in_progress: "var(--chart-2)", pending: "var(--chart-3)" };

function Panel() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/" });
      else { setUserId(data.user.id); setEmail(data.user.email ?? ""); }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) navigate({ to: "/" }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("story_progress").select("story_id,status,notes,completed_at,updated_at");
      if (error) throw error;
      return data as ProgressRow[];
    },
  });
  const map = useMemo(() => new Map(rows.map((r) => [r.story_id, r])), [rows]);

  const save = useMutation({
    mutationFn: async (p: { story_id: string; status: Status; notes?: string | null }) => {
      const prev = map.get(p.story_id);
      const now = new Date().toISOString();
      const { error } = await supabase.from("story_progress").upsert(
        {
          user_id: userId!, story_id: p.story_id, status: p.status,
          notes: p.notes !== undefined ? p.notes : prev?.notes ?? null,
          completed_at: p.status === "done" ? (prev?.status === "done" ? prev.completed_at : now) : null,
          updated_at: now,
        },
        { onConflict: "user_id,story_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress", userId] }),
    onError: () => toast.error("No se pudo guardar"),
  });

  if (!userId || isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Cargando tu avance…</div>;
  }

  return (
    <Dashboard
      map={map}
      email={email}
      onSet={(story_id, status) => save.mutate({ story_id, status })}
      onNotes={(story_id, notes) => save.mutate({ story_id, status: statusOf(map, story_id), notes })}
      onLogout={() => supabase.auth.signOut()}
    />
  );
}

function Dashboard({ map, email, onSet, onNotes, onLogout }: {
  map: Map<string, ProgressRow>; email: string;
  onSet: (id: string, s: Status) => void; onNotes: (id: string, n: string) => void; onLogout: () => void;
}) {
  const [sprintFilter, setSprintFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Story | null>(null);
  const cur = currentSprint();

  const ptsBy = (st: Status, list = STORIES) => list.filter((s) => statusOf(map, s.id) === st).reduce((a, s) => a + s.points, 0);
  const done = ptsBy("done"), wip = ptsBy("in_progress"), pend = ptsBy("pending");
  const pct = Math.round((done / TOTAL_POINTS) * 100);
  const countBy = (st: Status) => STORIES.filter((s) => statusOf(map, s.id) === st).length;

  const sprintData = [1, 2, 3, 4, 5].map((n) => {
    const l = STORIES.filter((s) => s.sprint === n);
    return { name: `S${n}`, sprint: n, Hecho: ptsBy("done", l), "En progreso": ptsBy("in_progress", l), Pendiente: ptsBy("pending", l) };
  });

  const epicData = Object.entries(EPICS).map(([k, name]) => {
    const l = STORIES.filter((s) => s.epic === k);
    const t = l.reduce((a, s) => a + s.points, 0);
    return { name: k, full: name, pct: t ? Math.round((ptsBy("done", l) / t) * 100) : 0 };
  });

  const priorityData = (["P1", "P2", "P3"] as const).map((p) => {
    const l = STORIES.filter((s) => s.priority === p);
    return { name: p, Hecho: ptsBy("done", l), Falta: ptsBy("pending", l) + ptsBy("in_progress", l) };
  });

  // Burndown semanal: ideal vs real según fecha de finalización
  const burn = Array.from({ length: 11 }, (_, w) => {
    const date = new Date(PROJECT_START.getTime() + w * 7 * 86400000);
    const real = TOTAL_POINTS - STORIES.filter((s) => {
      const r = map.get(s.id);
      return r?.status === "done" && r.completed_at && new Date(r.completed_at) <= date;
    }).reduce((a, s) => a + s.points, 0);
    return {
      name: `Sem ${w}`,
      Ideal: Math.round(TOTAL_POINTS - (TOTAL_POINTS * w) / 10),
      Real: date <= new Date(Date.now() + 7 * 86400000) ? real : null,
    };
  });

  const insights = computeInsights(map);

  const list = STORIES.filter((s) =>
    (sprintFilter === "all" || s.sprint === sprintFilter) &&
    (statusFilter === "all" || statusOf(map, s.id) === statusFilter) &&
    (q === "" || (s.id + s.title).toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <main className="min-h-screen bg-hero">
      <header className="mx-auto max-w-7xl px-5 pt-8 pb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Sprint {cur} de 5 · {SPRINT_GOALS[cur]}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-1">FoodMap <span className="text-primary">Móvil</span></h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{email}</span>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="size-4" /> Salir</Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 space-y-5">
        {/* KPIs */}
        <section className="grid gap-4 md:grid-cols-4">
          <div className="card-soft p-5 md:row-span-2 flex flex-col items-center justify-center">
            <div className="relative h-44 w-44">
              <ResponsiveContainer>
                <RadialBarChart innerRadius="78%" outerRadius="100%" data={[{ v: pct }]} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="v" cornerRadius={20} fill="var(--primary)" background={{ fill: "var(--muted)" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-5xl font-display font-extrabold">{pct}%</div>
                  <div className="text-xs text-muted-foreground">completado</div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">{done} de {TOTAL_POINTS} puntos</div>
          </div>
          <Kpi icon={<CheckCircle2 className="size-5 text-success" />} label="Hechas" value={countBy("done")} sub={`${done} pts`} />
          <Kpi icon={<Timer className="size-5 text-warning" />} label="En progreso" value={countBy("in_progress")} sub={`${wip} pts`} />
          <Kpi icon={<Circle className="size-5 text-muted-foreground" />} label="Pendientes" value={countBy("pending")} sub={`${pend} pts`} />
          <div className="card-soft p-5 md:col-span-3">
            <div className="flex items-center gap-2 font-semibold mb-3"><TrendingUp className="size-4 text-primary" /> Qué mejorar</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {insights.map((i, k) => <InsightRow key={k} tone={i.tone} title={i.title} detail={i.detail} />)}
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Puntos por sprint" hint="Toca una barra para filtrar la lista" className="lg:col-span-2">
            <ResponsiveContainer height={260}>
              <BarChart data={sprintData} onClick={(e) => {
                const n = (e?.activePayload?.[0]?.payload as { sprint?: number } | undefined)?.sprint;
                if (n) setSprintFilter(sprintFilter === n ? "all" : n);
              }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend />
                <Bar dataKey="Hecho" stackId="a" fill={C.done} className="cursor-pointer" />
                <Bar dataKey="En progreso" stackId="a" fill={C.in_progress} className="cursor-pointer" />
                <Bar dataKey="Pendiente" stackId="a" fill={C.pending} radius={[6, 6, 0, 0]} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estado de historias" hint="Toca un segmento para filtrar">
            <ResponsiveContainer height={260}>
              <PieChart>
                <Pie
                  data={(["done", "in_progress", "pending"] as Status[]).map((s) => ({ name: STATUS_LABEL[s], key: s, value: countBy(s) }))}
                  dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={3}
                  onClick={(d: { key?: Status }) => d.key && setStatusFilter(statusFilter === d.key ? "all" : d.key)}
                >
                  {(["done", "in_progress", "pending"] as Status[]).map((s) => (
                    <Cell key={s} fill={C[s]} className="cursor-pointer" stroke="var(--card)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Burndown" hint="Puntos restantes: plan ideal vs tu avance real" className="lg:col-span-2">
            <ResponsiveContainer height={240}>
              <LineChart data={burn}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="linear" dataKey="Ideal" stroke="var(--muted-foreground)" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Real" stroke="var(--primary)" strokeWidth={3} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por prioridad" hint="Puntos hechos vs por hacer">
            <ResponsiveContainer height={240}>
              <BarChart data={priorityData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={30} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="Hecho" stackId="p" fill={C.done} />
                <Bar dataKey="Falta" stackId="p" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avance por épica" hint="Porcentaje de puntos terminados" className="lg:col-span-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {epicData.map((e) => (
                <div key={e.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span><span className="font-mono text-xs text-muted-foreground mr-2">{e.name}</span>{e.full}</span>
                    <span className="font-semibold">{e.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-success transition-all duration-500" style={{ width: `${e.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </section>

        {/* Backlog */}
        <section className="card-soft p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-xl font-bold mr-auto">Backlog</h2>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 w-56" placeholder="Buscar historia…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Chip active={sprintFilter === "all"} onClick={() => setSprintFilter("all")}>Todos</Chip>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip key={n} active={sprintFilter === n} onClick={() => setSprintFilter(n)}>Sprint {n}</Chip>
            ))}
            <span className="w-px bg-border mx-1" />
            {(["all", "pending", "in_progress", "done"] as const).map((s) => (
              <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "Cualquier estado" : STATUS_LABEL[s]}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Toca el estado para avanzarlo · toca el título para agregar notas.</p>
          <ul className="divide-y divide-border">
            {list.map((s) => {
              const st = statusOf(map, s.id);
              const note = map.get(s.id)?.notes;
              return (
                <li key={s.id} className="py-3 flex items-center gap-3">
                  <button
                    onClick={() => onSet(s.id, NEXT[st])}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors w-28 ${
                      st === "done" ? "bg-success text-success-foreground"
                        : st === "in_progress" ? "bg-warning text-warning-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {STATUS_LABEL[st]}
                  </button>
                  <button className="flex-1 min-w-0 text-left" onClick={() => setEditing(s)}>
                    <div className={`truncate ${st === "done" ? "line-through text-muted-foreground" : ""}`}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{s.id}</span>{s.title}
                    </div>
                    {note && <div className="text-xs text-muted-foreground truncate">📝 {note}</div>}
                  </button>
                  <span className="hidden md:inline font-mono text-xs text-muted-foreground">S{s.sprint}</span>
                  <span className={`hidden sm:inline text-xs font-semibold ${s.priority === "P1" ? "text-primary" : "text-muted-foreground"}`}>{s.priority}</span>
                  <span className="w-12 text-right text-sm font-semibold">{s.points} pts</span>
                </li>
              );
            })}
            {list.length === 0 && <li className="py-8 text-center text-muted-foreground">No hay historias con estos filtros.</li>}
          </ul>
        </section>
      </div>

      <NotesDialog story={editing} initial={editing ? map.get(editing.id)?.notes ?? "" : ""}
        onClose={() => setEditing(null)}
        onSave={(n) => { if (editing) onNotes(editing.id, n); setEditing(null); toast.success("Nota guardada"); }} />
    </main>
  );
}

const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <div className="text-4xl font-display font-extrabold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({ title, hint, className = "", children }: { title: string; hint: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`card-soft p-5 ${className}`}>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mb-3">{hint}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? "bg-ink text-ink-foreground border-ink" : "bg-card text-muted-foreground hover:text-foreground"
      }`}>
      {children}
    </button>
  );
}

function InsightRow({ tone, title, detail }: { tone: Tone; title: string; detail: string }) {
  const icon = {
    good: <CheckCircle2 className="size-4 text-success" />,
    warn: <AlertTriangle className="size-4 text-warning" />,
    bad: <XCircle className="size-4 text-destructive" />,
    info: <Info className="size-4 text-primary" />,
  }[tone];
  return (
    <div className="flex gap-3 rounded-lg bg-muted/60 p-3">
      <div className="pt-0.5">{icon}</div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

function NotesDialog({ story, initial, onClose, onSave }: { story: Story | null; initial: string; onClose: () => void; onSave: (n: string) => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => setText(initial), [initial, story]);
  return (
    <Dialog open={!!story} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle><span className="font-mono text-sm text-muted-foreground mr-2">{story?.id}</span>{story?.title}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground">
          Sprint {story?.sprint} · {story && EPICS[story.epic]} · {story?.type} · {story?.priority} · {story?.points} pts
        </div>
        <Textarea rows={5} placeholder="¿Qué hiciste, qué te bloquea, qué aprendiste?" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(text)}>Guardar nota</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

