# GitHub personal profile

`README.md` renders Andrew's profile at `github.com/ADWilkinson`. This repo has no application, build or deployment runtime.

- Edit public profile copy in `README.md`; product setup and operational instructions belong in their own repos.
- `.github/workflows/link-check.yml` owns the link validator, host exclusions and weekly schedule. Run it with `gh workflow run link-check.yml` for an explicit live check, then inspect that run's result.
- Check current product descriptions against their source repositories. In the personal workspace, website source is `personal-website/agent-site/`, with product pages in `agent-site/content/work/` and the project list in `agent-site/bio/02-projects.md`. galleonlabs.io now redirects to andrewwilkinson.io, so `galleonlabs.io/lib/work.ts` is no longer the current catalog. The public profile is a summary of those sources.

## Code Review Rules

Automatic pull-request reviewers (Codex code review, Bugbot or similar) follow these rules.

- Report as P1 any personal data that shouldn't be public, a funds, volume or user figure that its source repository doesn't support, and a link to a retired or wrong domain. Leave dead-link detection to `link-check.yml`.
