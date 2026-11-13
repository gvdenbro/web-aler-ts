import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// One entry per active scrape set. The spec and output directory are derived
// from the name: tests/<name>.spec.ts and scrapes/<name>.
//
// `cron` schedules the set; `image` names a file inside the set directory that
// is attached to the Telegram notification.
export const scrapeSets = [
  { name: 'pages', cron: '33 4-21 * * *' },
  { name: 'prices', cron: '7 4-22 * * *', image: 'prices.png' },
  { name: 'flights', cron: '37 4-22/4 * * *', image: 'prices.png' },
  { name: 'vgc', cron: '5 4-21 * * *' },
];

// Disabled: no workflow / no active scrape. Uncomment to schedule.
// { name: 'taiwan', cron: '30 4-22/9 * * *' },
// { name: 'apis' },
// { name: 'spalat', image: 'spalat.png' },
// { name: 'states', image: 'prices.png' },
// { name: 'buienradar' },
// { name: 'bikes', cron: '41 4-22/4 * * *' }, // no spec: tests/bikes.spec.ts was deleted

function specPath(name) {
  return `tests/${name}.spec.ts`;
}

function directoryPath(name) {
  return `scrapes/${name}`;
}

function validateRegistry() {

  const names = new Set();

  for (const set of scrapeSets) {

    if (!set.name) {
      throw new Error('scrape set entry is missing a name');
    }
    if (names.has(set.name)) {
      throw new Error(`duplicate scrape set "${set.name}"`);
    }
    names.add(set.name);

    if (!set.cron || set.cron.trim().split(/\s+/).length !== 5) {
      throw new Error(`scrape set "${set.name}" needs a five-field cron`);
    }
    if (!fs.existsSync(path.join(repoRoot, specPath(set.name)))) {
      throw new Error(`scrape set "${set.name}" has no spec at ${specPath(set.name)}`);
    }
    if (set.image && /[\\/]/.test(set.image)) {
      throw new Error(`scrape set "${set.name}" image must be a file name`);
    }
  }
}

validateRegistry();

function toMatrixEntry(set) {
  return {
    name: set.name,
    spec: specPath(set.name),
    directory: directoryPath(set.name),
    image: set.image ? `${directoryPath(set.name)}/${set.image}` : '',
  };
}

export function resolveSets({ schedule = '', requested = '' } = {}) {

  if (schedule) {
    const matches = scrapeSets.filter(set => set.cron === schedule);
    if (matches.length === 0) {
      const known = [...new Set(scrapeSets.map(set => set.cron))].join(', ');
      throw new Error(`no scrape set matches schedule "${schedule}". Known schedules: ${known}`);
    }
    return matches.map(toMatrixEntry);
  }

  const name = requested || 'all';

  if (name === 'all') {
    return scrapeSets.map(toMatrixEntry);
  }

  const match = scrapeSets.find(set => set.name === name);
  if (!match) {
    const known = scrapeSets.map(set => set.name).join(', ');
    throw new Error(`unknown scrape set "${name}". Active sets: ${known}`);
  }
  return [toMatrixEntry(match)];
}

export function formatChangedFiles(files, directory) {

  const prefix = `${directory.replace(/\/+$/, '')}/`;

  const names = files
    .filter(file => file.startsWith(prefix) && file.endsWith('.md'))
    .map(file => file.slice(prefix.length, -'.md'.length))
    .filter(Boolean);

  return [...new Set(names)].map(escapeTelegram).join(', ');
}

function escapeTelegram(text) {
  return text.replace(/([_*`\[])/g, '\\$1');
}

function changedFiles(directory) {
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '-z', '--diff-filter=AM', 'HEAD^', 'HEAD', '--', directory],
    { cwd: repoRoot }
  );
  return output.toString('utf8').split('\0').filter(Boolean);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {

  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'resolve') {
      const sets = resolveSets({ schedule: args[0] ?? '', requested: args[1] ?? '' });
      process.stdout.write(`sets=${JSON.stringify(sets)}\n`);
    } else if (command === 'changes') {
      const directory = args[0];
      if (!directory) {
        throw new Error('changes requires a scrape directory');
      }
      process.stdout.write(`changed=${formatChangedFiles(changedFiles(directory), directory)}\n`);
    } else {
      throw new Error('usage: scrape-sets.mjs resolve [schedule] [set|all] | changes <directory>');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
