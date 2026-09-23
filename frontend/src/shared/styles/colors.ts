// shared/styles/colors.ts

/**
 * Custom retro palette derived from Japanese vintage Pokémon artwork & posters.
 */
export const colors = {
  // Base Palette Tokens
  inkBlack: '#241F1A',           // Dark retro charcoal ink for text, borders, and shadows
  goldenMimikyuCream: '#FFFACF', // Warm vintage paper/canvas background
  dustyCherryPink: '#E8B6BC',    // Muted Japanese cherry blossom pink
  verdigrisTeal: '#80BAB0',      // Muted retro teal
  mutedLilacSepia: '#DEBAEA',    // Vintage lavender/sepia background
  nightfallSlate: '#383332',     // Dark charcoal slate

  // Accents & Gauges
  rustRedAccent: '#DE623C',      // Terracotta red accent / caught status
  vibrantJade: '#00BACC',         // Deep teal/cyan accent
  fadedJadeGreen: '#7AB605',     // Retro stats gauge green
  paleBlushRose: '#E8B6BC',
  agedSepiaBeige: '#DEBAEA',
  charcoalSilverGrey: '#DEBDCE',
  deepOliveBrown: '#4A443F',     
} as const;

export type ColorName = keyof typeof colors;

/**
 * Retro badge colors for Pokémon elemental types (PokeAPI lowercase type names).
 * High-contrast tones designed to fit retro/neubrutalist card borders.
 */
export const typeColors: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#DEBDCE', text: '#241F1A' },
  fire: { bg: '#DE623C', text: '#FFFACF' },
  water: { bg: '#80BAB0', text: '#241F1A' },
  electric: { bg: '#F0D64C', text: '#241F1A' },
  grass: { bg: '#7AB605', text: '#241F1A' },
  ice: { bg: '#9DE3E3', text: '#241F1A' },
  fighting: { bg: '#C9522E', text: '#FFFACF' },
  poison: { bg: '#E8AEEC', text: '#241F1A' },
  ground: { bg: '#DEBAEA', text: '#241F1A' },
  flying: { bg: '#B6C6E8', text: '#241F1A' },
  psychic: { bg: '#E8AEEC', text: '#241F1A' },
  bug: { bg: '#A6C948', text: '#241F1A' },
  rock: { bg: '#C9B26A', text: '#241F1A' },
  ghost: { bg: '#8E7CC3', text: '#FFFACF' },
  dragon: { bg: '#6C5CE7', text: '#FFFACF' },
  dark: { bg: '#5A4A42', text: '#FFFACF' },
  steel: { bg: '#B6C0C9', text: '#241F1A' },
  fairy: { bg: '#F4C2E0', text: '#241F1A' },
};

export const DEFAULT_TYPE_COLOR = { bg: '#DEBDCE', text: '#241F1A' };