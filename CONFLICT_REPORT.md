Upstream changed its `.github/` directory. The application sync was stopped before creating or updating a PR.

- Reviewed tree: `effdc2afdbd8f17d875472d04633540a949f4261`
- Current tree: `f18773f4ea4c1e47340d1949ee747510024737c0`
- Upstream commit: `cb871095c1e348b8f784492cf0e479d124142f8b`

Nothing from upstream `.github/` was imported. Audit the workflow changes, selectively update this fork's stronger checks if useful, then update `.github/UPSTREAM_AUTOMATION_TREE` through a protected PR.

Changed upstream automation paths:
- `M	dependabot.yml`
