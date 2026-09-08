# jub0t.github.io

Showcase site for [Concat](https://github.com/jub0t/Concat), the free, open-source CapCut replacement.

Built with [Astro](https://astro.build), Tailwind CSS v4 and MDX. Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview
```

Star count, release version and download links are fetched from the GitHub API at build time (`src/lib/github.ts`), with hard-coded fallbacks if the API is unreachable. Re-run the deploy workflow (or push) to refresh them.

Copy and section data live in `src/data/site.ts`.
