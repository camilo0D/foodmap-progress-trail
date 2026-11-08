import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/components/auth-page';
export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'Accede a tu cuenta · Mi espacio' },
    { name: 'description', content: 'Inicia sesión o crea tu cuenta personal en Mi espacio.' },
    { property: 'og:title', content: 'Accede a tu cuenta · Mi espacio' },
    { property: 'og:description', content: 'Inicia sesión o crea tu cuenta personal en Mi espacio.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: AuthPage,
});
