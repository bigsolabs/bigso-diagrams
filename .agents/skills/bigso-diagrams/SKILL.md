---
name: bigso-diagrams
description: Create, validate, update, and export typed Bigso Diagrams documents. Use when an agent needs to produce or revise a flowchart, architecture, sequence, or ERD diagram in this repository.
---

# Bigso Diagrams workflow

Use this skill only for diagram work in the Bigso Diagrams project. Read `docs/format.md` and `schemas/diagram.schema.json` before creating or editing a document. The editable JSON is the source of truth; never author final SVG or HTML directly.

## Supported types

The current CLI supports exactly `flowchart`, `architecture`, `sequence`, and `erd`. Preserve each type's semantics:
- Flowcharts: steps, decisions, and labeled branches.
- Architecture: components and directed dependencies.
- Sequence: participants and messages in their declared order.
- ERD: entities, attributes, relationships, and both cardinalities.

Do not silently substitute another type or claim universal diagram support.

## Create

1. Use only the context the user supplied or authorized. If a missing detail materially changes meaning, ask one specific question and stop before writing. Record a non-material assumption in the document's description when useful.
2. If the requested type is unsupported, state that clearly and offer the four supported types. Do not emit a substitute diagram.
3. Create a versioned JSON document using the exact envelope and payload for its type in `docs/format.md`; use stable IDs and preserve source wording where possible.
4. Validate before rendering:
   `npm run diagrams -- validate path/to/diagram.json`
5. Render/export to explicit output paths, keeping artifacts separate from the editable source:
   `npm run diagrams -- render path/to/diagram.json --output output/diagram.svg`
   `npm run diagrams -- export path/to/diagram.json --format html --output output/diagram.html`

The CLI returns JSON on stdout. Exit codes are stable: `0` success, `1` invalid diagram/update, `2` usage error, `3` input/output error. Relay diagnostics; do not describe an invalid document as complete.

## Update without data loss

1. Read the complete existing JSON and identify exactly which fields should change.
2. Write a JSON Patch array containing only the requested operations (`add`, `replace`, or `remove`) using JSON Pointer paths. Do not replace the whole document or entire arrays for a local edit. Example:
   `[{"op":"replace","path":"/payload/nodes/2/label","value":"Enviar factura"}]`
3. Apply patches to a separate output file; the CLI validates the result and refuses to overwrite the source:
   `npm run diagrams -- update path/to/diagram.json --patch path/to/changes.json --output output/diagram.updated.json`
4. Compare the changed fields with the request and confirm unrelated nodes, edges, entities, relationships, messages, title, and description remain intact. Then render/export the updated document.

Patch paths must refer to existing targets for `replace`/`remove`; `add` may insert an array item at an existing index or append with `-`. A failed patch must not alter either input file.

## Agent response protocol for integrations/tests

The deterministic helper in `src/agent-workflow.mjs` accepts one of these responses:
- `{ "action": "create", "document": { ... } }` — validates the new document.
- `{ "action": "question", "question": "..." }` — asks before writing; no document is emitted.
- `{ "action": "unsupported", "requestedType": "..." }` — returns supported alternatives; no document is emitted.
- `{ "action": "update", "patches": [ ... ] }` plus the existing document — applies only the requested JSON Patches and validates the result.

Do not claim these simulated responses are a live model call. The helper and its tests verify workflow behavior independently of Claude Code or Codex.

## Privacy and output

All validation, layout, and export run locally. Do not add external assets, remote scripts, hosted rendering, unrelated local file contents, machine-specific paths, or secrets to documents or exports. Keep generated HTML/SVG portable and offline-capable. Never change files outside the user-authorized project/output paths.
