# Pokémon Master Pokédex

A small, offline friendly Pokédex for browsing Pokémon, tracking your catches, and keeping notes about your collection. The interface is available in English and Portuguese and works as an installable Progressive Web App.

## What it does

- Browse Pokémon in a responsive card grid or sortable table.
- Search by name, filter by type, and show only Pokémon you have caught.
- Mark Pokémon as caught, record notes, and review your personal deck.
- Track collection progress and export or share your Pokédex as CSV.
- Keep your catch records in browser storage and reuse cached data offline.

## Built with

- React 18, TypeScript, Vite, and Tailwind CSS
- TanStack Query for data fetching and caching
- Express and TypeScript API, backed by the public [PokéAPI](https://pokeapi.co/)
- IndexedDB and Vite PWA for persistent, offline capable use

## Run locally

Use Node.js and npm, then install the workspace dependencies from the project root:

```sh
npm install
```

Start the API and frontend in separate terminals:

```sh
npm run dev:backend
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). The API listens on port `4000` by default and the frontend reads from `http://localhost:4000/api`.

Optional backend settings can be provided through environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | API listening port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | Upstream PokéAPI base URL |
| `POKEAPI_TIMEOUT_MS` | `8000` | Upstream request timeout |

Set `VITE_API_BASE_URL` in the frontend environment to use a different API URL.

## Useful commands

```sh
npm run build   # Build the backend and frontend
npm test        # Run backend and frontend tests
npm run lint    # Lint both workspaces
```

## Project layout

```text
frontend/   React single-page app and installable PWA
backend/    Express API and PokéAPI adapter
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed codebase guide and [DECISIONS.md](DECISIONS.md) for design decisions.
