# Project skills

Design and platform skills Claude Code loads when working in this repo.

| Skill | Source | License |
|---|---|---|
| emil-design-eng, improve-animations, find-animation-opportunities | https://github.com/emilkowalski/skills | MIT |
| taste-skill, redesign-skill | https://github.com/Leonxlnx/taste-skill | MIT |
| impeccable (playbooks + launcher scripts) | https://github.com/pbakaus/impeccable | Apache-2.0 |
| telegram-mini-app | https://github.com/Rithprohos/telegram-mini-app-skills | MIT (per README) |

Impeccable's `scripts/impeccable` launcher downloads its engine binary from the
pbakaus/impeccable GitHub releases on first run and verifies it against the published
SHA-256 before executing. The binary is cached outside the repo and is never committed.
Run the detector with: `.claude/skills/impeccable/scripts/impeccable detect --json <file>`
