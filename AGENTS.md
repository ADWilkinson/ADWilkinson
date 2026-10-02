# GitHub personal profile

`README.md` renders Andrew's profile at `github.com/ADWilkinson`. This repo has no application, build or deployment runtime.

- Edit public profile copy in `README.md`; product setup and operational instructions belong in their own repos.
- `.github/workflows/link-check.yml` owns the link validator, host exclusions and weekly schedule. Run it with `gh workflow run link-check.yml` for an explicit live check, then inspect that run's result.
- Check current product descriptions against their source repositories. In the personal workspace, website source is `personal-website/agent-site/`; Galleon's product catalog is `galleonlabs.io/lib/work.ts`. The public profile is a summary of those sources.
