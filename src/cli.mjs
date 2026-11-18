import { realpath, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
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
    throw new CliError('USAGE', 'Usage: diagrams <validate|render|export|update> <input.json|input.mmd> [options]');
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (!['--format', '--output', '--patch', '--metadata'].includes(flag) || options[flag.slice(2)] !== undefined || !rest[index + 1] || rest[index + 1].startsWith('--')) {
      throw new CliError('USAGE', `Invalid or incomplete option: ${flag}`);
    }
    options[flag.slice(2)] = rest[index + 1];
    index += 1;
  }
  if (command === 'validate' && Object.keys(options).some((option) => option !== 'metadata')) throw new CliError('USAGE', 'validate accepts only an optional --metadata path.');
  if (command === 'render' && (options.format || options.patch || options.metadata)) throw new CliError('USAGE', 'render produces SVG and accepts only --output.');
  if (command === 'export' && (options.patch || !['html', 'svg'].includes(options.format) || !options.output)) {
    throw new CliError('USAGE', 'export requires --format html|svg and --output path.');
  }
  if (command === 'update' && (options.format || options.metadata || !options.patch || !options.output)) {
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

async function loadMetadata(input, explicitMetadata, graph) {
  const extension = extname(input);
  const adjacentPath = `${input.slice(0, -extension.length)}.meta.json`;
  const metadataPath = explicitMetadata ? resolve(explicitMetadata) : adjacentPath;
  let raw;
  try {
    raw = await readFile(metadataPath, 'utf8');
  } catch (error) {
    if (!explicitMetadata && error.code === 'ENOENT') return { path: null, value: null, issues: [] };
    throw new CliError('IO', `Cannot read metadata sidecar: ${error.message}`, EXIT.io);
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    return { path: metadataPath, value: null, issues: [{ path: '$', code: 'INVALID_JSON', message: error.message }] };
  }
  const { validateSidecar } = await import('./sidecar.mjs');
  return { path: metadataPath, value, issues: validateSidecar(value, graph) };
}

async function assertSeparateOutput(input, output, protectedPaths = []) {
  const outputPath = resolve(output);
  const protectedRealPaths = await Promise.all([input, ...protectedPaths].map((path) => realpath(path)));
  const rejectOverwrite = () => {
    throw new CliError('USAGE', 'Output path must not overwrite an editable source or metadata sidecar.');
  };
  try {
    if (protectedRealPaths.includes(await realpath(outputPath))) rejectOverwrite();
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error.code !== 'ENOENT') throw error;
  }
  const parentReal = await realpath(dirname(outputPath));
  if (protectedRealPaths.includes(join(parentReal, basename(outputPath)))) rejectOverwrite();
  return outputPath;
}

async function writeArtifact(input, output, content, protectedPaths = []) {
  try {
    const outputPath = await assertSeparateOutput(input, output, protectedPaths);
    await writeFile(outputPath, content, 'utf8');
    return outputPath;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError('IO', `Cannot write output: ${error.message}`, EXIT.io);
  }
}

async function runMermaid({ command, input, options }) {
  if (command === 'update') throw new CliError('USAGE', 'update currently accepts JSON documents only.');
  let source;
  try {
    source = await readFile(input, 'utf8');
  } catch (error) {
    throw new CliError('IO', `Cannot read Mermaid source: ${error.message}`, EXIT.io);
  }
  const { validateMermaidSource } = await import('./adapters/mermaid.mjs');
  const validation = await validateMermaidSource(source);
  if (!validation.ok) return { result: { ok: false, command, issues: validation.issues }, exitCode: EXIT.invalid };
  const metadata = await loadMetadata(input, options.metadata, validation.graph);
  if (metadata.issues.length) return { result: { ok: false, command, ...(metadata.path ? { metadata: metadata.path } : {}), issues: metadata.issues }, exitCode: EXIT.invalid };
  const metadataInfo = metadata.path ? { metadata: metadata.path } : {};

  if (command === 'validate') {
    return { result: { ok: true, command, type: 'mermaid', diagramType: validation.supportedType, ...metadataInfo, issues: [] }, exitCode: EXIT.ok };
  }
  if (command === 'render') {
    throw new CliError('USAGE', 'Mermaid renders in the browser; use export --format html --output <path>.');
  }
  if (options.format !== 'html') {
    throw new CliError('USAGE', 'Mermaid source supports HTML export only; use --format html.');
  }
  const { exportMermaidHtml } = await import('./export-mermaid.mjs');
  const content = await exportMermaidHtml(source, validation.supportedType, metadata.value ?? {}, validation.graph);
  const output = await writeArtifact(input, options.output, content, metadata.path ? [metadata.path] : []);
  return { result: { ok: true, command, type: 'mermaid', diagramType: validation.supportedType, ...metadataInfo, format: 'html', output, bytes: Buffer.byteLength(content) }, exitCode: EXIT.ok };
}

async function run(args) {
  const parsed = parseArgs(args);
  if (extname(parsed.input).toLowerCase() === '.mmd') return runMermaid(parsed);
  if (parsed.options.metadata) throw new CliError('USAGE', '--metadata is supported only with Mermaid .mmd sources.');
  const { command, input, options } = parsed;
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
