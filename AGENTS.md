# GitHub personal profile

`README.md` renders Andrew's profile at `github.com/ADWilkinson`. There is no application runtime; one generator redraws parts of the profile.

- `scripts/voyage.ts` (Bun) reads public records only: the `#voyage-log` and `#voyage-activity` JSON embedded in the andrewwilkinson.io home page, `andrewwilkinson.io/metrics.json` and public GitHub repository data. It renders `assets/voyage-{wide,narrow}-{dark,light}.svg` (the engraved galleon from the site's `site/ship.ts`, one wake mark per ship record) and rewrites every `<!-- v:NAME -->...<!-- /v:NAME -->` block in the README. `scripts/voyage.config.json` holds this profile's name, lines and lanes. A failed source exits non-zero without writing.
- `.github/workflows/refresh-profile.yml` runs it daily and commits only when the output changed. Run `bun scripts/voyage.ts` after editing marker blocks; edit copy outside the markers by hand.
- The same `voyage.ts` lives in `galleonlabs/.github`; keep the two copies identical. Figures come from the published metrics record already rounded; never type a figure into the README by hand.
- `assets/fonts/JetBrainsMono.woff2` is embedded in the SVGs under the SIL OFL (`assets/fonts/OFL.txt`).

- Edit public profile copy in `README.md`; product setup and operational instructions belong in their own repos.
- `.github/workflows/link-check.yml` owns the link validator, host exclusions and weekly schedule. Run it with `gh workflow run link-check.yml` for an explicit live check, then inspect that run's result.
- Check current product descriptions against their source repositories. In the personal workspace, website source is `personal-website/agent-site/`, with product pages in `agent-site/content/work/` and the project list in `agent-site/bio/02-projects.md`. galleonlabs.io now redirects to andrewwilkinson.io, so `galleonlabs.io/lib/work.ts` is no longer the current catalog. The public profile is a summary of those sources.

## Code Review Rules

Automatic pull-request reviewers (Codex code review, Bugbot or similar) follow these rules.

- Report as P1 any personal data that shouldn't be public, a funds, volume or user figure that its source repository doesn't support, and a link to a retired or wrong domain. Leave dead-link detection to `link-check.yml`.
