import fs from 'fs';
import path from 'path';

interface ScrapeArtifactBase {
  /** Relative path within the scrape set. No extension; `/` creates subdirectories. */
  name: string;
  /** Human-readable label written into the artifact. Defaults to the final name segment. */
  title?: string;
  url: string;
}

interface ScrapeSnapshotArtifact extends ScrapeArtifactBase {
  /** ARIA snapshot, as returned by Playwright's ariaSnapshot(). */
  snapshot: string;
  screenshot?: () => Promise<Buffer>;
}

interface ScrapeDataArtifact extends ScrapeArtifactBase {
  /** Pre-serialized data (for example JSON) written as a YAML literal block. */
  data: string;
}

export type ScrapeArtifactInput = ScrapeSnapshotArtifact | ScrapeDataArtifact;

export interface ScrapeArtifact {
  name: string;
  path: string;
  screenshotPath?: string;
}

export interface ScrapeArtifacts {
  readonly directory: string;
  record(input: ScrapeArtifactInput): Promise<ScrapeArtifact>;
}

export function scrapeArtifacts(directory: string): ScrapeArtifacts {

  return {
    directory,
    async record(input: ScrapeArtifactInput): Promise<ScrapeArtifact> {

      const name = normalizeArtifactName(input.name);
      const hasSnapshot = 'snapshot' in input;
      const hasData = 'data' in input;

      if (hasSnapshot === hasData) {
        throw new Error(`scrape artifact "${input.name}": provide exactly one of snapshot or data`);
      }
      if (hasSnapshot && (typeof input.snapshot !== 'string' || !input.snapshot.trim())) {
        throw new Error(`scrape artifact "${input.name}": snapshot must not be empty`);
      }
      if (hasData && (typeof input.data !== 'string' || !input.data.trim())) {
        throw new Error(`scrape artifact "${input.name}": data must not be empty`);
      }
      if (hasData && 'screenshot' in input && input.screenshot) {
        throw new Error(`scrape artifact "${input.name}": data does not support a screenshot`);
      }

      // Capture the image before writing anything, so a failed screenshot leaves no artifact behind.
      const screenshot = hasSnapshot && input.screenshot ? await input.screenshot() : undefined;

      const artifactPath = path.join(directory, `${name}.yaml`);
      const screenshotPath = screenshot ? path.join(directory, `${name}.png`) : undefined;

      // The PNG goes first so the YAML never points at a missing image.
      if (screenshot && screenshotPath) {
        writeFile(screenshotPath, screenshot);
      }
      writeFile(artifactPath, renderArtifact(input, name, screenshot !== undefined));

      return { name, path: artifactPath, screenshotPath };
    }
  };
}

function renderArtifact(input: ScrapeArtifactInput, name: string, hasScreenshot: boolean): string {

  const lines = [
    `title: ${yamlString(input.title ?? path.basename(name))}`,
    `url: ${yamlString(input.url)}`,
  ];

  if (hasScreenshot) {
    lines.push(`image: ${yamlString(`${path.basename(name)}.png`)}`);
  }

  if ('snapshot' in input) {
    lines.push('snapshot:');
    appendIndented(lines, input.snapshot);
  } else {
    lines.push('data: |');
    appendIndented(lines, input.data);
  }

  return `${lines.join('\n')}\n`;
}

function appendIndented(lines: string[], block: string): void {
  for (const line of block.replace(/\n+$/, '').split('\n')) {
    lines.push(line ? `  ${line}` : '');
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function normalizeArtifactName(raw: string): string {

  if (!raw) {
    throw new Error('scrape artifact name must not be empty');
  }
  if (path.isAbsolute(raw) || raw.startsWith('/')) {
    throw new Error(`scrape artifact name must be relative: "${raw}"`);
  }
  if (/\.(yaml|yml|png)$/i.test(raw)) {
    throw new Error(`scrape artifact name must not include an extension: "${raw}"`);
  }

  return raw.split('/').map(segment => {

    const trimmed = segment.trim();

    if (!trimmed || trimmed === '.' || trimmed === '..') {
      throw new Error(`scrape artifact name contains an invalid path segment: "${raw}"`);
    }

    const cleaned = trimmed
      .replace(/\s+/g, '_')
      .replace(/[<>:"|?*\\\u0000-\u001f\u007f]/g, '');

    if (!cleaned) {
      throw new Error(`scrape artifact name contains an unsupported character: "${raw}"`);
    }

    return cleaned;
  }).join('/');
}

function writeFile(filePath: string, content: string | Buffer): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}
