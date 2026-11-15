import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { scrapeArtifacts } from './scrape-artifact';

function temporaryDirectory(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'scrape-artifact-'));
}

test('writes a YAML snapshot artifact', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);
  expect(artifacts.directory).toBe(directory);

  const artifact = await artifacts.record({
    name: 'maxim',
    title: 'Maxim Vengerov',
    url: 'https://e.com/events?a=1&b=2',
    snapshot: '- text: Upcoming\n- link "Tickets"',
  });

  expect(artifact).toEqual({
    name: 'maxim',
    path: path.join(directory, 'maxim.yaml'),
    screenshotPath: undefined,
  });
  expect(fs.readFileSync(artifact.path, 'utf8')).toBe(
    'title: "Maxim Vengerov"\n' +
    'url: "https://e.com/events?a=1&b=2"\n' +
    'snapshot:\n' +
    '  - text: Upcoming\n' +
    '  - link "Tickets"\n'
  );
});

test('defaults the title to the artifact name', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'maxim',
    url: 'https://e.com/events',
    snapshot: '- text: Upcoming',
  });

  expect(fs.readFileSync(artifact.path, 'utf8')).toContain('title: "maxim"');
});

test('defaults a nested title to the final name segment', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'essegem/card',
    url: 'https://e.com/activity',
    snapshot: '- text: theatre',
  });

  expect(fs.readFileSync(artifact.path, 'utf8')).toContain('title: "card"');
});

test('writes a YAML data artifact', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'digi',
    url: 'https://api.e.com/status',
    data: '{\n  "ok": true\n}',
  });

  expect(fs.readFileSync(artifact.path, 'utf8')).toBe(
    'title: "digi"\n' +
    'url: "https://api.e.com/status"\n' +
    'data: |\n' +
    '  {\n' +
    '    "ok": true\n' +
    '  }\n'
  );
});

test('writes the screenshot before the YAML and links it', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);
  let calls = 0;

  const artifact = await artifacts.record({
    name: 'price-card',
    url: 'https://e.com/product',
    snapshot: '- text: 1299',
    screenshot: async () => {
      calls++;
      return Buffer.from('png-bytes');
    },
  });

  expect(calls).toBe(1);
  expect(artifact.screenshotPath).toBe(path.join(directory, 'price-card.png'));
  expect(fs.readFileSync(artifact.screenshotPath!, 'utf8')).toBe('png-bytes');
  expect(fs.readFileSync(artifact.path, 'utf8')).toBe(
    'title: "price-card"\n' +
    'url: "https://e.com/product"\n' +
    'image: "price-card.png"\n' +
    'snapshot:\n' +
    '  - text: 1299\n'
  );
});

test('links a nested screenshot relative to the YAML file', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'essegem/card',
    url: 'https://e.com/activity',
    snapshot: '- text: 1299',
    screenshot: async () => Buffer.from('png-bytes'),
  });

  expect(artifact.screenshotPath).toBe(path.join(directory, 'essegem', 'card.png'));
  expect(fs.readFileSync(artifact.path, 'utf8')).toContain('image: "card.png"');
});

test('leaves no artifact when the screenshot fails', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  await expect(artifacts.record({
    name: 'price-card',
    url: 'https://e.com/product',
    snapshot: '- text: 1299',
    screenshot: async () => {
      throw new Error('screenshot failed');
    },
  })).rejects.toThrow('screenshot failed');

  expect(fs.existsSync(path.join(directory, 'price-card.yaml'))).toBe(false);
  expect(fs.existsSync(path.join(directory, 'price-card.png'))).toBe(false);
});

test('rejects empty snapshots and empty data', async () => {

  const artifacts = scrapeArtifacts(temporaryDirectory());

  await expect(artifacts.record({
    name: 'empty',
    url: 'https://e.com',
    snapshot: '   ',
  })).rejects.toThrow('snapshot must not be empty');

  await expect(artifacts.record({
    name: 'empty',
    url: 'https://e.com',
    data: '',
  })).rejects.toThrow('data must not be empty');
});

test('rejects a screenshot on a data artifact', async () => {

  const artifacts = scrapeArtifacts(temporaryDirectory());

  await expect(artifacts.record({
    name: 'digi',
    url: 'https://api.e.com/status',
    data: '{}',
    screenshot: async () => Buffer.from('png-bytes'),
  } as any)).rejects.toThrow('does not support a screenshot');
});

test('sanitizes names and creates nested directories', async () => {

  const directory = temporaryDirectory();
  const artifacts = scrapeArtifacts(directory);

  const artifact = await artifacts.record({
    name: 'essegem / ticketing:Activity/ESS 1',
    url: 'https://e.com/activity',
    snapshot: '- text: theatre',
  });

  expect(artifact.name).toBe('essegem/ticketingActivity/ESS_1');
  expect(artifact.path).toBe(path.join(directory, 'essegem', 'ticketingActivity', 'ESS_1.yaml'));
  expect(fs.readFileSync(artifact.path, 'utf8')).toContain('snapshot:\n  - text: theatre\n');
});

test('rejects names that escape the scrape set', async () => {

  const artifacts = scrapeArtifacts(temporaryDirectory());
  const base = { url: 'https://e.com', snapshot: '- text: text' };

  await expect(artifacts.record({ ...base, name: '../outside' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: 'a/../b' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: 'a//b' })).rejects.toThrow('invalid path segment');
  await expect(artifacts.record({ ...base, name: '/absolute' })).rejects.toThrow('must be relative');
  await expect(artifacts.record({ ...base, name: 'artifact.yaml' })).rejects.toThrow('must not include an extension');
});
