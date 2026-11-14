import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

let scrapeSets: any[];
let resolveSets: (options?: { schedule?: string; requested?: string }) => any[];
let formatChangedFiles: (files: string[], directory: string) => string;

test.beforeAll(async () => {
  const registry = await import('../scripts/scrape-sets.mjs');
  scrapeSets = registry.scrapeSets;
  resolveSets = registry.resolveSets;
  formatChangedFiles = registry.formatChangedFiles;
});

test('every active set has a spec and a unique name', async () => {

  const names = scrapeSets.map(set => set.name);

  expect(new Set(names).size).toBe(names.length);
  for (const name of names) {
    expect(fs.existsSync(path.join(process.cwd(), 'tests', `${name}.spec.ts`))).toBe(true);
  }
});

test('scheduled crons match the workflow triggers', async () => {

  const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'scrape.yml'), 'utf8');
  const crons = [...workflow.matchAll(/^\s*-\s*cron:\s*["']([^"']+)["']\s*(?:#.*)?$/gm)]
    .map(match => match[1]);

  expect([...new Set(crons)].sort()).toEqual([...new Set(scrapeSets.map(set => set.cron))].sort());
});

test('run-name maps each scheduled set to its name', async () => {

  const workflow = fs.readFileSync(path.join(process.cwd(), '.github', 'workflows', 'scrape.yml'), 'utf8');
  const runName = workflow.match(/^run-name:\s*"([^"]+)"\s*$/m)?.[1] ?? '';

  expect(runName).toContain('inputs.set');
  for (const set of scrapeSets) {
    expect(runName).toContain(`github.event.schedule == '${set.cron}' && '${set.name}'`);
  }
});

test('resolves a schedule to its set', async () => {

  expect(resolveSets({ schedule: '33 4-21 * * *' })).toEqual([{
    name: 'pages',
    spec: 'tests/pages.spec.ts',
    directory: 'scrapes/pages',
    image: '',
  }]);
});

test('resolves a named set and expands its image', async () => {

  expect(resolveSets({ requested: 'prices' })).toEqual([{
    name: 'prices',
    spec: 'tests/prices.spec.ts',
    directory: 'scrapes/prices',
    image: 'scrapes/prices/prices.png',
  }]);
});

test('all resolves to every active set', async () => {

  expect(resolveSets({ requested: 'all' })).toHaveLength(scrapeSets.length);
});

test('rejects an unknown schedule or set', async () => {

  expect(() => resolveSets({ schedule: '0 0 * * *' })).toThrow('no scrape set matches schedule');
  expect(() => resolveSets({ requested: 'bikes' })).toThrow('unknown scrape set');
});

test('formats changed artifacts for Telegram', async () => {

  expect(formatChangedFiles([
    'scrapes/pages/a.md',
    'scrapes/pages/b_c.md',
    'scrapes/pages/c[1].md',
    'scrapes/pages/x.png',
    'other/z.md',
  ], 'scrapes/pages')).toBe('a, b\\_c, c\\[1]');
});

test('keeps nested artifact paths and drops duplicates', async () => {

  expect(formatChangedFiles([
    'scrapes/vgc/essegem/activity/x.md',
    'scrapes/vgc/essegem/activity/x.md',
  ], 'scrapes/vgc')).toBe('essegem/activity/x');
});

test('returns an empty string when nothing changed', async () => {

  expect(formatChangedFiles([], 'scrapes/pages')).toBe('');
});
