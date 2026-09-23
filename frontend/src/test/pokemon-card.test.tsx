import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokemonCard } from '../features/pokedex/components/PokemonCard.js';
import type { CatalogEntry } from '../features/pokedex/domain/pokemon.types.js';

const baseEntry: CatalogEntry = {
  id: 1,
  name: 'bulbasaur',
  sprite: 'bulbasaur.png',
  caught: false,
  caughtAt: null,
  notes: '',
  tags: [],
  types: ['grass', 'poison'],
};

describe('PokemonCard', () => {
  it('renders the name and no caught badge when not caught', () => {
    render(<PokemonCard entry={baseEntry} onToggleCaught={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText('bulbasaur')).toBeInTheDocument();
    expect(screen.queryByText('Caught')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Catch' })).toBeInTheDocument();
  });

  it('shows the caught badge and release action when caught', () => {
    render(<PokemonCard entry={{ ...baseEntry, caught: true }} onToggleCaught={vi.fn()} onSelect={vi.fn()} />);

    expect(screen.getByText('Caught')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Release' })).toBeInTheDocument();
  });

  it('calls onSelect when the Pokémon name/image is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<PokemonCard entry={baseEntry} onToggleCaught={vi.fn()} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'View details for bulbasaur' }));

    expect(onSelect).toHaveBeenCalledWith(baseEntry);
  });

  it('calls onToggleCaught when the catch/release button is clicked', async () => {
    const onToggleCaught = vi.fn();
    const user = userEvent.setup();
    render(<PokemonCard entry={baseEntry} onToggleCaught={onToggleCaught} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Catch' }));

    expect(onToggleCaught).toHaveBeenCalledWith(baseEntry);
  });
});
