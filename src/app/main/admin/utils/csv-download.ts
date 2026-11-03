/** Export CSV renvoyé par le backend (admin/utils/csv-export.ts). */
export interface CsvExport {
  filename: string;
  mimeType: string;
  /** Contenu complet (BOM UTF-8 + séparateur « ; », lisible par Excel). */
  content: string;
  recordCount: number;
  generatedAt: string;
}

/** Enregistre l'export sur le poste de l'administrateur. */
export function downloadCsv(file: CsvExport | null | undefined): void {
  if (!file?.content) return;
  const blob = new Blob([file.content], { type: file.mimeType || 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename || 'export.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
