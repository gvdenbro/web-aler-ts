import fs from 'fs';
import path from 'path';

export function removeDirectory(directoryPath: string): void {

  if (!fs.existsSync(directoryPath)) {
    return;
  }

  fs.rmSync(directoryPath, { recursive: true });
}

export function removeFiles(directoryPath: string, extension: string): void {

  const files = fs.readdirSync(directoryPath);
  files.filter(file => file.endsWith(extension)).forEach((file) => {
    fs.unlinkSync(path.resolve(directoryPath, file));
  });
}
