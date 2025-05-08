#!/usr/bin/env node
import {logger, LogLevel} from '../utils/logger'
import {Project, SourceFile} from 'ts-morph';
import {Command} from 'commander';
import path from 'path';
import {parseComponents} from '../core/parser';
import {createSourceFile} from '../core/writer';
import {ComponentInfo} from '../core/parser';
import {WriteOptions} from '../types/types';

/**
 * CLI configuration options
 */
interface CliOptions extends WriteOptions {
    /** Glob pattern for source files */
    source: string;
}

/**
 * Base result of processing a source file
 */
interface BaseFileProcessingResult {
    /** Path to the processed file */
    filePath: string;
    /** Number of components found */
    componentCount: number;
    /** Whether processing was successful */
    success: boolean;
}

/**
 * Successful result of processing a source file
 */
interface SuccessfulFileProcessingResult extends BaseFileProcessingResult {
    success: true;
    /** Components found in the file */
    components: ComponentInfo[];
}

/**
 * Failed result of processing a source file
 */
interface FailedFileProcessingResult extends BaseFileProcessingResult {
    success: false;
    /** Error message */
    error: string;
}

/**
 * Combined type for file processing results
 */
type FileProcessingResult =
    | SuccessfulFileProcessingResult
    | FailedFileProcessingResult;

/**
 * Configures the command-line interface and parses arguments
 *
 * @returns Parsed CLI options
 */
function configureCommandLine(): CliOptions {
    const program = new Command()
        .name('ts-proptypes-gen')
        .description(
            'Generate PropTypes declarations from TypeScript React components'
        )
        .option(
            '-s, --source <pattern>',
            'Glob pattern for source files',
            'src/**/*.tsx'
        )
        .option(
            '-o, --outDir <directory>',
            'Directory to place generated files'
        )
        .option('--inline', 'Append PropTypes into the original files')
        .option('--prettier', 'Format generated files using Prettier')
        .version('1.0.0');

    program.parse();
    return program.opts<CliOptions>();
}

/**
 * Filters source files to exclude internal package files
 *
 * @param sourceFiles - All source files found by the glob pattern
 * @param packageDir - Absolute path to the package root directory
 * @param sourceGlob - Glob pattern specified by the user
 * @returns Filtered array of source files to process
 */
function filterSourceFiles(
    sourceFiles: readonly SourceFile[],
    packageDir: string,
    sourceGlob: string
): SourceFile[] {    
    // Get the base directory of the source glob (everything before the first wildcard)
    const globBasePath = sourceGlob.split('*')[0];
    const absoluteGlobBasePath = path.resolve(globBasePath);
    
    logger.info(`Source glob base path: ${absoluteGlobBasePath}`);
    
    return sourceFiles.filter((file) => {
        const filePath = file.getFilePath();
        
        // Only include files that are within the glob base directory
        const shouldInclude = filePath.startsWith(absoluteGlobBasePath);
        
        // Exclude any files from src/ directory unless explicitly targeted
        const isSrcFile = filePath.includes(`${path.sep}src${path.sep}`) && 
                          !filePath.includes(absoluteGlobBasePath);
        
        if (isSrcFile) {
            logger.debug(`Excluding source file: ${filePath}`);
            return false;
        }
        
        if (!shouldInclude) {
            logger.debug(`File outside target directory: ${filePath}`);
            return false;
        }
        
        return true;
    });
}

/**
 * Processes a single source file to extract components
 *
 * This function parses a TypeScript source file to identify React components
 * and extract their props. It provides structured result information including
 * success status, component count, and error details if applicable.
 *
 * @param sourceFile - The source file to process
 * @returns Processing result with component information or error details
 */
async function processSourceFile(
    sourceFile: SourceFile
): Promise<FileProcessingResult> {
    try {
        const filePath = sourceFile.getFilePath();
        const components = parseComponents(sourceFile);

        if (components.length === 0) {
            logger.warn(`No components found in: ${filePath}`);
        } else {
            logger.info(
                `Found ${components.length} components in: ${filePath}`
            );
        }

        return {
            filePath,
            componentCount: components.length,
            success: true,
            components,
        };
    } catch (error: any) {
        logger.error(`Error processing ${sourceFile.getFilePath()}: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            filePath: sourceFile.getFilePath(),
            componentCount: 0,
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Generates PropTypes files for the components in a source file
 *
 * This function takes the components extracted from a source file and generates
 * PropTypes declarations for each one, writing them to output files according
 * to the specified options.
 *
 * @param fileResult - Result of processing a source file
 * @param project - The ts-morph Project instance
 * @param options - Write options for file generation
 * @returns Number of successfully generated files
 */
async function generatePropTypesFiles(
    fileResult: SuccessfulFileProcessingResult,
    project: Project,
    options: WriteOptions
): Promise<number> {
    const {components} = fileResult;

    if (components.length === 0) {
        return 0;
    }

    let successCount = 0;

    for (const component of components) {
        if (!component.props || component.props.length === 0) {
            logger.info(`Skipping ${component.name}: No props found`);
            continue;
        }

        try {
            const result = await createSourceFile(component, project, options);

            if (result.success) {
                logger.info(`Generated PropTypes for ${component.name}`);
                successCount++;
            } else {
                logger.warn(
                    `Failed to generate PropTypes for ${component.name}: ${result.error}`
                );
            }
        } catch (error: any) {
            logger.error(
                `Error generating PropTypes for ${component.name}:`,
                error
            );
        }
    }

    return successCount;
}

/**
 * Main entry point for the CLI application
 *
 * This function orchestrates the process of parsing TypeScript React components
 * and generating PropTypes declarations based on the provided command-line options.
 * It handles source file discovery, component extraction, PropTypes generation,
 * and file output.
 * 
 * The workflow is:
 * 1. Parse command-line arguments
 * 2. Setup the TypeScript project and file filtering
 * 3. Process each source file to extract components
 * 4. Generate PropTypes for each component
 * 5. Write the results to output files or inline
 * 
 * @throws If there are fatal errors during execution
 */
async function main(): Promise<void> {
    try {
        // Parse command-line arguments
        const options = configureCommandLine();

        // Create a ts-morph project
        const project = new Project({
            tsConfigFilePath: 'tsconfig.json',
        });

        // Add source files matching the pattern
        project.addSourceFilesAtPaths([options.source]);

        // Filter out internal files
        const packageDir = path.resolve(__dirname, '..');
        const sourceFiles = filterSourceFiles(
            project.getSourceFiles(),
            packageDir,
            options.source
        );

        logger.info(`Processing ${sourceFiles.length} source files...`);

        // Process each source file
        let totalComponents = 0;
        let totalGeneratedFiles = 0;

        for (const sourceFile of sourceFiles) {
            const fileResult = await processSourceFile(sourceFile);

            if (fileResult.success) {
                totalComponents += fileResult.componentCount;
                totalGeneratedFiles += await generatePropTypesFiles(
                    fileResult,
                    project,
                    options
                );
            } else {
                logger.error(
                    `Error processing ${fileResult.filePath}: ${fileResult.error}`,
                );
            }
        }

        // Save any changes to project files
        await project.save();

        if (options.inline) {
            await project.save();
        }

        logger.info('');
        logger.info('Summary:');
        logger.info(`Processed ${sourceFiles.length} files`);
        logger.info(`Found ${totalComponents} components`);
        logger.info(`Generated ${totalGeneratedFiles} PropTypes declarations`);
    } catch (error: any) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}

// Execute the main function
main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
});
