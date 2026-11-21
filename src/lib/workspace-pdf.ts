import { MODULES, TYPES, summarize, type Entry, type Profile, type ManagementType } from './management';

export async function createWorkspacePdf(profile: Profile, entries: Entry[], type: ManagementType, chart: HTMLElement | null, advice?: { goals: string; recommendation: string } | null) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);
  const pdf = new jsPDF();
  const total = summarize(entries);
  let y = 20;
  function write(text: string, size = 11) {
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(text, 178);
    for (const line of lines) { if (y > 276) { pdf.addPage(); y = 20; } pdf.text(line, 16, y); y += size * 0.5 + 2; }
    y += 3;
  }
  const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: profile.currency, maximumFractionDigits: 0 }).format(value);
  write(profile.workspace_name, 20);
  write(`${TYPES.find(t => t.id === type)?.label} · ${new Date().toLocaleDateString('es-CO')}`);
  write('Resumen del espacio', 15);
  write(`Registros: ${entries.length} | Completados: ${entries.filter(e => e.status === 'done').length} | Pendientes: ${entries.filter(e => e.status !== 'done').length}`);
  write(`Ingresos: ${money(total.income)} | Gastos: ${money(total.expense)} | Balance: ${money(total.balance)}`);
  if (type === 'store') write(`Inventario: ${total.stock} unidades`);
  if (type === 'projects') write(`Tareas: ${total.completed}/${total.tasks} completadas (${total.tasks ? Math.round(total.completed / total.tasks * 100) : 0}%)`);
  if (chart) {
    const canvas = await html2canvas(chart, { scale: 2, useCORS: true, backgroundColor: null });
    const height = Math.min(95, 178 * canvas.height / canvas.width);
    if (y + height + 16 > 277) { pdf.addPage(); y = 20; }
    write(type === 'projects' ? 'Estado de las tareas' : 'Ingresos y gastos · últimos 6 meses', 14);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 16, y, 178, height); y += height + 12;
  }
  if (advice?.goals) { write('Metas', 15); write(advice.goals); }
  if (advice?.recommendation) { write('Recomendaciones · Lovable AI', 15); write(advice.recommendation); }
  for (const module of MODULES[type]) {
    const rows = entries.filter(e => e.kind === module.kind);
    write(`${module.label} (${rows.length})`, 15);
    if (!rows.length) write('Sin registros.');
    for (const e of rows) {
      write(`${e.title}${module.money ? ` · ${money(e.amount)}` : ''}${module.quantity ? ` · ${e.quantity} unidades` : ''}${module.dated ? ` · ${e.entry_date}` : ''}${module.status ? ` · ${{ pending: 'Pendiente', in_progress: 'En progreso', done: 'Hecho' }[e.status as 'done']}` : ''}`);
      if (e.detail) write(e.detail, 10);
    }
  }
  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { pdf.setPage(i); pdf.setFontSize(9); pdf.text(`Mi espacio · ${i} / ${pages}`, 16, 289); }
  return pdf.output('blob');
}

export function downloadPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'informe-mi-espacio.pdf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}