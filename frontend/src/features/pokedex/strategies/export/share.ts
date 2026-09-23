import { downloadExport, type ExporterStrategy } from './csv-exporter.strategy.js';
import type { CatalogEntry } from '../../domain/pokemon.types.js';

export interface ShareResult {
  method: 'share' | 'clipboard' | 'download';
}

export interface PokemonShareResult {
  method: 'share' | 'clipboard';
}

// Shares a deep-link to a single Pokémon, falling back to a clipboard copy when the
// Web Share API is unavailable or the user's browser blocks file/text sharing.
export async function sharePokemonCard(entry: {
  id: number;
  name: string;
}): Promise<PokemonShareResult> {
  const url = `${window.location.origin}/pokemon/${String(entry.id).padStart(3, '0')}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: entry.name, text: entry.name, url });
      return { method: 'share' };
    } catch (error) {
      // AbortError means the user cancelled the share sheet; treat as handled, not a failure.
      if (error instanceof Error && error.name === 'AbortError') {
        return { method: 'share' };
      }
    }
  }

  await navigator.clipboard.writeText(url);
  return { method: 'clipboard' };
}

// Shares exported Pokédex data via the Web Share API, falling back to clipboard copy,
// then to a file download when neither sharing nor clipboard access is available.
export async function sharePokedexExport(
  strategy: ExporterStrategy,
  entries: CatalogEntry[],
  filename: string,
): Promise<ShareResult> {
  const content = strategy.export(entries);
  const fullFilename = `${filename}.${strategy.fileExtension}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([content], fullFilename, { type: strategy.mimeType });
    const canShareFile =
      typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });

    try {
      if (canShareFile) {
        await navigator.share({ files: [file], title: filename });
      } else {
        await navigator.share({ text: content, title: filename });
      }
      return { method: 'share' };
    } catch (error) {
      // AbortError means the user cancelled the share sheet; treat as handled, not a failure.
      if (error instanceof Error && error.name === 'AbortError') {
        return { method: 'share' };
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
      return { method: 'clipboard' };
    } catch {
      // Fall through to the download fallback below.
    }
  }

  downloadExport(strategy, entries, filename);
  return { method: 'download' };
}
