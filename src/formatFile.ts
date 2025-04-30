import {promises as fs} from 'fs';
import prettier from 'prettier';

/**
 * Formats a file at the given path using Prettier and saves it.
 *
 * @param filePath Path to file
 */
async function formatFile(filePath: string): Promise<void> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const prettierConfig = await prettier.resolveConfig(filePath);

    const formatted = await prettier.format(fileContent, {
        ...prettierConfig,
        filepath: filePath,
    });

    await fs.writeFile(filePath, formatted, 'utf-8');
}

export {formatFile};
