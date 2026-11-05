import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TOTAL_POINTS, STORIES } from "@/lib/backlog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · Avances FoodMap Móvil" },
      { name: "description", content: "Entra para ver el avance de tu backlog y sprints de FoodMap Móvil." },
      { property: "og:title", content: "Avances FoodMap Móvil" },
      { property: "og:description", content: "Panel personal de progreso del proyecto FoodMap Móvil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/panel" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/panel" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Correo o contraseña incorrectos");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("Revisa tu correo para confirmar la cuenta");
    }
    setLoading(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("No se pudo entrar con Google");
  }

  return (
    <main className="min-h-screen bg-hero grid lg:grid-cols-2">
      <section className="flex flex-col justify-between p-8 lg:p-14">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Panel de avance
        </div>
        <div className="max-w-lg py-12">
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-[0.95]">
            FoodMap <span className="text-primary">Móvil</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Mira cuánto llevas, qué falta y dónde conviene poner el foco en cada sprint.
          </p>
          <div className="mt-10 flex gap-8">
            <Stat n={STORIES.length} l="historias" />
            <Stat n={TOTAL_POINTS} l="puntos" />
            <Stat n={5} l="sprints" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Juan Camilo Escobar Córdoba · 2026</div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-14">
        <form onSubmit={submit} className="card-soft w-full max-w-sm p-8 space-y-5">
          <div>
            <h2 className="text-2xl font-bold">{mode === "in" ? "Bienvenido de nuevo" : "Crear cuenta"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Tu progreso queda guardado en tu cuenta.</p>
          </div>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={google}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continuar con Google
          </Button>
          <div className="text-center text-xs text-muted-foreground">o con tu correo</div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Contraseña</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Un momento…" : mode === "in" ? "Entrar" : "Registrarme"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div>
      <div className="text-4xl font-display font-extrabold">{n}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
    </div>
  );
}
