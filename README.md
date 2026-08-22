# FreeFit

Personalized strength training — recovery, equipment, and progressive overload. Fitbod-style web app you can host on GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Your data

Workouts, custom exercises, and settings live in **this browser** (`localStorage`). They are not stored on GitHub.

**You → Backup** exports a JSON file. Import it on another phone or after clearing the site.

## GitHub Pages

1. Repo **Settings → Pages → GitHub Actions**
2. Push to `main` (workflow: `.github/workflows/pages.yml`)
3. Site: `https://ecpryze.github.io/freefit/`

Local static build:

```bash
npm run build:pages
```

Output is `.output/public`.

Strava OAuth needs a server, so it will not work on Pages. Everything else does.

## Stack

TanStack Start, React, Tailwind, Zustand.
