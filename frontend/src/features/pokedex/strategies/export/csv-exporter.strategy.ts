import type { CatalogEntry } from '../../domain/pokemon.types.js';

export interface ExporterStrategy {
  export(entries: CatalogEntry[]): string;
  mimeType: string;
  fileExtension: string;
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class CSVExporterStrategy implements ExporterStrategy {
  mimeType = 'text/csv';
  fileExtension = 'csv';

  export(entries: CatalogEntry[]): string {
    const header = ['id', 'name', 'caught', 'caughtAt', 'notes', 'tags'];
    const rows = entries.map((entry) =>
      [
        String(entry.id),
        entry.name,
        String(entry.caught),
        entry.caughtAt ?? '',
        entry.notes,
        entry.tags.join('|'),
      ]
        .map(escapeCsvValue)
        .join(','),
    );

    return [header.join(','), ...rows].join('\n');
  }
}

export function downloadExport(strategy: ExporterStrategy, entries: CatalogEntry[], filename: string): void {
  const content = strategy.export(entries);
  const blob = new Blob([content], { type: strategy.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${strategy.fileExtension}`;
  link.click();
  URL.revokeObjectURL(url);
}
