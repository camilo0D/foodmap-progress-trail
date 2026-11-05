import { STORIES, TOTAL_POINTS, currentSprint, sprintEnd, type Status, type Story } from "./backlog";

export interface ProgressRow {
  story_id: string;
  status: Status;
  notes: string | null;
  completed_at: string | null;
  updated_at: string;
}

export type Tone = "good" | "warn" | "bad" | "info";
export interface Insight {
  tone: Tone;
  title: string;
  detail: string;
}

export function statusOf(map: Map<string, ProgressRow>, id: string): Status {
  return map.get(id)?.status ?? "pending";
}

export function computeInsights(map: Map<string, ProgressRow>, now = new Date()): Insight[] {
  const out: Insight[] = [];
  const cur = currentSprint(now);
  const donePts = STORIES.filter((s) => statusOf(map, s.id) === "done").reduce((a, s) => a + s.points, 0);

  // Historias de sprints ya cerrados que siguen sin terminar
  const late = STORIES.filter((s) => s.sprint < cur && statusOf(map, s.id) !== "done");
  if (late.length) {
    const p1 = late.filter((s) => s.priority === "P1");
    out.push({
      tone: p1.length ? "bad" : "warn",
      title: `${late.length} historia(s) atrasadas de sprints anteriores`,
      detail: `${p1.length} son críticas (P1): ${p1.slice(0, 3).map((s) => s.id).join(", ") || "ninguna"}. Ciérralas antes de empezar trabajo nuevo.`,
    });
  }

  // Ritmo del sprint actual vs tiempo transcurrido
  const curStories = STORIES.filter((s) => s.sprint === cur);
  const curTotal = curStories.reduce((a, s) => a + s.points, 0);
  const curDone = curStories.filter((s) => statusOf(map, s.id) === "done").reduce((a, s) => a + s.points, 0);
  const end = sprintEnd(cur).getTime();
  const start = end - 14 * 86400000;
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
  const pct = curTotal ? curDone / curTotal : 0;
  if (pct + 0.15 < elapsed) {
    out.push({
      tone: "warn",
      title: `Sprint ${cur} va por detrás del calendario`,
      detail: `Llevas ${Math.round(pct * 100)}% de los puntos con ${Math.round(elapsed * 100)}% del tiempo usado. Considera mover una historia P3 al siguiente sprint.`,
    });
  } else if (curTotal) {
    out.push({
      tone: "good",
      title: `Sprint ${cur} va a buen ritmo`,
      detail: `${curDone} de ${curTotal} pts completados con ${Math.round(elapsed * 100)}% del tiempo transcurrido.`,
    });
  }

  // Demasiado trabajo en paralelo
  const wip = STORIES.filter((s) => statusOf(map, s.id) === "in_progress");
  if (wip.length > 3) {
    out.push({
      tone: "warn",
      title: `${wip.length} historias en progreso a la vez`,
      detail: "Trabajando solo, conviene tener máximo 2–3 abiertas. Termina antes de empezar otra.",
    });
  }

  // Historias estancadas
  const stale = wip.filter((s) => now.getTime() - new Date(map.get(s.id)!.updated_at).getTime() > 7 * 86400000);
  if (stale.length) {
    out.push({
      tone: "bad",
      title: `${stale.length} historia(s) estancadas más de 7 días`,
      detail: `${stale.map((s) => s.id).join(", ")}. Divídelas en tareas más pequeñas o anota qué te bloquea.`,
    });
  }

  // Siguiente paso recomendado
  const next = nextRecommended(map);
  if (next) {
    out.push({
      tone: "info",
      title: `Siguiente recomendado: ${next.id}`,
      detail: `${next.title} (${next.priority}, ${next.points} pts).`,
    });
  }

  if (donePts === TOTAL_POINTS) {
    out.unshift({ tone: "good", title: "¡Backlog completado!", detail: "Todas las historias están terminadas." });
  }
  return out;
}

export function nextRecommended(map: Map<string, ProgressRow>): Story | undefined {
  const order = { P1: 0, P2: 1, P3: 2 } as const;
  return STORIES.filter((s) => statusOf(map, s.id) !== "done").sort(
    (a, b) => a.sprint - b.sprint || order[a.priority] - order[b.priority] || a.id.localeCompare(b.id),
  )[0];
}
