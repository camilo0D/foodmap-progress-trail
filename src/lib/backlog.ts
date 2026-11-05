export type Priority = "P1" | "P2" | "P3";
export type Status = "pending" | "in_progress" | "done";

export interface Story {
  id: string;
  sprint: number;
  title: string;
  epic: string;
  type: string;
  priority: Priority;
  points: number;
}

export const PROJECT_NAME = "FoodMap Móvil";
// Lunes de inicio del Sprint 1. Cada sprint dura 2 semanas.
export const PROJECT_START = new Date("2026-11-02T00:00:00");
export const SPRINT_DAYS = 14;

export const EPICS: Record<string, string> = {
  E1: "Diseño y fundamentos",
  E2: "Autenticación y sesión",
  E3: "Mapa con OpenStreetMap",
  E4: "Detalle, menú y reseñas",
  E5: "Búsqueda y filtros",
  E6: "Perfil de usuario",
  E7: "Dashboard restaurante",
  E8: "Admin móvil (opcional)",
  E9: "Calidad y publicación",
};

export const SPRINT_GOALS: Record<number, string> = {
  1: "Diseño y fundamentos",
  2: "Autenticación y mapa base",
  3: "Geolocalización, detalle y búsqueda",
  4: "Perfil y dashboard del restaurante",
  5: "Calidad, pulido y publicación",
};

const s = (
  id: number,
  sprint: number,
  title: string,
  epic: string,
  type: string,
  priority: Priority,
  points: number,
): Story => ({ id: `MOB-${String(id).padStart(3, "0")}`, sprint, title, epic, type, priority, points });

export const STORIES: Story[] = [
  s(1, 1, "Spike técnico: Expo + mapa OSM funcionando en un dispositivo", "E1", "SPIKE", "P1", 3),
  s(2, 1, "Setup del proyecto Expo + TypeScript + estructura + variables de entorno", "E1", "MÓVIL", "P1", 3),
  s(3, 1, "Revisión del Figma y sistema de diseño", "E1", "DISEÑO", "P1", 5),
  s(4, 1, "Navegación: Stack + Bottom Tabs según rol", "E1", "MÓVIL", "P1", 5),
  s(5, 1, "Cliente API (Axios + refresh automático) y tipos compartidos", "E1", "MÓVIL", "P1", 5),
  s(6, 1, "CI básico: lint, typecheck y build de prueba con EAS", "E1", "DEVOPS", "P2", 3),
  s(7, 2, "Pantalla de Login (React Hook Form + Zod)", "E2", "MÓVIL", "P1", 5),
  s(8, 2, "Registro de usuario y de restaurante", "E2", "MÓVIL", "P1", 5),
  s(9, 2, "Sesión persistente, renovación de token y logout con blacklist", "E2", "MÓVIL", "P1", 5),
  s(10, 2, "Splash, onboarding y redirección por rol", "E2", "MÓVIL", "P2", 3),
  s(11, 2, "Backend: ajustes para móvil (HTTPS, hosts, refresh, límites)", "E2", "BACKEND", "P1", 3),
  s(12, 2, "Mapa base con OpenStreetMap (tiles, atribución, centrado)", "E3", "MÓVIL", "P1", 8),
  s(13, 2, "Marcadores por categoría y tarjeta emergente", "E3", "MÓVIL", "P1", 5),
  s(14, 3, "Geolocalización: permisos, ubicación en vivo, centrar y distancia", "E3", "MÓVIL", "P1", 5),
  s(15, 3, "Alternar vista Mapa/Lista y ordenar por cercanía", "E3", "MÓVIL", "P2", 3),
  s(16, 3, "Detalle del restaurante: info, galería, horario, llamar, cómo llegar", "E4", "MÓVIL", "P1", 8),
  s(17, 3, "Menú del restaurante dentro del detalle", "E4", "MÓVIL", "P1", 3),
  s(18, 3, "Reseñas: listar y crear con estrellas", "E4", "MÓVIL", "P1", 5),
  s(19, 3, "Búsqueda por nombre y filtros", "E5", "MÓVIL", "P2", 8),
  s(20, 3, "Estrategia de tiles OSM: política, caché y proveedor", "E3", "MÓVIL", "P1", 3),
  s(21, 4, "Perfil: editar datos y avatar (cámara/galería)", "E6", "MÓVIL", "P3", 5),
  s(22, 4, "Historial de reseñas propias y eliminación", "E6", "MÓVIL", "P3", 3),
  s(23, 4, "Dashboard restaurante: resumen y Mi perfil", "E7", "MÓVIL", "P1", 5),
  s(24, 4, "Dashboard: ubicación con pin arrastrable sobre OSM", "E7", "MÓVIL", "P1", 5),
  s(25, 4, "Dashboard: gestión de menú (CRUD, disponibilidad, foto)", "E7", "MÓVIL", "P1", 8),
  s(26, 4, "Dashboard: reseñas recibidas y promedio", "E7", "MÓVIL", "P2", 3),
  s(27, 4, "Subida de imágenes desde móvil (compresión y multipart)", "E7", "MÓVIL", "P2", 3),
  s(28, 5, "Admin móvil: métricas, usuarios y restaurantes (opcional)", "E8", "MÓVIL", "P3", 8),
  s(29, 5, "Deep links y compartir restaurante", "E9", "MÓVIL", "P3", 3),
  s(30, 5, "Estados de carga, vacío, error y modo sin conexión", "E9", "MÓVIL", "P2", 5),
  s(31, 5, "Accesibilidad y modo oscuro", "E9", "MÓVIL", "P3", 3),
  s(32, 5, "Pruebas: unitarias (Jest) y E2E (Maestro)", "E9", "QA", "P2", 5),
  s(33, 5, "Publicación: íconos, splash, privacidad, Play Store / TestFlight", "E9", "DEVOPS", "P1", 8),
];

export const TOTAL_POINTS = STORIES.reduce((a, b) => a + b.points, 0);

export function currentSprint(now = new Date()): number {
  const days = Math.floor((now.getTime() - PROJECT_START.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.min(5, Math.floor(days / SPRINT_DAYS) + 1);
}

export function sprintEnd(sprint: number): Date {
  return new Date(PROJECT_START.getTime() + sprint * SPRINT_DAYS * 86400000);
}
