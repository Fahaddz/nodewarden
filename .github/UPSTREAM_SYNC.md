# Upstream sync safety

`Upstream Release PR` is the only workflow allowed to prepare upstream updates.
It follows the latest published NodeWarden release by default and never pushes to
`main`. A manual run may select another upstream tag or a full commit SHA, but
the commit must be part of `shuaiplus/NodeWarden`'s `main` history.

If Git reports a merge conflict, the workflow aborts without pushing code and
opens an issue containing the conflicted paths. Resolve those conflicts locally
and submit the result as a normal pull request. Do not ask an AI reviewer to
choose conflict resolutions for authentication, cryptography, backup, workflow,
or deployment code.

## Required repository settings

Create an active ruleset for the default branch in **Settings > Rules > Rulesets**:

- Require a pull request before merging.
- Block branch deletion and force pushes.
- Require `Build and validate`, both CodeQL jobs, Gitleaks, OSV, npm audit,
  Semgrep, actionlint, and zizmor.
- Require conversations to be resolved and dismiss stale approvals.
- Do not grant Actions or the sync credential a bypass.

The AI review is advisory and should not be a required check. A provider outage
must not encourage bypassing deterministic checks or human review.

`PR_BOT_TOKEN` should be a fine-grained token restricted to this repository with
only **Contents: read/write** and **Pull requests: read/write**. A dedicated,
short-lived GitHub App token is preferable when available. Rotate the token if it
has ever been stored outside GitHub Actions secrets.
