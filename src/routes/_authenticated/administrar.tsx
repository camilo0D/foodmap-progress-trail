import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { workspaceQuery } from '@/lib/workspace-query';
import { WorkspaceDashboard } from '@/components/workspace-dashboard';
export const Route = createFileRoute('/_authenticated/administrar')({
 head: () => ({ meta: [
  { title: 'Tu administración · Mi espacio' },
  { name: 'description', content: 'Administra tu tienda, proyectos, servicios o finanzas desde tu espacio personal.' },
  { property: 'og:title', content: 'Tu administración · Mi espacio' },
  { property: 'og:description', content: 'Administra tu tienda, proyectos, servicios o finanzas desde tu espacio personal.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
 ] }),
 loader: ({ context }) => context.queryClient.ensureQueryData(workspaceQuery()),
 pendingComponent: () => <div className="min-h-screen grid place-items-center text-muted-foreground">Cargando tu espacio…</div>,
 component: WorkspacePage,
});
function WorkspacePage() {
 const { data } = useSuspenseQuery(workspaceQuery());
 return <WorkspaceDashboard profile={data.profile} entries={data.entries}/>;
}
