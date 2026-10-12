# Contributing

## Layout

```
skills/
  motion-craft/      engine-agnostic motion design: curves, pacing, seams, camera grammar, process, verification
  motion-3d/         engine-agnostic 3D motion graphics + hosts (Canvas Commons, HyperFrames)
  canvas-commons/    Canvas Commons / Motion Canvas engine idiom, render pipeline, live panel, project template
scripts/
  lint-skills.mjs    run before every commit
```

Skills reference each other by name ("see `motion-3d` → `rules/frame-by-fill.md`"), never by file-system path. Inside a skill, link with relative paths.

## SKILL.md

- Frontmatter keys: `name` (must equal the directory), `description` (≤ 900 chars, says what it does and when to use it, with concrete trigger phrases), optional `license`, `allowed-tools`, `metadata`.
- Trigger phrases should be specific to the skill's domain. A bare generic term ("depth", "smoke test") fires on unrelated work.
- Body ≤ 160 lines: purpose, cardinal rules (≤ 10), a "when to read what" table, assets, examples.
- SKILL.md is a router. Detail lives in `rules/`, `references/`, `process/`, `hosts/`.

## Rule files (`rules/*.md`)

One technique or principle per file, 30–120 lines.

```markdown
---
name: frame-by-fill            # equals the filename
description: One line — what it is and when to reach for it.
tags: [camera, framing]
---

# Frame by fill fraction

**Use when:** …

## How it works
## Recipe          (engine-agnostic code first; host-specific snippets labelled)
## Values          (table of tuned ranges, when there are any)
## Pitfalls
## See also
```

Every rule is listed in `rules/INDEX.md` as `- [name](file.md) — one line. *tags*`.

## Examples

`skills/<skill>/examples/<name>/` is a complete, runnable project (no `node_modules`), small and signposted:

- `README.md`: what it shows, which rules it demonstrates (with `file:line` anchors), how to run and render.
- Pinned dependency versions.
- `preview.jpg`: a 4×3 contact sheet of the render.
- Neutral placeholder copy. No real people, clients or brands.

An example must render end to end before it is merged. Its frame count must equal what the engine reports it exported (Canvas Commons 0.4.0 exports `(to − from) + 1` frames, so the last frame is included). The engine and the frames on disk must agree. The MP4 from an image sequence must match them too. The WebCodecs exporter skips the final frame by design, so its MP4 holds `exported − 1` frames.

## Writing style

- State the rule and the reason from the reader's side. No project war stories ("in this project…", "we found…"). A failure that motivates a rule is written as "Observed failure: …".
- Plain words in anything a human operates (panel labels, CLI flags): describe what the eye sees, not craft jargon.
- Avoid `!` inside inline code spans, and `>` directly followed by a letter or digit. Claude Code's loader can trip on both. Use fenced blocks for such code.
- Ideas adapted from other projects are written in our own words with our own code, credited at the bottom of the file, and listed in `NOTICE.md`.

## Before committing

```bash
node scripts/lint-skills.mjs
# when a file adapts ideas from another project, check no prose was copied:
node scripts/check-overlap.mjs --against <path-to-that-project>
```

The lint also blocks local paths and checks that every relative link resolves. Names of real people and clients to block go in a gitignored `.private-terms` file at the repo root, one per line, so the list itself is never published.

Code comments: at most one short line, only for a non-obvious constraint. Usage documentation for assets lives in markdown, not in header blocks.
