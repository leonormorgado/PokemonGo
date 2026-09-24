import { downloadExport, type ExporterStrategy } from './csv-exporter.strategy.js';
import type { CatalogEntry } from '../../domain/pokemon.types.js';

export interface ShareResult {
  method: 'share' | 'clipboard' | 'download';
}

export interface PokemonShareResult {
  method: 'share' | 'clipboard';
}

/**
 * Shares a deep-link to a single Pokémon, falling back to a clipboard copy when the
 * Web Share API is unavailable or the user's browser blocks file/text sharing. The deep
 * link opens this app's own detail modal (with the trainer's caught status/notes),
 * rather than a third-party page with no knowledge of the user's local Pokédex state.
 */
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

/** Shares a server-created deck link, falling back to clipboard copy. */
export async function shareDeck(url: string, title: string): Promise<PokemonShareResult> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
      return { method: 'share' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { method: 'share' };
      }
    }
  }

  await navigator.clipboard.writeText(url);
  return { method: 'clipboard' };
}

/**
 * Shares exported Pokédex data via the Web Share API, falling back to clipboard copy,
 * then to a file download when neither sharing nor clipboard access is available.
 * Three-tier fallback chain instead of a single method, since Web Share/clipboard support
 * varies widely across browsers and a file download is the one option that always works.
 */
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
