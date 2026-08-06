# Upstream sync safety

`Upstream Main PR` is the only workflow allowed to prepare upstream updates. It
follows `shuaiplus/NodeWarden`'s current `main` head in one rolling review PR and
never pushes to this fork's `main`. A manual run may select an upstream release
tag or full commit SHA, but the commit must be part of upstream `main` history.
The sync branch always restores this fork's entire `.github/` directory from
`main`, so an upstream commit cannot replace trusted workflows, review scripts,
or repository policy files inside a same-repository pull request.
Before any application sync, the workflow also compares upstream's `.github/`
tree with the reviewed value in `.github/UPSTREAM_AUTOMATION_TREE`. A change
stops the sync and opens a security-review issue. After selective review, update
the baseline through a protected PR; never copy upstream automation wholesale.

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

The AI review assigns a 0-100 risk score. It can formally approve only when all
deterministic checks pass, the complete diff was reviewed, DeepSeek rates it low
risk, and no sensitive paths or patterns are present. Sensitive and high-risk
updates remain manual. A qualifying low-risk PR is automatically merged into
`main`, which may trigger the repository's normal production deployment. The AI
workflow does not possess Cloudflare credentials or call a deployment API. A
provider outage must not encourage bypassing deterministic checks or human
review.

Store the DeepSeek API credential as the Actions secret `DEEPSEEK_API_KEY`.
The repository variable `AI_REVIEW_MODEL` selects the model without baking a
version into the workflow. It should be the official `deepseek-v4-flash` family
identifier. `AI_AUTO_MERGE_MAX_RISK` sets the maximum score eligible for
automatic merging. A score within that threshold still cannot bypass failed
checks, a truncated diff, DeepSeek's explicit recommendation, or deterministic
sensitive-change blockers.

`PR_BOT_TOKEN` should be a fine-grained token restricted to this repository with
only **Contents: read/write** and **Pull requests: read/write**. A dedicated,
short-lived GitHub App token is preferable when available. Rotate the token if it
has ever been stored outside GitHub Actions secrets.
