import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressOverview } from '../features/pokedex/components/ProgressOverview.js';
import type { CatalogEntry } from '../features/pokedex/domain/pokemon.types.js';

const entries: CatalogEntry[] = [
  { id: 1, name: 'bulbasaur', sprite: null, caught: true, caughtAt: '2024-01-01T00:00:00.000Z', notes: '', tags: [], types: ['grass', 'poison'] },
  { id: 2, name: 'charmander', sprite: null, caught: false, caughtAt: null, notes: '', tags: [], types: ['fire'] },
  { id: 3, name: 'squirtle', sprite: null, caught: false, caughtAt: null, notes: '', tags: [], types: ['water'] },
];

describe('ProgressOverview', () => {
  it('renders overall caught count and percentage', () => {
    render(<ProgressOverview entries={entries} />);

    expect(screen.getByText('Caught: 1 / 3')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('renders a per-type breakdown', () => {
    render(<ProgressOverview entries={entries} />);

    expect(screen.getByText('grass', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText(/1 \/ 1/)).toHaveLength(2);
  });

  it('handles an empty catalog without crashing', () => {
    render(<ProgressOverview entries={[]} />);

    expect(screen.getByText('Caught: 0 / 0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
