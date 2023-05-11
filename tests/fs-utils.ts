import fs from 'fs';
import path from 'path';

export function emptyDirectory(directoryPath: string): void {

  if (!fs.existsSync(directoryPath)) {
    return;
  }

  const files = fs.readdirSync(directoryPath);

  for (const file of files) {

    const filePath = path.join(directoryPath, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (isDirectory) {
      emptyDirectory(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }

  fs.rmdirSync(directoryPath);
}
export function createFile(filePath: string, content: string): void {

  const dir = path.dirname(filePath);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
}
