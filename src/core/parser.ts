import {ExportedDeclarations, Node, SourceFile} from 'ts-morph';
import parseComponentDeclaration from './parseComponentDeclaration';
import {ParsedProp} from './extractPropsFromParameter';
import { ParsingError } from '../types/error-types';

/**
 * Interface representation of parsed component information. Should consist of:
 * 1. Component name as string
 * 2. List of parsed props in the component (functional or class)
 * 3. Path to source file as string
 */
export interface ComponentInfo {
    name: string;
    props: ParsedProp[];
    sourceFilePath: string;
}

/**
 * Export entry containing a name and its associated declarations
 */
type ExportEntry = [string, ExportedDeclarations[]];

/**
 * Extracts React component information from a single export entry
 *
 * @param entry - The export entry (name and declarations)
 * @param filePath - Path to the source file
 * @returns Array of component info objects
 */
function parseExportEntry(
    entry: ExportEntry,
    filePath: string
): ComponentInfo[] {
    const [name, declarations] = entry;

    return declarations
        .map((declaration) =>
            parseComponentDeclaration(name, declaration, filePath)
        )
        .filter((component): component is ComponentInfo => component !== null);
}

/**
 * Parses a TypeScript source file to extract React component information.
 *
 * This function analyzes all exported declarations in a source file to identify
 * React components and extract their props. It supports function components,
 * arrow function components, and class components.
 *
 * @param sourceFile - The TypeScript source file to parse
 * @returns Array of component information objects containing component names,
 *          props, and source file paths
 * 
 * @example
 * ```typescript
 * import { Project } from 'ts-morph';
 * import { parseComponents } from 'ts-to-proptypes';
 * 
 * const project = new Project();
 * const sourceFile = project.addSourceFileAtPath('./MyComponent.tsx');
 * const components = parseComponents(sourceFile);
 * ```
 */
function parseComponents(sourceFile: SourceFile): ComponentInfo[] {
    try {
        const filePath = sourceFile.getFilePath();
        const exports = sourceFile.getExportedDeclarations();
        const exportEntries = Array.from(exports.entries());
        return exportEntries.flatMap((entry) => parseExportEntry(entry, filePath));
    } catch (error) {
        throw new ParsingError(
            error instanceof Error ? error.message : String(error),
            sourceFile.getFilePath()
        )
    }
}

export {parseComponents};
