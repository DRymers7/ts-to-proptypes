import {ComponentInfo} from './interfaces/ComponentInfo';
import {ExportedDeclarations, SourceFile} from 'ts-morph';
import parseComponentDeclaration from './parseComponentDeclaration';

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
            .filter(
                (component): component is ComponentInfo => component !== null
            )
    );
}

export {parseComponents};
