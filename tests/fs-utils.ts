import fs from 'fs';
import path from 'path';

export function removeDirectory(directoryPath: string): void {

  if (!fs.existsSync(directoryPath)) {
    return;
  }

  fs.rmSync(directoryPath, { recursive: true });
}

export function createFile(filePath: string, content: string  | NodeJS.ArrayBufferView): void {

  const dir = path.dirname(filePath);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
}
