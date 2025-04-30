import {ComponentInfo} from './interfaces/ComponentInfo';
import {ExportedDeclarations, SourceFile} from 'ts-morph';
import parseComponentDeclaration from './parseComponentDeclaration';

// 1. load and parse the file
// 2. walk AST looking for function and class components
// 3. for each function, find the first parameter for func components or props type for class
// 4. parse each prop to get the type (string, num, etc.) and whether it is required
// return structured data (list of compoentInfo) objects

/**
 * Loops through all ExportedDeclarations in the given source file, and extracts props
 * if that declaration is a:
 * - Function Declaration
 * - Arrow Function
 * - Class Declaration
 *
 * @param sourceFile Source file object from ts-morph, passed in from entrypoint
 * @returns ComponentInfo[] with extracted prop information.
 */
async function parseComponents(
    sourceFile: SourceFile
): Promise<ComponentInfo[]> {
    const exports: ReadonlyMap<string, ExportedDeclarations[]> =
        sourceFile.getExportedDeclarations();

    return Array.from(exports.entries()).flatMap(([name, declarations]) =>
        declarations
            .map((declaration) =>
                parseComponentDeclaration(
                    name,
                    declaration,
                    sourceFile.getFilePath()
                )
            )
            .filter((c): c is ComponentInfo => c !== null)
    );
}

export {parseComponents};
