import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function filesUnder(relativeDirectory: string): string[] {
  const directory = path.join(process.cwd(), relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

test('mise and @types/node stay on the same Node major', async () => {

  const miseMajor = read('mise.toml').match(/^node\s*=\s*"(\d+)/m)?.[1];
  const packageJson = JSON.parse(read('package.json'));
  const typesMajor = String(packageJson.devDependencies['@types/node']).match(/\d+/)?.[0];

  expect(miseMajor).toBeTruthy();
  expect(typesMajor).toBe(miseMajor);
});

test('workflows and actions get Node from mise', async () => {

  const files = [
    ...filesUnder('.github/workflows').filter(file => /\.ya?ml$/.test(file)),
    ...filesUnder('.github/actions').filter(file => /action\.ya?ml$/.test(file)),
  ];

  for (const file of files) {
    const content = read(file);
    expect(content, `${file} should not hardcode node-version`).not.toMatch(/^\s*node-version:/m);
    expect(content, `${file} should not use actions/setup-node`).not.toMatch(/uses:\s*actions\/setup-node/);
  }
});
