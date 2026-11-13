import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { scrapeArtifacts } from './scrape-artifact';

function temporaryDirectory(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'scrape-artifact-'));
}

test('writes an html artifact with a source link', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);
  expect(artifacts.directory).toBe(directory);

  const artifact = await artifacts.record({
    name: 'maxim',
    url: 'https://e.com/events?a=1&b=2',
    content: '<h2>Hi</h2><p>text</p>',
  });

  expect(artifact).toEqual({
    name: 'maxim',
    markdownPath: path.join(directory, 'maxim.md'),
    screenshotPath: undefined,
  });
  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('Hi\n--\n\ntext\n\n[Source](https://e.com/events?a=1&b=2)');
});

test('writes a table artifact', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'taiwan',
    url: 'https://e.com/search',
    format: 'table',
    content: '<table><tr><th>Time</th></tr><tr><td>10:00</td></tr></table>',
  });

  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('| Time |\n| --- |\n| 10:00 |\n\n[Source](https://e.com/search)');
});

test('writes an aria artifact as frontmatter', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'maxim',
    title: 'Maxim Vengerov',
    url: 'https://e.com/events',
    format: 'aria',
    content: '- text: Upcoming',
  });

  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('---\n- title: Maxim Vengerov\n- url: https://e.com/events\n- text: Upcoming\n---\n\n');
});

test('defaults the aria title to the artifact name', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'maxim',
    url: 'https://e.com/events',
    format: 'aria',
    content: '- text: Upcoming',
  });

  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toContain('- title: maxim');
});

test('writes the screenshot before the markdown and links it', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);
  let calls = 0;

  const artifact = await artifacts.record({
    name: 'price-card',
    url: 'https://e.com/product',
    content: '<p>1299</p>',
    screenshot: async () => {
      calls++;
      return Buffer.from('png-bytes');
    },
  });

  expect(calls).toBe(1);
  expect(artifact.screenshotPath).toBe(path.join(directory, 'price-card.png'));
  expect(fs.readFileSync(artifact.screenshotPath!, 'utf8')).toBe('png-bytes');
  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('1299\n\n![](price-card.png)\n\n[Source](https://e.com/product)');
});

test('links a nested screenshot relative to the markdown', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'essegem/card',
    url: 'https://e.com/activity',
    content: '1299',
    screenshot: async () => Buffer.from('png-bytes'),
  });

  expect(artifact.screenshotPath).toBe(path.join(directory, 'essegem', 'card.png'));
  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('1299\n\n![](card.png)\n\n[Source](https://e.com/activity)');
});

test('leaves no artifact when the screenshot fails', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  await expect(artifacts.record({
    name: 'price-card',
    url: 'https://e.com/product',
    content: '<p>1299</p>',
    screenshot: async () => {
      throw new Error('screenshot failed');
    },
  })).rejects.toThrow('screenshot failed');

  expect(fs.existsSync(path.join(directory, 'price-card.md'))).toBe(false);
  expect(fs.existsSync(path.join(directory, 'price-card.png'))).toBe(false);
});

test('rejects a screenshot with the aria format', async () => {

  const artifacts = scrapeArtifacts(temporaryDirectory());

  await expect(artifacts.record({
    name: 'maxim',
    url: 'https://e.com/events',
    format: 'aria',
    content: '- text: Upcoming',
    screenshot: async () => Buffer.from('png-bytes'),
  })).rejects.toThrow('does not support a screenshot');
});

test('sanitizes names and creates nested directories', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'essegem / ticketing:Activity/ESS 1',
    url: 'https://e.com/activity',
    content: '<p>theatre</p>',
  });

  expect(artifact.name).toBe('essegem/ticketingActivity/ESS_1');
  expect(artifact.markdownPath).toBe(path.join(directory, 'essegem', 'ticketingActivity', 'ESS_1.md'));
  expect(fs.readFileSync(artifact.markdownPath, 'utf8')).toBe('theatre\n\n[Source](https://e.com/activity)');
});

test('rejects names that escape the scrape set', async () => {

  const artifacts = scrapeArtifacts(temporaryDirectory());
  const base = { url: 'https://e.com', content: '<p>text</p>' };

  await expect(artifacts.record({ ...base, name: '../outside' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: 'a/../b' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: 'a//b' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: '/absolute' })).rejects.toThrow('must be relative');
  await expect(artifacts.record({ ...base, name: 'artifact.md' })).rejects.toThrow('must not include an extension');
});
