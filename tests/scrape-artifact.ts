import fs from 'fs';
import path from 'path';
import turndown from '@joplin/turndown';
import { tables } from '@joplin/turndown-plugin-gfm';

export type ArtifactFormat = 'html' | 'table' | 'aria';

export interface ScrapeArtifactInput {
  /** Relative path within the scrape set. No extension; `/` creates subdirectories. */
  name: string;
  /** Human-readable label used in ARIA frontmatter. Defaults to the artifact name. */
  title?: string;
  url: string;
  content: string;
  format?: ArtifactFormat;
  screenshot?: () => Promise<Buffer>;
}

export interface ScrapeArtifact {
  name: string;
  markdownPath: string;
  screenshotPath?: string;
}

export interface ScrapeArtifacts {
  readonly directory: string;
  record(input: ScrapeArtifactInput): Promise<ScrapeArtifact>;
}

const turndownService = new turndown({ emDelimiter: '*' }).remove('script');
const tabularTurndownService = new turndown({ emDelimiter: '*' }).use(tables).remove('script');

export function scrapeArtifacts(directory: string): ScrapeArtifacts {

  return {
    directory,
    async record(input: ScrapeArtifactInput): Promise<ScrapeArtifact> {

      const format = input.format ?? 'html';
      const name = normalizeArtifactName(input.name);

      if (format === 'aria' && input.screenshot) {
        throw new Error(`scrape artifact "${input.name}": format "aria" does not support a screenshot`);
      }

      // Capture the image before writing anything, so a failed screenshot leaves no artifact behind.
      const screenshot = input.screenshot ? await input.screenshot() : undefined;

      const markdownPath = path.join(directory, `${name}.md`);
      const screenshotPath = screenshot ? path.join(directory, `${name}.png`) : undefined;

      // The PNG goes first so the markdown never points at a missing image.
      if (screenshot && screenshotPath) {
        writeFile(screenshotPath, screenshot);
      }
      writeFile(markdownPath, renderArtifact(input, name, format, screenshot !== undefined));

      return { name, markdownPath, screenshotPath };
    }
  };
}

function renderArtifact(input: ScrapeArtifactInput, name: string, format: ArtifactFormat, hasScreenshot: boolean): string {

  if (format === 'aria') {
    const title = input.title ?? name;
    return `---\n- title: ${title}\n- url: ${input.url}\n${input.content}\n---\n\n`;
  }

  const image = hasScreenshot ? `<p><img src="${escapeAttribute(path.basename(name))}.png" alt=""></p>` : '';
  const html = `<div>${input.content}</div>${image}<p><a href="${escapeAttribute(input.url)}">Source</a></p>`;

  return (format === 'table' ? tabularTurndownService : turndownService).turndown(html);
}

function normalizeArtifactName(raw: string): string {

  if (!raw) {
    throw new Error('scrape artifact name must not be empty');
  }
  if (path.isAbsolute(raw) || raw.startsWith('/')) {
    throw new Error(`scrape artifact name must be relative: "${raw}"`);
  }
  if (/\.(md|png)$/i.test(raw)) {
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

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
