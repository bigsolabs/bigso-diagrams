import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const claudeSkill = new URL('../.claude/skills/bigso-diagrams/SKILL.md', import.meta.url);
const codexSkill = new URL('../.agents/skills/bigso-diagrams/SKILL.md', import.meta.url);

test('Claude Code and Codex expose the same tested project workflow', async () => {
  const [claude, codex] = await Promise.all([readFile(claudeSkill, 'utf8'), readFile(codexSkill, 'utf8')]);
  assert.equal(claude, codex);
  assert.match(claude, /^---\nname: bigso-diagrams\ndescription: .+\n---/);
  for (const instruction of [
    'Mermaid', '.mmd', '.meta.json', 'bigso-diagrams/sidecar@1',
    'elements', 'journeys', 'transition', 'from', 'to', 'linkIndex',
    'materially changes meaning', 'validate', '--format html', '--output',
    'diff', 'diagnostics', 'preview', 'unrelated', 'stale', 'IDs',
    'user reviews', 'preserve', 'Claude Code', 'Codex',
  ]) {
    assert.ok(claude.includes(instruction), `skill should document ${instruction}`);
  }
  assert.match(claude, /validate[^\n]*\.mmd/);
  assert.match(claude, /export[^\n]*\.mmd[^\n]*--format html[^\n]*--output/);
  assert.match(claude, /\.mmd[^\n]*\.meta\.json|\.meta\.json[^\n]*\.mmd/);
});
