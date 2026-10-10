# Manga & Anime

Browse, track and discover anime and manga, powered by the [AniList](https://anilist.co) GraphQL API. Built with Next.js (App Router) and React.

## Features

- **Home & Browse**: trending, seasonal and top-rated rows; filters for genre, type, season, year, format and status, with infinite scroll.
- **Title pages**: synopsis, trailer, cast with voice actors, relations, recommendations and a live airing countdown. The most popular titles are prerendered, and every title gets a generated share image.
- **Character & staff pages**: biographies (spoilers blurred), appearances and roles.
- **Quick search**: press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> or <kbd>/</kbd> to search anime, manga, characters and staff.
- **Airing schedule**: episodes airing this week, shown in your local timezone.
- **My List & Stats**: track status, progress and score, with optimistic updates, plus charts of your genres, scores and watch time.
- **AniList login or guest mode**: log in with AniList to sync your list, or use the app without an account. Guest lists are stored in the browser and can be imported into AniList after logging in.
- Light and dark themes, keyboard-accessible dialogs and selects.

## Getting started

1. Create an AniList API client at <https://anilist.co/settings/developer>. Set the redirect URL to `http://localhost:3000/api/auth/callback/anilist`.
2. Copy `.env.example` to `.env.local` and fill in the values:

   | Variable | Description |
   | --- | --- |
   | `NEXT_PUBLIC_APP_URL` | Public base URL of the app (used for OAuth redirects and share images) |
   | `NEXT_PUBLIC_ANILIST_CLIENT_ID` | AniList client ID |
   | `ANILIST_CLIENT_SECRET` | AniList client secret (server only) |

3. Install the dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

Then open <http://localhost:3000>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit tests (Vitest) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build on every push and pull request.

## Project layout

```
app/          routes (pages, API route handlers, OG images)
components/   UI components, grouped by feature (browse, my-list, schedule, stats, people)
lib/          AniList client, auth, list stores and hooks, pure helpers
tests/        unit tests for the helpers in lib/
```

List data goes through a `ListStore` interface (`lib/list-store.ts`) with two implementations: AniList (`/api/media-list`) and the guest list in `localStorage` (`lib/local-list-store.ts`). The UI uses the hooks in `lib/use-list.ts` and doesn't need to know which store is active.

> **Note:** in `next dev` on Windows, generated share images (`/media/[id]/opengraph-image`) can fail with "Input buffer contains unsupported image format". They render correctly in production builds (`npm run build && npm start`).
