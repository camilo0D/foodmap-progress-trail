import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/components/auth-page';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Mi espacio · Registro y administración' },
    { name: 'description', content: 'Tu espacio personal para administrar tiendas, proyectos, servicios y finanzas.' },
    { property: 'og:title', content: 'Mi espacio · Registro y administración' },
    { property: 'og:description', content: 'Tu espacio personal para administrar tiendas, proyectos, servicios y finanzas.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: AuthPage,
});
