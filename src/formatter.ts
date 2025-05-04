import {promises as fs} from 'fs';
import path from 'path';
import type {Options} from 'prettier';

/**
 * Formats files using Prettier with project-specific configuration.
 * Quietly skips formatting if Prettier is not installed or no config is found.
 *
 * @param filePaths Array of file paths to format
 * @param verbose If true, outputs information about the formatting process
 * @returns Promise resolving to an array of formatted file paths
 */
export async function formatWithPrettier(
    filePaths: string[],
    verbose: boolean = false
): Promise<string[]> {
    if (!filePaths.length) {
        return [];
    }

    let prettier;

    // Try to import prettier - if it fails, silently skip formatting
    try {
        prettier = await import('prettier');
    } catch (error) {
        if (verbose) {
            console.log('Prettier not available, skipping formatting');
        }
        return [];
    }

    // Get the directory of the first file to look for config
    const firstFileDir = path.dirname(filePaths[0]);
    const formattedFiles: string[] = [];

    try {
        // Find the nearest Prettier config file, null if none found
        const prettierConfig = await prettier.default
            .resolveConfig(firstFileDir)
            .catch(() => null);

        if (!prettierConfig && verbose) {
            console.log(
                'No Prettier configuration found, using default settings'
            );
        }

        // Format each file
        for (const filePath of filePaths) {
            try {
                // Read the file
                const fileContent = await fs.readFile(filePath, 'utf-8');

                // Format with Prettier (using config if found)
                const formatted = await prettier.default.format(fileContent, {
                    ...prettierConfig,
                    filepath: filePath, // This helps Prettier determine the parser based on file extension
                } as Options);

                // Write the formatted content back to the file
                await fs.writeFile(filePath, formatted, 'utf-8');

                formattedFiles.push(filePath);

                if (verbose) {
                    console.log(`✓ Formatted ${path.basename(filePath)}`);
                }
            } catch (fileError) {
                // Silently continue if formatting fails for a file
                if (verbose) {
                    console.log(
                        `Skipping formatting for ${path.basename(filePath)}`
                    );
                }
            }
        }

        if (verbose && formattedFiles.length > 0) {
            console.log(
                `Formatted ${formattedFiles.length}/${filePaths.length} files`
            );
        }

        return formattedFiles;
    } catch (error) {
        // Silently fail if any error occurs during the formatting process
        return [];
    }
}

/**
 * Formats a single file using Prettier with project-specific configuration.
 * Quietly skips formatting if Prettier is not installed or no config is found.
 *
 * @param filePath Path to the file to format
 * @returns Promise resolving to whether formatting was successful
 */
export async function formatSingleFile(filePath: string): Promise<boolean> {
    const formatted = await formatWithPrettier([filePath], false);
    return formatted.length > 0;
}
