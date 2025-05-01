import {ComponentInfo} from './interfaces/ComponentInfo';
import {Node} from 'ts-morph';
import extractPropsFromParameter from './extractPropsFromParameter';
import path from 'path';

/**
 * Creates the ComponentInfo object from the extracted props.
 *
 * @param name name of the component
 * @param params ParameterDeclaration array from node
 * @param filePath file path of source component
 * @returns ComponentInfo object
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
 * Function responsible for determining component name, based on class declaration, function declaration, etc.
 *
 * @param name provided name from AST
 * @param declaration current node in AST
 * @param filePath filepath to source file
 * @returns string name of the component
 */
function determineComponentName(
    name: string,
    declaration: Node,
    filePath: string
): string {
    if (name === 'default') {
        if (Node.isFunctionDeclaration(declaration) && declaration.getName()) {
            return declaration.getName()!;
        }
        // For class declarations
        else if (
            Node.isClassDeclaration(declaration) &&
            declaration.getName()
        ) {
            return declaration.getName()!;
        }
        // For variable declarations (const Component = ...)
        else if (Node.isVariableDeclaration(declaration)) {
            const declarationName = declaration.getName();
            if (declarationName) {
                return declarationName;
            }
        }

        // If we still couldn't determine a better name, use the file name
        if (name === 'default') {
            const fileName = path.basename(filePath, path.extname(filePath));
            return fileName.charAt(0).toUpperCase() + fileName.slice(1);
        }
        return name;
    } else {
        return name;
    }
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
    const componentName = determineComponentName(name, declaration, filePath);

    if (Node.isFunctionDeclaration(declaration)) {
        return buildComponentInfo(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    if (Node.isArrowFunction(declaration)) {
        return buildComponentInfo(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
            return buildComponentInfo(
                componentName,
                initializer.getParameters(),
                filePath
            );
        }
    }

    return null;
}

export default parseComponentDeclaration;
