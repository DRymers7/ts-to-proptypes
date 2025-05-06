#!/usr/bin/env node
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
    // Create a normalized version of the glob pattern for comparison
    const normalizedGlob = sourceGlob.replace(/\*/g, '');

    return sourceFiles.filter((file) => {
        const filePath = file.getFilePath();

        // Skip internal library files unless explicitly targeted
        const isInternalFile =
            filePath.startsWith(`${packageDir}/src/`) &&
            !filePath.includes(normalizedGlob);

        if (isInternalFile) {
            console.log(`Skipping internal file: ${filePath}`);
            return false;
        }

        return true;
    });
}

/**
 * Processes a single source file to extract components
 *
 * @param sourceFile - The source file to process
 * @returns Processing result with component information
 */
async function processSourceFile(
    sourceFile: SourceFile
): Promise<FileProcessingResult> {
    try {
        const filePath = sourceFile.getFilePath();
        const components = parseComponents(sourceFile);

        if (components.length === 0) {
            console.warn(`No components found in: ${filePath}`);
        } else {
            console.log(
                `Found ${components.length} components in: ${filePath}`
            );
        }

        return {
            filePath,
            componentCount: components.length,
            success: true,
            components,
        };
    } catch (error) {
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
            console.log(`Skipping ${component.name}: No props found`);
            continue;
        }

        try {
            const result = await createSourceFile(component, project, options);

            if (result.success) {
                console.log(`Generated PropTypes for ${component.name}`);
                successCount++;
            } else {
                console.warn(
                    `Failed to generate PropTypes for ${component.name}: ${result.error}`
                );
            }
        } catch (error) {
            console.error(
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

        console.log(`Processing ${sourceFiles.length} source files...`);

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
                console.error(
                    `Error processing ${fileResult.filePath}: ${fileResult.error}`
                );
            }
        }

        // Save any changes to project files
        await project.save();

        if (options.inline) {
            await project.save();
        }

        console.log('');
        console.log('Summary:');
        console.log(`Processed ${sourceFiles.length} files`);
        console.log(`Found ${totalComponents} components`);
        console.log(`Generated ${totalGeneratedFiles} PropTypes declarations`);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Execute the main function
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
