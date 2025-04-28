import {ComponentInfo} from './interfaces/ComponentInfo';
import {Node} from 'ts-morph';
import extractPropsFromParameter from './extractPropsFromParameter';

/**
 * Creates the ComponentInfo object from the extracted props.
 *
 * @param name // todo
 * @param params
 * @param filePath
 * @returns
 */
function buildComponentInfo(
    name: string,
    params: import('ts-morph').ParameterDeclaration[],
    filePath: string
): ComponentInfo | null {
    if (params.length === 0) return null;

    const props = extractPropsFromParameter(params[0]);
    return {
        name,
        props,
        sourceFilePath: filePath,
    };
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
    if (Node.isFunctionDeclaration(declaration)) {
        return buildComponentInfo(name, declaration.getParameters(), filePath);
    }

    if (Node.isArrowFunction(declaration)) {
        return buildComponentInfo(name, declaration.getParameters(), filePath);
    }

    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
            return buildComponentInfo(
                name,
                initializer.getParameters(),
                filePath
            );
        }
    }

    return null;
}

export default parseComponentDeclaration;
