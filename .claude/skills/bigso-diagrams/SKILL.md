---
name: bigso-diagrams
description: Create, validate, update, and export Mermaid diagrams with Bigso sidecar metadata. Use when an agent needs to produce or revise a diagram in this repository.
---

# Bigso Diagrams workflow

Use this skill only for diagram work in the Bigso Diagrams project. Mermaid `.mmd` is the source of truth for graph structure; the optional sibling `.meta.json` holds presentation metadata and journeys, never a duplicate graph. There is no proprietary diagram language or integrated chat: Claude Code or Codex handles the conversation, while Bigso validates and exports locally. Read `docs/mermaid-support.md` and `docs/sidecar-format.md` before creating or editing files; respect the documented syntax limits.

## Create

1. Use only context the user supplied or authorized. If a missing detail materially changes meaning, ask one specific question and stop before writing. Record a non-material assumption only when useful; do not invent requirements.
2. Create a `.mmd` with stable, explicit Mermaid IDs for elements that need references. Preserve user wording and requested semantics. Do not silently substitute a different diagram type or unsupported syntax; explain the limitation and ask how to proceed.
3. Create a sibling `.meta.json` when descriptions, annotations, or journeys are requested or useful. Use schema marker `bigso-diagrams/sidecar@1`; `elements` keys must refer to Mermaid IDs, and `journeys[].steps[].transition` must contain valid `from` and `to` IDs, adding `linkIndex` when parallel links require disambiguation. Do not put nodes or connections in the sidecar. Validate all sidecar references against the current `.mmd`.
4. Validate before presenting a design:
   `npm run diagrams -- validate path/to/diagram.mmd`
   The CLI auto-discovers sibling `diagram.meta.json`; use `--metadata path/to/file.meta.json` only when needed. Do not claim unsupported flags or behavior.
5. Produce an explicit HTML preview/export:
   `npm run diagrams -- export path/to/diagram.mmd --format html --output output/diagram.html`
   Keep generated output separate from editable source. Open or refresh the preview only through available local project tooling; do not imply the CLI provides an interactive preview command.

## Update safely

1. Read both complete existing files (and any relevant project instructions). Identify the requested changes and the existing IDs/references before editing.
2. If the request depends on an ambiguous material choice, ask before changing either file. Otherwise edit only the necessary Mermaid lines and sidecar entries; preserve unrelated user edits, formatting, IDs, metadata, and content. Do not regenerate/replace whole files for a local change.
3. If an ID is renamed or removed, locate every sidecar reference (`elements` keys and journey transition endpoints). Update references only when the intended mapping is clear; otherwise ask. Never leave stale references or guess an ID mapping. Run validation after edits; report any invalid or stale reference diagnostics and do not present the result as valid.
4. Review the exact source diff to confirm only requested changes occurred and unrelated content remains unchanged. Validate the `.mmd` and sidecar together:
   `npm run diagrams -- validate path/to/diagram.mmd`
   Use `--metadata` for a non-sibling sidecar. Do not overwrite a user's pre-existing changes or claim they accepted your edits.
5. Export/refresh the HTML preview to an explicit output path using the command above. Present the source and sidecar diff, validation diagnostics (including none when clean), and preview path/result. The user reviews and decides whether to accept the changes; do not silently commit, publish, or treat generated output as acceptance.

## CLI and boundaries

The current supported commands for this workflow are `validate .mmd` and `export .mmd --format html --output ...`; sidecar discovery is sibling-based unless `--metadata` is explicitly supplied. Relay actual CLI diagnostics and exit status. Do not claim sidecar-specific CLI flags, patch/update commands, integrated chat, or an interactive preview command exist unless verified in the current CLI. Keep work local, preserve unrelated files, and do not include secrets or unrelated local content in diagrams or exports. Never change files outside the user-authorized project/output paths.
