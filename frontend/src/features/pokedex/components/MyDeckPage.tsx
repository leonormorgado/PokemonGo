import { useSearchParams } from 'react-router-dom';
import { PokedexDashboard } from './PokedexDashboard.js';

export function MyDeckPage() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids');
  const sharedDeckIds = idsParam
    ? idsParam
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id))
    : null;

  return <PokedexDashboard forceCaughtOnly sharedDeckIds={sharedDeckIds} />;
}
