# Architecture & Decisions

Reference guide to the codebase layout (*what/where*) plus a log of architectural decisions in a simplified ADR (Architecture Decision Record) format (*why*).

## Project Structure

```
backend/    Express + TS API (Clean/Hexagonal layering)
frontend/   Vite + React 18 SPA (PWA, offline-first Pokédex)
```

### Backend (`backend/src`)

```
interfaces/http/        routes → controllers → middlewares (HTTP boundary)
application/            use-cases + services (orchestration, no framework deps)
domain/                 entities + repository ports (pure business rules)
infrastructure/         repository adapters, HTTP client, env config
shared/                 errors, logger
```

- **`domain/entities/pokemon.entity.ts`** — `Pokemon` shape used across layers.
- **`domain/repositories/pokemon.repository.ts`** — `PokemonRepository` port (interface) that infrastructure adapters implement.
- **`infrastructure/repositories/poke-api.repository.ts`** — concrete adapter calling the public PokéAPI.
- **`application/use-cases/`** — `list-pokemon.use-case.ts`, `get-pokemon-detail.use-case.ts`: single-purpose orchestration, depend only on the repository port.
- **`application/services/pokemon.service.ts`** — composes use-cases for the controllers.
- **`interfaces/http/controllers/pokemon.controller.ts`** — translates HTTP req/res to service calls.
- **`interfaces/http/middlewares/error-handler.middleware.ts`** — maps typed errors (`ValidationError`, `NotFoundError`, `HttpClientError`) to HTTP status codes.
- **`app.ts`** — `createApp()` factory, takes an injected `PokemonService` (enables Supertest integration tests without hitting the real API).

### Frontend (`frontend/src`)

```
app/                    App shell, providers, entry point
features/pokedex/       Core Pokédex feature (list/grid/table/detail/catch)
features/offline/       Network status, PWA update banner, caught-records storage
features/analytics/     (scaffolded, not yet implemented)
shared/                 Cross-feature: components, hooks, i18n, lib, types, utils
test/                   Vitest unit/component tests + mocks
```

#### `app/`
- **`App.tsx`** — wraps the tree in `PersistQueryClientProvider` (React Query cache persisted to IndexedDB) and renders `PokedexDashboard`.
- **`main.tsx`** — React root; imports `shared/i18n/i18n.js` once so translations are initialized app-wide.

#### `features/pokedex/components/`
- **`PokedexDashboard.tsx`** — top-level page: search box, caught-only filter, CSV export, share button, grid/table view toggle, loading state, and wires up the detail modal.
- **`PokemonGrid.tsx`** — virtualized (`@tanstack/react-virtual`), responsive card grid; only renders rows near the viewport.
- **`PokemonCard.tsx`** — single card: sprite, name, caught badge, catch/release button.
- **`PokemonTable.tsx`** — desktop analytical table view with sortable stat columns (HP/Attack/Defense/Speed/Height/Weight).
- **`PokemonDetailModal.tsx`** — full detail dialog: types, stats bars, catch date, and an inline auto-saving notes textarea.
- **`ProgressOverview.tsx`** — banner summarizing catch completion % and per-type breakdown.
- **`MyDeckPage.tsx`** / **`SharedDeckPage.tsx`** — `/deck` (own caught collection) and `/deck/:key` (recipient view of a titled shared deck, see ADR-008) wrappers around `PokedexDashboard`.
- **`SharedPokemonPage.tsx`** — `/share/pokemon/:id` standalone read-only single-Pokémon share page (see ADR-010).
- **`ShareDeckModal.tsx`** — modal used for both deck sharing (`variant: 'deck'`, creates a snapshot via `deckShareApi`) and single-Pokémon sharing (`variant: 'pokemon'`, builds a `/share/pokemon/:id` link with no backend call).

#### `features/pokedex/hooks/`
- **`usePokemonList(limit)`** — React Query `useInfiniteQuery` wrapper fetching the Pokémon list page by page (offset-based), exposing `fetchNextPage`/`hasNextPage` for lazy loading.
- **`usePokemonDetail(name)`** — React Query wrapper fetching one Pokémon's detail (stats/types/sprite), disabled until `name` is set.
- **`usePokemonTableData(entries)`** — batches per-entry detail fetches (via `useQueries`) to supply the numeric stat columns the table view needs.
- **`useFilterSort(entries)`** — combines the filter/sort strategy pattern with local search/sort UI state; returns the derived, filtered+sorted list.
- **`useCaughtRecords.ts`** — low-level React Query hooks backed by the IndexedDB `caughtRecordsStore`: `useCaughtRecords` (read all), `useCatchPokemon`, `useReleasePokemon`, `useReleaseManyPokemon`, `useUpdateNote`, `useUpdateTags` (mutations, each invalidating the caught-records query on success).
- **`usePokedexStorage()`** — single entry point composing all of the above into one ergonomic API (`catch`, `release`, `releaseMany`, `updateNote`, `updateTags`) for components to consume.
- **`useResponsiveColumns()`** — tracks window width and returns the current grid column count, mirroring the Tailwind breakpoints used by `PokemonGrid`.

#### `features/offline/`
- **`components/OfflineStatusBanner.tsx`** — shows an offline banner, an "app ready offline" confirmation, and a "new version available" reload prompt.
- **`hooks/useOnlineStatus()`** — tracks `navigator.onLine` via the `online`/`offline` window events.
- **`hooks/usePwaStatus()`** — wraps `vite-plugin-pwa`'s `useRegisterSW`, exposing `offlineReady`, `needRefresh`, `updateServiceWorker`, and `dismiss`.
- **`services/caught-records.store.ts`** — IndexedDB-backed store for trainer-owned data (caught status, timestamp, notes, tags), kept independent of the React Query cache since it must never be evicted.

#### `shared/`
- **`hooks/useDebounce(value, delayMs?)`** — generic debounce hook, used to delay search-input filtering.
- **`hooks/useTranslations(namespace?)`** — `next-intl`-style wrapper around `react-i18next`'s `useTranslation()`; returns a `t(key, values?)` scoped to the given namespace (e.g. `useTranslations('dashboard')`).
- **`i18n/i18n.ts`** — i18next init (browser language detection, English fallback, `en`/`pt` resources).
- **`i18n/locales/{en,pt}.json`** — all UI copy, namespaced per feature/component (`app`, `dashboard`, `card`, `table`, `detail`, `note`, `progress`, `offline`).
- **`lib/query-client.ts`** — shared `QueryClient` instance.
- **`lib/indexed-db-persister.ts`** — persister adapter so React Query's cache survives reloads/offline via IndexedDB.
- **`components/Modal.tsx`** — generic accessible modal used by `PokemonDetailModal`.

#### `features/pokedex/strategies/`
- **`sort/`** — `SortStrategy` interface + factory (`createSortStrategy`), one strategy per sortable field.
- **`filter/`** — `applyFilters` strategy for search/type/caught-only filtering.
- **`export/`** — `ExporterStrategy` interface with `CSVExporterStrategy` implementation, plus `share.ts` (Web Share API → clipboard → download fallback chain).

#### `features/pokedex/domain/` & `utils/`
- **`domain/pokemon.types.ts`** — `CatalogEntry`, `PokemonDetail`, `PokemonStats`, `CaughtRecord`, `FilterOptions`, `SortOption` types shared across hooks/components.
- **`utils/progress-stats.ts`** — pure function computing caught count/percentage/per-type distribution for `ProgressOverview`.

### Testing (`frontend/src/test/`)

Vitest + React Testing Library. `setup.ts` imports `@testing-library/jest-dom/vitest` and `shared/i18n/i18n.js` (so components render real translated strings, not raw keys, in tests). `mocks/` holds MSW handlers for API-dependent tests.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend build | Vite + React 18 + TS strict | Fast dev server, native ESM, first-class PWA plugin support |
| Styling | Tailwind CSS | Utility-first, pairs well with `prettier-plugin-tailwindcss` for class sorting |
| Server state | TanStack Query v5 | Built-in caching, retries, offline mutation pause/resume |
| Offline persistence | `@tanstack/react-query-persist-client` + `idb` (IndexedDB) | Survives full page reload/offline with no backend dependency |
| PWA | `vite-plugin-pwa` (Workbox) | Precache app shell, runtime-cache PokéAPI + sprites |
| Backend | Express + TS, Clean/Hexagonal layering | Simple, well-understood, easy to test each layer in isolation |
| Backend validation | Manual guard clauses in use-cases (`ValidationError`) | Keeps domain logic framework-agnostic; `zod` reserved for request-shape validation if payloads grow more complex |
| Logging | `pino` / `pino-http` | Structured, low-overhead logging |
| Testing | Vitest + RTL (frontend), Vitest + Supertest (backend), Playwright (E2E) | Consistent test runner across both workspaces |

## Architecture Decision Records

**ADR-001: URL-Based Sharing Strategy**

*Superseded by ADR-008 (deck sharing) and ADR-010 (single-Pokémon sharing). `/pokemon/:id` remains the in-app deep link that opens the detail modal within `PokedexDashboard`, and existing `/deck?ids=...` links remain supported for backward compatibility.*

- **Context**: Requirement to share caught Pokémon and a full "deck" view (the complete caught collection) with other trainers, without adding accounts or a database.
- **Decision**: Use plain URL query/path state — `/pokemon/:id` for a single Pokémon, `/deck?ids=1,3,6,...` (comma-separated, human-readable) for a full deck — rather than a base64 blob or bitmask. `sharePokemonCard`/`shareDeck` (`frontend/src/features/pokedex/strategies/export/share.ts`) build the link and call `navigator.share()` first, falling back to `navigator.clipboard.writeText()`.
- **Consequences**: Enables instant sharing and deep-linking without requiring an external database or backend infrastructure, ensuring fast performance and offline usability. Even large collections (1000+ IDs) stay well under URL length limits and remain debuggable, at the cost of the URL growing linearly with deck size. Rejected alternative: linking out to Bulbapedia — that would take the trainer out of the app and couldn't reflect personal caught/notes state.

**ADR-002: Hexagonal Backend as a Thin Proxy, Not a Database-Backed API**

- **Context**: Backend only needs to expose typed, validated endpoints over the public PokéAPI; no server-side persistence requirement.
- **Decision**: Layer the backend as `interfaces/http` (routes/controllers/middlewares) → `application` (services/use-cases) → `domain` (entities/repository ports, zero outward dependencies) ← `infrastructure` (repository adapters, HTTP client, config). `PokemonRepository` is a port defined in `domain/repositories`; `PokeApiRepository` in `infrastructure` implements it. `createApp()` (`src/app.ts`) takes an injected `PokemonService`, decoupling the Express app from the composition root (`src/index.ts`). Typed errors (`ValidationError`, `NotFoundError`, `HttpClientError`) are mapped to HTTP status codes by a single `error-handler.middleware.ts`.
- **Consequences**: Use-cases are testable in isolation, and Supertest integration tests can inject a fake in-memory repository without hitting the real PokéAPI. Leaves room to swap in a cache/database-backed repository later without touching application logic, at the cost of more boilerplate/indirection than a single-file Express API.

**ADR-003: Two Separate IndexedDB Stores for Server State vs. Trainer State**

- **Context**: The app has two kinds of persisted data with different lifecycles — cacheable PokéAPI responses, and trainer-owned data that must never be evicted.
- **Decision**: Keep `shared/lib/indexed-db-persister.ts` (persists the entire TanStack Query cache: list/detail responses) fully separate from `features/offline/services/caught-records.store.ts` (persists caught status, timestamp, notes, tags directly, independent of the query cache's lifecycle).
- **Consequences**: Trainer data survives cache eviction/garbage-collection since it's never part of the replaceable query cache. Requires maintaining two IndexedDB access paths instead of one, and caught records stay local-only by design (no multi-device sync) — adding cloud sync later would need a backend datastore plus a conflict-resolution/mutation-replay strategy (e.g. TanStack Query's `mutationCache` + `resumePausedMutations`).

**ADR-004: URL Query State for Pagination/Filters, Not a Global State Library**

*The `/deck?ids=...` recipient view described below is the legacy sharing path. New deck links use `/deck/:key` as described in ADR-008.*

- **Context**: Need shareable, bookmarkable, back-button-friendly views (deck, per-Pokémon deep links) without pulling in Redux/Zustand/Context for cross-component state.
- **Decision**: Drive pagination, filters, and the read-only deck view entirely from URL query/path params (`?ids=1,3,6`, `/pokemon/:id`) via React Router's `useSearchParams`.
- **Consequences**: Every view is a shareable link by construction, and there's no separate global-state store that can drift out of sync with the URL. Trade-off: state shape is constrained to what's URL-serializable.

**ADR-005: `react-i18next` Instead of `next-intl`**

- **Context**: Wanted a `next-intl`-style namespaced translation API for familiarity, but this is a Vite SPA, not a Next.js App Router project (where `next-intl` would apply).
- **Decision**: Use `react-i18next` directly, with a custom `useTranslations(namespace)` wrapper (`shared/hooks/useTranslations.ts`) that mimics `next-intl`'s namespace-scoped `t()` API. `shared/i18n/i18n.ts` initializes i18next with browser language detection and English fallback; imported once in `app/main.tsx` and in `test/setup.ts` so tests resolve real translated text.
- **Consequences**: Gets the desired ergonomics without depending on a Next.js-only library, at the cost of one small wrapper hook to maintain.

**ADR-006: Server-Side Search/Type Filtering (AND'd), Client-Side Caught-Only Layer**

- **Context**: Filtering only over locally loaded pages produced wrong "Showing X of Y" totals and stranded "Load More" buttons once a filter (e.g. a single type) matched fewer Pokémon than were already loaded from the unfiltered dex. Filters also need to reset pagination to page 1 and combine via AND (search AND type AND caught), and "caught" status is local-only (IndexedDB), never known to the backend.
- **Decision**: `GET /api/pokemon?limit=&offset=&type=&search=` now applies `type` and `search` server-side, AND'd together across the *entire* dex (`PokeApiRepository.listByType`/`listBySearch`, backed by an in-memory full-roster cache for search-only queries since PokéAPI's `/pokemon` list itself isn't searchable). `usePokemonList(limit, type, search)`'s query key includes both, so changing either resets `useInfiniteQuery` to page 1 automatically. "Caught only" (from the checkbox or forced by My Deck) can't be pushed to the backend, so it's layered on top client-side via `caughtVisibleCount` (starts at `PAGE_SIZE`, +42 per "Load More"): a `caughtNeedsFetch` effect fetches only enough server-filtered pages to satisfy the current visible count, instead of eagerly fetching every matching page up front. Selecting more than one type has no server-side support (PokéAPI's `/type` endpoint doesn't support intersections) and falls back to client-side filtering over the unfiltered dex pages (loaded-so-far total estimate). `debouncedSearch`/`selectedTypes`/`caughtOnly`/`sort` changing all reset `tablePage` and `caughtVisibleCount` to page 1 in one effect. A totals-of-zero result (after settling, i.e. no more pages left to check) renders the "No results" empty state instead of a stranded grid/Load More button.
- **Consequences**: "Showing X of Y" is exact for the common single-filter cases (unfiltered, search-only, type-only, or search+type together), and caught-only combined with those is exact once fully paged through (otherwise an upper-bound estimate via `caughtRecords.length`, the local caught count regardless of filters). Multi-type selection and the true dex-wide total under multi-type-plus-search remain loaded-so-far estimates — a real fix would need a backend endpoint that intersects multiple `/type` rosters.

**ADR-007: Full-Dataset Fetch on Non-Default Sort Change**

- **Context**: The catalog is loaded incrementally (42 items per page, via `useInfiniteQuery`) as the user scrolls/paginates. Sorting `visibleCatalog` (`useFilterSort`) only sorts what's been loaded *so far*, so picking a non-default preset like Name A-Z or Highest Attack silently re-ordered whatever handful of pages happened to be in memory, not the true first 42 of the full 1,351-entry (or filtered-subset) sorted list. The default `id-asc` sort happens to match the backend's natural load order, so it never showed the bug. A first pass fixed the sort correctness (fetching the full dataset before sorting) but still rendered the *entire* sorted dataset in the grid at once instead of paginating it — a regression, since the grid used to rely implicitly on the network only having 42 loaded at a time to cap what was displayed.
- **Decision**: `PokedexDashboard`'s sort/filter effect (`frontend/src/features/pokedex/components/PokedexDashboard.tsx`) resets `tablePage`/`gridVisibleCount` to page 1 on every sort/filter change as before, but now also detects a non-default sort (`sort.field !== 'id' || sort.direction !== 'asc'`) and, if `hasNextPage`, drives `fetchNextPage()` in a loop (tracked via `hasNextPageRef` to always read the latest paging state) until every page of the active filtered dataset is loaded, gating the view behind `isSortLoading`. Only once the full dataset is loaded does `useFilterSort` sort it. Display pagination is then handled independently: `gridVisibleCount` (generalized from the old caught-only-only `caughtVisibleCount`) always caps how many *already-sorted* entries the grid renders (`visibleCatalog.slice(0, gridVisibleCount)`), regardless of whether the full dataset or just one lazy page has been loaded, and "Load More" simply grows `gridVisibleCount` by `PAGE_SIZE` — fetching further backend pages only if `gridNeedsFetch` finds the request has outpaced what's loaded so far.
- **Consequences**: Non-default sorts are now correct against the entire matching dataset instead of an arbitrary loaded-so-far subset, and the grid/table still show only `PAGE_SIZE` (42) items per page — a fully-loaded sorted dataset no longer dumps all 1,351 entries onto the screen. Cost: an up-front burst of page fetches (up to ~33 requests for the full unfiltered dex) whenever a non-default sort is first applied, shown via a full-screen loading state. The default `id-asc` sort remains lazy/incremental with no extra fetching.

**ADR-008: Titled Deck Snapshots Behind In-Memory Keys**

- **Context**: A trainer needs to name a deck (for example, “Leonor's deck”) and give another app user a short link to the Pokémon they caught. Caught records live only in the trainer's browser, so the recipient cannot read them directly. Encoding every ID in the URL also makes the link grow with the collection.
- **Decision**: My Deck's Share Deck action opens `ShareDeckModal` (`variant: 'deck'`, the default) with a title input. On submit, `deckShareApi.create(title, pokemonIds)` sends the title and all locally caught Pokémon IDs to `POST /api/decks`. `DeckShareService` (`backend/src/application/services/deck-share.service.ts`) validates the input (title 1-80 chars; `pokemonIds` a nonempty, ≤2000-item list of unique positive integers), resolves those IDs to `PokemonSummary`s by paging through the existing `PokemonService.list()` until every ID is matched (throwing `ValidationError` if any ID is unknown), and stores the resulting `SharedDeck` (`key`, `title`, `pokemon[]`) under a cryptographically random 16-byte hex key in a process-local `Map`. `GET /api/decks/:key` returns the stored snapshot or a `NotFoundError`. The frontend exposes `/deck/:key`; the modal shows that URL for copying (`navigator.clipboard.writeText`) or sharing (`navigator.share` first, clipboard fallback, via `shareDeck()`). A recipient's `SharedDeckPage` (`GET /api/decks/:key`) renders the saved title and Pokémon list read-only, via `PokedexDashboard`'s `sharedDeckIds` prop, without using the recipient's local catch records — that same prop backs the legacy `MyDeckPage` (`/deck?ids=...`) recipient path from ADR-001. `TopBar` reads the last-viewed shared deck title from `shared-deck-title.store.ts` to link back to it.
- **Consequences**: Links stay short and show the collection as it was when shared, even if the creator later catches or releases Pokémon. Creation fetches the Pokémon roster to resolve and validate IDs. Shares disappear when the API process restarts and are not available across multiple API instances; durable or scaled sharing will require a shared persistent store. Anyone with a valid link can view its deck.

**ADR-010: Read-Only Single-Pokémon Share Links Without a Backend Round-Trip**

- **Context**: Sharing one caught Pokémon (from `PokemonCard` or `PokemonDetailModal`) doesn't need a server-stored snapshot the way a multi-Pokémon deck does — the recipient only needs to look up that Pokémon's own already-public data, and PokéAPI already serves it.
- **Decision**: `ShareDeckModal`'s `variant: 'pokemon'` skips the create-deck form entirely and immediately builds a `/share/pokemon/:id` link client-side (zero-padded ID, no backend call). That route renders `SharedPokemonPage`, which re-fetches the Pokémon's detail via the normal `usePokemonDetail`/`useCaughtRecords` hooks (same PokéAPI-backed data everyone can already read) and displays it read-only with its own retro card styling, independent of the recipient's local caught state. This is distinct from the in-app `/pokemon/:id` deep link (ADR-001), which opens the detail modal inside the trainer's own `PokedexDashboard`.
- **Consequences**: Single-Pokémon sharing has no server state to expire or scale, and the link works forever since it's just a public dex ID. Trade-off: two different single-Pokémon URL shapes now exist (`/pokemon/:id` in-app modal vs. `/share/pokemon/:id` standalone read-only page) for different purposes, which must stay documented to avoid confusion.

**ADR-009: Full-Screen Catch-Up Loader for My Deck's Dex-Ordered Pagination**

*Superseded for My Deck by ADR-016: local catch snapshots now provide its entries without scanning the API roster.*

- **Context**: My Deck (`forceCaughtOnly`) reuses the same dex-number-ordered, 42-per-page backend pagination as the general grid (see ADR-006). A Pokémon caught near the end of the dex (e.g. #900) only shows up once every earlier page has been background-fetched via `gridNeedsFetch`. Until then the grid rendered nothing but the "Load More" footer button — no visible loading indicator — making a legitimately caught Pokémon look missing from the deck entirely rather than merely still loading.
- **Decision**: `PokedexDashboard` computes `isDeckCatchingUp` (My Deck view, no entries loaded yet, and a background page fetch is pending) and renders the existing `RetroLoader` full-area overlay (already used for `isSortLoading`, see ADR-007) over the grid/table while it's true, with a new `dashboard.loadingDeck` translation string. `showNoResults` is also gated off during this state so it isn't misread as a zero-match empty state. The table's own page-jump loader (`isJumpingPage`, driving `PokemonTable`'s `isLoadingNext`) had the same gap for rows-per-page changes: switching page size (e.g. 42 → 20) recomputed `tableEntries` immediately from whatever was already loaded, so a page size larger than the loaded/filtered count briefly rendered a truncated table before the background fetch caught up. The fetch-and-wait logic from `handleGoToTablePage` was extracted into a shared `ensureTableEntriesLoaded(targetPage, pageSize)`, used by both page navigation and `handleTablePageSizeChange`, so a page-size change now also triggers the jump loader whenever it needs more rows than are currently loaded.
- **Consequences**: My Deck now shows an explicit loading state instead of an empty-looking grid while it pages through the dex to locate caught Pokémon, and changing the table's rows-per-page no longer flashes a short/truncated page while more rows are fetched in the background. The underlying fetch cost/order is unchanged (still sequential page-by-page from offset 0); a future backend endpoint to fetch by specific IDs would remove the need to catch up at all.

**ADR-011: Surface Infinite-Scroll Fetch Failures Instead of Retrying Silently**

- **Context**: `PokedexDashboard`'s auto-fetch effect calls `fetchNextPage()` whenever `gridNeedsFetch && !isFetchingNextPage` (see ADR-007/ADR-009). A failed page fetch (e.g. a brief network drop) still leaves `gridNeedsFetch` true and `isFetchingNextPage` false once the request settles, so the effect re-fired `fetchNextPage()` immediately, looping silently without ever informing the trainer.
- **Decision**: Destructure `isError`/`error` from `usePokemonList`'s `useInfiniteQuery` result, add `!isError` to the auto-fetch effect's guard so a failed fetch stops the retry loop, and render a "Failed to load more Pokémon" message with a manual `Retry` button (calling `fetchNextPage()` again) below the grid/table whenever `isError` is true.
- **Consequences**: A dropped page fetch now surfaces to the user with a clear retry action instead of hammering the network in a silent loop. Retrying is manual (no exponential backoff/auto-retry) — acceptable since React Query's own default retry/backoff already runs before `isError` becomes true.

**ADR-012: Only 404s Map `findByName` to `null`, Not All Errors**

- **Context**: `PokeApiRepository.findByName` wrapped its PokéAPI call in a bare `catch { return null; }`, so an upstream timeout or 500 was indistinguishable from a genuine "no such Pokémon" — both surfaced to clients as a 404 `NotFoundError` instead of the 502/503 an upstream failure should produce.
- **Decision**: `findByName` now inspects the caught error: if it's an `HttpClientError` with `status === 404`, it still returns `null` (a real miss); any other error (other statuses, timeouts, network failures) is rethrown so `error-handler.middleware.ts`'s existing `HttpClientError` branch maps it to 502 as designed.
- **Consequences**: Clients now get an accurate distinction between "Pokémon doesn't exist" (404) and "upstream PokéAPI is unavailable" (502/503), matching what `error-handler.middleware.ts` already supports.

**ADR-013: Focus Trap & Restoration in `Modal`**

- **Context**: `Modal.tsx` handled Escape-to-close and overlay-click-to-close, but never managed keyboard focus. Tabbing from an open modal moved focus into the hidden background page instead of staying inside the dialog, and focus wasn't returned anywhere on close — both violate WCAG 2.1.2 (No Keyboard Trap) expectations for a proper modal dialog.
- **Decision**: On mount, `Modal` captures `document.activeElement` (the triggering element) and moves focus to the dialog's first focusable element (falling back to the close button ref) via a `querySelectorAll(FOCUSABLE_SELECTOR)` scoped to the dialog content ref. A `keydown` listener traps `Tab`/`Shift+Tab` cycling between the first and last focusable elements found inside the dialog at the time of the keypress. On unmount, focus is restored to the captured trigger element.
- **Consequences**: Keyboard users can no longer tab out of an open modal into hidden background content, and focus returns to the button/element that opened it once closed, matching expected modal dialog a11y behavior. The focusable-elements query re-runs per Tab keypress rather than being memoized, an acceptable cost given typical modal sizes.

**ADR-014: Live Region Announcements for Loading/Empty States**

- **Context**: `RetroLoader` (blocking fetch overlay) and `EmptyDeckState` (empty deck / zero search results) rendered purely visual state changes with no ARIA live region, so screen reader users got no feedback when a loading state appeared or a search settled on zero results.
- **Decision**: Add `role="status"` and `aria-live="polite"` to both components' root elements, so assistive tech announces the loader's label and the empty-state title/subtitle as they render, without interrupting the user's current focus (as `aria-live="assertive"` would).
- **Consequences**: Screen reader users now hear loading and zero-result state changes as they happen. No visual/behavioral change for sighted users.

**ADR-015: Debounce Search Keystrokes Locally, Memoize Grid/Table/Card Components**

- **Context**: `PokedexDashboard` held the raw search input value in state, so every keystroke re-rendered the whole dashboard tree — including `PokemonGrid`/`PokemonTable` and every card — even though the actual filtering only reacts to a debounced value 300ms later.
- **Decision**: `PokedexToolbar` now owns the raw keystroke value as local state and debounces it internally (`useDebounce`), only calling `onSearchChange` once typing settles; `PokedexDashboard`'s `search` state is therefore already-debounced and no longer runs a second `useDebounce` pass. `PokemonGrid`, `PokemonTable`, `PokemonCard`, and `RetroPokemonCard` are now wrapped in `React.memo`.
- **Consequences**: Typing in the search box only re-renders `PokedexToolbar` locally per keystroke; the grid/table/cards re-render just once, after the debounce window, when the resolved search value actually changes. `React.memo` on the card/grid/table components also skips re-renders when parent re-renders pass equal props (e.g. unrelated dashboard state changes).

## Known Gaps / Deferred Decisions

- `CatalogEntry` currently only carries `PokemonSummary` fields (id, name, sprite) plus local caught/notes data — it does **not** yet include `height`/`types` from the detail endpoint. The `height` sort strategy is a placeholder (`IdSortStrategy`) until list-with-details or a batched detail fetch is implemented.
- The table's "stats" column sums a partial base stat total (`hp + attack + defense + speed` in `usePokemonTableData`, excluding sp-attack/sp-defense), not the true Pokémon BST.
- Per-type breakdown totals ("BUG - 0/6") use `GET /api/pokemon/types/:type/count` (backend proxies PokéAPI's `/type/:name`) via a frontend `useTypeTotals(types)` hook, falling back to the loaded-entries count if the real total hasn't resolved yet.
- The type filter's checkbox list (`PokedexToolbar`) is sourced from the static `typeColors` map (`shared/styles/colors.ts`), covering all 18 canonical types up front — not derived from `catalog`/loaded entries, which would only surface types seen in pages fetched so far (e.g. Dragon/Rock missing until enough pages loaded).
- Selecting more than one type at once still falls back to client-side filtering over the unfiltered dex (see ADR-006) — no backend support for intersecting multiple `/type` rosters yet.

**ADR-016: Offline Catch Snapshots and Visible Catch Dates**

- **Context**: A caught Pokémon near the end of the roster could disappear from My Deck offline because the query cache keeps only the first list page. The table also hid catch dates in a hover tooltip.
- **Decision**: Store the Pokémon name and sprite URL with each local catch record, and merge those records into My Deck independently of API pagination. Preserve that metadata when notes or tags change. Cache successful Pokémon API responses in the service worker for previously viewed details. Show catch dates directly in table cells.
- **Consequences**: My Deck can list caught Pokémon after reload when the API is unavailable. Records saved before this change may show their numeric ID until their detail becomes available. Details never viewed before going offline still require a connection.

**ADR-017: PWA Icons**

- **Context**: The PWA manifest referenced icon files that were missing.
- **Decision**: Add 192px and 512px Pokéball icons and a matching SVG favicon.
- **Consequences**: The manifest now points to real assets without adding a package dependency.
