import {CodeBlockWriter, Project} from 'ts-morph';
import generateComponentString from './generator';
import {ComponentInfo} from './parser';
import {WriteOptions} from '../types/types';
import {formatSingleFile} from '../utils/formatter';
import path from 'path';
import {SourceFile} from 'ts-morph';
import { logger } from '../utils/logger';

/**
 * Result of the file creation operation
 */
interface FileCreationResult {
    /** Whether the operation was successful */
    success: boolean;
    /** Path to the created or modified file */
    filePath: string;
    /** Error message if any */
    error?: string;
}

/**
 * Determines the output file path based on component info and options
 *
 * @param componentInfo - Information about the component
 * @param options - Write configuration options
 * @returns The resolved output file path
 */
function resolveOutputPath(
    componentInfo: ComponentInfo,
    options: WriteOptions
): string {
    const sourcePath = componentInfo.sourceFilePath;

    // If inline mode is enabled, use the source file path
    if (options.inline) {
        return sourcePath;
    }

    // Otherwise create a new .propTypes.ts file
    const baseOutputPath = sourcePath.replace(/\.tsx?$/, '.propTypes.ts');

    // If outDir is specified, move the file to that directory
    if (options.outDir) {
        const fileName = path.basename(baseOutputPath);
        return path.join(options.outDir, fileName);
    }

    return baseOutputPath;
}

/**
 * Adds PropTypes import to a source file if it doesn't exist
 *
 * @param file - The source file to modify
 */
function ensurePropTypesImport(file: SourceFile): void {
    if (!file.getImportDeclaration('prop-types')) {
        file.addImportDeclaration({
            moduleSpecifier: 'prop-types',
            defaultImport: 'PropTypes',
        });
    }
}

/**
 * Creates or updates a source file with PropTypes declarations for a React component.
 *
 * This function generates PropTypes declarations from component information and
 * writes them to a file. It can either create a new .propTypes.ts file or append
 * the declarations to the original component file based on the options provided.
 *
 * If the prettier option is enabled, the generated file will be formatted using
 * the project's Prettier configuration (if available).
 *
 * @param componentInfo - Information about the component and its props
 * @param project - The ts-morph Project instance
 * @param options - Configuration options for the file writing operation
 * @returns Promise resolving to the result of the file creation
 *
 * @example
 * ```typescript
 * import { Project } from 'ts-morph';
 * import { createSourceFile } from 'ts-to-proptypes';
 * 
 * const project = new Project();
 * const componentInfo = {
 *   name: 'Button',
 *   props: [
 *     { name: 'label', type: { kind: 'primitive', name: 'string' }, required: true }
 *   ],
 *   sourceFilePath: './Button.tsx'
 * };
 * 
 * // Create a separate PropTypes file
 * await createSourceFile(componentInfo, project, { outDir: './generated' });
 * 
 * // Append PropTypes to the original file and format with Prettier
 * await createSourceFile(componentInfo, project, { inline: true, prettier: true });
 * ```
 */
async function createSourceFile(
    componentInfo: ComponentInfo,
    project: Project,
    options: WriteOptions
): Promise<FileCreationResult> {
    try {
        // Skip components without props
        if (!componentInfo.props.length) {
            return {
                success: false,
                filePath: componentInfo.sourceFilePath,
                error: 'Component has no props',
            };
        }

        // Determine the output file path
        const sourcePath = componentInfo.sourceFilePath;
        const outputPath = resolveOutputPath(componentInfo, options);

        // Get or create the source file
        const file = options.inline
            ? project.getSourceFileOrThrow(sourcePath)
            : project.createSourceFile(outputPath, '', {overwrite: true});

        // Add PropTypes import if needed
        ensurePropTypesImport(file);

        // Generate and add PropTypes declaration
        const propTypesDeclaration = generateComponentString(componentInfo);
        file.addStatements((writer) => writer.write(propTypesDeclaration));

        // Save the file
        await file.save();

        // Format the file if requested
        if (options.prettier) {
            await formatSingleFile(outputPath);
        }

        return {
            success: true,
            filePath: outputPath,
        };
    } catch (error) {
        logger.error(`Error creating PropTypes for ${componentInfo.name}`);
        return {
            success: false,
            filePath: componentInfo.sourceFilePath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

export {createSourceFile};
