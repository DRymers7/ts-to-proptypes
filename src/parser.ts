import {ComponentInfo} from './interfaces/ComponentInfo';
import {ExportedDeclarations, SourceFile, Node} from 'ts-morph';
import ts from 'typescript';
import {ParsedProp} from './interfaces/ParsedProp';

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

/**
 * Parses the given component declaration, differentiating between Functions/ArrowFunctions
 * and Class Declarations.
 *
 * @param name key value from exported declarations readonly map
 * @param declaration individual declaration from ExportedDeclarations array for this key in the map.
 * @param filePath filepath of the original source file.
 * @returns Array of componentInfo, or null, if nothing is able to be extracted.
 */
function parseComponentDeclaration(
    name: string,
    declaration: Node,
    filePath: string
): ComponentInfo | null {
    if (
        Node.isFunctionDeclaration(declaration) ||
        Node.isArrowFunction(declaration)
    ) {
        const params = declaration.getParameters();
        if (params.length === 0) return null;

        const props = extractPropsFromParameter(params[0]);

        return {
            name,
            props,
            sourceFilePath: filePath,
        };
    } else if (Node.isClassDeclaration(declaration)) {
        // TODO: implement class declaration extraction for props
        return null;
    } 
    return null;
}

/**
 * Extracts props from a given parameter declaration.
 *
 * @param param first element (typically the prop) in the parameter declaration array
 * @returns array of parsed props
 */
function extractPropsFromParameter(
    param: import('ts-morph').ParameterDeclaration
): ParsedProp[] {
    const type = param.getType();

    return type.getProperties().map((prop) => {
        const propName = prop.getName();
        const rawType = prop.getTypeAtLocation(param).getText();
        const propType = normalizePropType(rawType);
        const isOptional = prop.hasFlags(ts.SymbolFlags.Optional);

        return {
            name: propName,
            type: propType,
            required: !isOptional,
        };
    });
}

/**
 * Normalizes prop type to ensure that users get a more predictable CLI output. This is
 * also included to help later extension to other types. Will fallback to 'any' type if
 * given prop type is not found.
 *
 * @param typeString raw string value returned from prop call to .getTypeAtLocation(param).getText()
 * @returns string value of prop type, normalized for easier use
 */
function normalizePropType(typeString: string): string {
    if (typeString.startsWith('string')) return 'string';
    if (typeString.startsWith('number')) return 'number';
    if (typeString.startsWith('boolean')) return 'boolean';
    if (typeString.startsWith('Array') || typeString.endsWith('[]'))
        return 'array';
    if (typeString.startsWith('Record') || typeString.startsWith('object'))
        return 'object';
    if (typeString.startsWith('Function') || typeString.includes('=>'))
        return 'function';
    return 'any';
}

export {parseComponents};
