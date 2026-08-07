# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Bitcoin Knots** — a Bitcoin Core fork packaged as `bitcoind` (same package id as Core; the two are drop-in flavors). Multi-branch package: worktrees `29.x` and `29.x-prerdts`.
- **`.satisfies('29.4:N')` mirrors Bitcoin Core 29.x's current version, and `.satisfies('28.4:N')` mirrors Core 28.x's** — when either Core line releases, bump the matching entry (this branch's own `#knots:` / `#knotsprerdts:` version string is independent). Cross-flavor migrations live in this version file's `migrations.other` map, keyed by whole-series exver caret ranges (`^29`, `^#knots:29.3`, …), not pinned `:N`.

## Inspecting a running install

`start-cli package attach bitcoind -n <subcontainer-name> -- <cmd>` — select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts`). `-s` matches the internal Guid, not the name.
