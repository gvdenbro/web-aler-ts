import turndown from '@joplin/turndown';
import { createFile } from './fs-utils';
import { tables } from '@joplin/turndown-plugin-gfm';

const turndownService = new turndown({ emDelimiter: '*' }).remove('script');
const turndownWithTablesService = new turndown({ emDelimiter: '*' }).use(tables).remove('script');

export function createMarkdown(filePath: string, htmlContent: string, options?: {handleTables?: boolean;}): void {

  const markdownContent = options?.handleTables ? turndownWithTablesService.turndown(htmlContent) : turndownService.turndown(htmlContent);

  createFile(filePath, markdownContent);
}
