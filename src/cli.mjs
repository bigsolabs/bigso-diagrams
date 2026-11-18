import { realpath, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { validateDiagram } from './validate.mjs';
import { exportHtml, exportSvg } from './export.mjs';
import { renderDiagram } from './render/index.mjs';
import { resolveAgentResponse } from './agent-workflow.mjs';

const EXIT = Object.freeze({ ok: 0, invalid: 1, usage: 2, io: 3 });

class CliError extends Error {
  constructor(code, message, exitCode = EXIT.usage) {
    super(message);
    this.code = code;
    this.exitCode = exitCode;
  }
}

function parseArgs(args) {
  const [command, input, ...rest] = args;
  if (!['validate', 'render', 'export', 'update'].includes(command) || !input || input.startsWith('--')) {
    throw new CliError('USAGE', 'Usage: diagrams <validate|render|export|update> <input.json> [options]');
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (!['--format', '--output', '--patch'].includes(flag) || options[flag.slice(2)] !== undefined || !rest[index + 1] || rest[index + 1].startsWith('--')) {
      throw new CliError('USAGE', `Invalid or incomplete option: ${flag}`);
    }
    options[flag.slice(2)] = rest[index + 1];
    index += 1;
  }
  if (command === 'validate' && Object.keys(options).length) throw new CliError('USAGE', 'validate accepts an input path only.');
  if (command === 'render' && (options.format || options.patch)) throw new CliError('USAGE', 'render produces SVG and accepts only --output.');
  if (command === 'export' && (options.patch || !['html', 'svg'].includes(options.format) || !options.output)) {
    throw new CliError('USAGE', 'export requires --format html|svg and --output path.');
  }
  if (command === 'update' && (options.format || !options.patch || !options.output)) {
    throw new CliError('USAGE', 'update requires --patch changes.json and --output updated.json.');
  }
  return { command, input: resolve(input), options };
}

async function loadDocument(input) {
  try {
    return JSON.parse(await readFile(input, 'utf8'));
  } catch (error) {
    throw new CliError('IO', `Cannot read or parse input: ${error.message}`, EXIT.io);
  }
}

async function assertSeparateOutput(input, output) {
  const outputPath = resolve(output);
  try {
    const [sourceReal, outputReal] = await Promise.all([realpath(input), realpath(outputPath)]);
    if (sourceReal === outputReal) throw new CliError('USAGE', 'Output path must not overwrite the editable source.');
    return outputPath;
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error.code !== 'ENOENT') throw error;
  }
  const [sourceReal, parentReal] = await Promise.all([realpath(input), realpath(dirname(outputPath))]);
  if (sourceReal === join(parentReal, basename(outputPath))) {
    throw new CliError('USAGE', 'Output path must not overwrite the editable source.');
  }
  return outputPath;
}

async function writeArtifact(input, output, content) {
  try {
    const outputPath = await assertSeparateOutput(input, output);
    await writeFile(outputPath, content, 'utf8');
    return outputPath;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError('IO', `Cannot write output: ${error.message}`, EXIT.io);
  }
}

async function run(args) {
  const { command, input, options } = parseArgs(args);
  const document = await loadDocument(input);
  const issues = validateDiagram(document);
  if (issues.length) return { result: { ok: false, command, issues }, exitCode: EXIT.invalid };

  if (command === 'validate') {
    return { result: { ok: true, command, type: document.type, title: document.title, issues: [] }, exitCode: EXIT.ok };
  }

  if (command === 'update') {
    let patches;
    try {
      patches = JSON.parse(await readFile(resolve(options.patch), 'utf8'));
    } catch (error) {
      throw new CliError('IO', `Cannot read or parse patch: ${error.message}`, EXIT.io);
    }
    let updated;
    try {
      updated = resolveAgentResponse({ action: 'update', patches }, document).document;
    } catch (error) {
      throw new CliError('INVALID', error.message, EXIT.invalid);
    }
    const content = `${JSON.stringify(updated, null, 2)}\n`;
    const output = await writeArtifact(input, options.output, content);
    return { result: { ok: true, command, type: updated.type, title: updated.title, output, bytes: Buffer.byteLength(content) }, exitCode: EXIT.ok };
  }

  let content;
  let format;
  if (command === 'render') {
    content = renderDiagram(document);
    format = 'svg';
  } else {
    format = options.format;
    content = format === 'html' ? exportHtml(document) : exportSvg(document);
  }

  if (options.output) {
    const output = await writeArtifact(input, options.output, content);
    return { result: { ok: true, command, type: document.type, title: document.title, ...(command === 'export' ? { format } : {}), output, bytes: Buffer.byteLength(content) }, exitCode: EXIT.ok };
  }
  return { result: { ok: true, command, type: document.type, title: document.title, svg: content }, exitCode: EXIT.ok };
}

try {
  const { result, exitCode } = await run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = exitCode;
} catch (error) {
  const command = process.argv[2] ?? null;
  const exitCode = error instanceof CliError ? error.exitCode : EXIT.io;
  const code = error instanceof CliError ? error.code : 'IO';
  process.stdout.write(`${JSON.stringify({ ok: false, command, error: { code, message: error.message } })}\n`);
  process.exitCode = exitCode;
}
