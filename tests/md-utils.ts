import turndown from 'turndown';
import { createFile } from './fs-utils';

const turndownService = new turndown({ emDelimiter: '*' }).remove('script');

export function createMarkdown(filePath: string, htmlContent: string): void {

  const markdownContent = turndownService.turndown(htmlContent);

  createFile(filePath, markdownContent);
}