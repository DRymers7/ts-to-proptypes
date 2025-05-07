import {promises as fs} from 'fs';
import path from 'path';
import {logger} from './logger';

/**
 * Result of a formatting operation
 */
interface FormattingResult {
    /** Path to the file that was processed */
    filePath: string;
    /** Whether formatting was successful */
    success: boolean;
    /** Error message if formatting failed */
    error?: string;
}

/**
 * Configuration options for the formatter
 */
interface FormatterOptions {
    /** Enable verbose logging */
    verbose?: boolean;
    /** Custom Prettier configuration to use instead of auto-detected config */
    prettierConfig?: Record<string, unknown>;
}

/**
 * Formats a collection of files using Prettier with project-specific configuration.
 *
 * This function automatically detects Prettier configuration from the user's project
 * and applies it to the specified files. It gracefully handles cases where Prettier
 * is not available or no configuration can be found.
 *
 * @param filePaths - Array of file paths to format
 * @param options - Configuration options for the formatter
 * @returns Promise resolving to an array of successfully formatted file paths
 * 
 * @example
 * ```typescript
 * import { formatWithPrettier } from 'ts-to-proptypes';
 * 
 * // Format multiple files
 * const formattedPaths = await formatWithPrettier([
 *   './generated/Button.propTypes.ts',
 *   './generated/Card.propTypes.ts'
 * ]);
 * 
 * // Format with custom options
 * await formatWithPrettier(['./file.ts'], { 
 *   verbose: true,
 *   prettierConfig: { tabWidth: 2 }
 * });
 * ```
 */
export async function formatWithPrettier(
    filePaths: readonly string[],
    options: FormatterOptions = {}
): Promise<string[]> {
    const {verbose = false} = options;

    if (!filePaths.length) {
        return [];
    }

    // Try to import prettier - if it fails, silently skip formatting
    let prettier;
    try {
        prettier = await import('prettier');
    } catch (error) {
        if (verbose) {
            logger.debug('Prettier not available, skipping formatting');
        }
        return [];
    }

    // Process all files and gather results
    try {
        const firstFileDir = path.dirname(filePaths[0]);

        // Find the nearest Prettier config file, null if none found
        const prettierConfig =
            options.prettierConfig ||
            (await prettier.resolveConfig(firstFileDir).catch(() => null));

        if (!prettierConfig && verbose) {
            logger.info(
                'No Prettier configuration found, using default settings'
            );
        }

        // Process each file sequentially to avoid potential race conditions
        const results: FormattingResult[] = [];
        for (const filePath of filePaths) {
            results.push(
                await formatSingleFileWithPrettier(
                    filePath,
                    prettier,
                    prettierConfig
                )
            );
        }

        // Log results if verbose
        if (verbose) {
            const successCount = results.filter((r) => r.success).length;
            results.forEach((result) => {
                if (result.success) {
                    logger.info(
                        `✓ Formatted ${path.basename(result.filePath)}`
                    );
                } else {
                    logger.info(
                        `⨯ Skipping ${path.basename(result.filePath)}: ${result.error}`
                    );
                }
            });

            if (successCount > 0) {
                logger.info(
                    `Formatted ${successCount}/${filePaths.length} files`
                );
            }
        }

        // Return only the successfully formatted file paths
        return results
            .filter((result) => result.success)
            .map((result) => result.filePath);
    } catch (error: any) {
        // Fail silently
        if (verbose) {
            logger.error('Error during formatting process:', error);
        }
        return [];
    }
}

/**
 * Internal helper to format a single file with the provided Prettier instance
 *
 * @param filePath - Path to the file to format
 * @param prettier - Prettier module instance
 * @param config - Prettier configuration to use
 * @returns Promise resolving to the formatting result
 */
async function formatSingleFileWithPrettier(
    filePath: string,
    prettier: typeof import('prettier'),
    config: Record<string, unknown> | null
): Promise<FormattingResult> {
    try {
        // Read the file
        const fileContent = await fs.readFile(filePath, 'utf-8');

        // Format with Prettier
        const formatted = await prettier.format(fileContent, {
            ...config,
            filepath: filePath,
        });

        // Write the formatted content back to the file
        await fs.writeFile(filePath, formatted, 'utf-8');

        return {
            filePath,
            success: true,
        };
    } catch (error) {
        return {
            filePath,
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Formats a single file using Prettier with project-specific configuration.
 *
 * This is a convenience function that wraps formatWithPrettier for the common
 * case of formatting just one file. It quietly skips formatting if Prettier
 * is not installed or no configuration can be found.
 *
 * @param filePath - Path to the file to format
 * @param options - Configuration options for the formatter
 * @returns Promise resolving to whether formatting was successful
 */
export async function formatSingleFile(
    filePath: string,
    options: FormatterOptions = {}
): Promise<boolean> {
    const formatted = await formatWithPrettier([filePath], options);
    return formatted.length > 0;
}
