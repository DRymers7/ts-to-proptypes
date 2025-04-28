import {ComponentInfo} from './interfaces/ComponentInfo';
import {Node} from 'ts-morph';
import extractPropsFromParameter from './extractPropsFromParameter';

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
    // Handle direct function declarations
    if (Node.isFunctionDeclaration(declaration)) {
        const params = declaration.getParameters();
        if (params.length === 0) return null;

        const props = extractPropsFromParameter(params[0]);
        return {name, props, sourceFilePath: filePath};
    }

    // Handle direct arrow functions
    if (Node.isArrowFunction(declaration)) {
        const params = declaration.getParameters();
        if (params.length === 0) return null;

        const props = extractPropsFromParameter(params[0]);
        return {name, props, sourceFilePath: filePath};
    }

    // 🛠 Handle VariableDeclarations whose initializer is an ArrowFunction
    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
            const params = initializer.getParameters();
            if (params.length === 0) return null;

            const props = extractPropsFromParameter(params[0]);
            return {name, props, sourceFilePath: filePath};
        }
    }

    // Not a supported component
    return null;
}

export default parseComponentDeclaration;
