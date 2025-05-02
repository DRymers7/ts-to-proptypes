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
    return {name, props, sourceFilePath: filePath};
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
        } else if (
            Node.isClassDeclaration(declaration) &&
            declaration.getName()
        ) {
            return declaration.getName()!;
        } else if (Node.isVariableDeclaration(declaration)) {
            return declaration.getName();
        }
        // fallback to file name
        const base = path.basename(filePath, path.extname(filePath));
        return base.charAt(0).toUpperCase() + base.slice(1);
    }
    return name;
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

    // function declarations
    if (Node.isFunctionDeclaration(declaration)) {
        return buildComponentInfo(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    // arrow functions
    if (Node.isArrowFunction(declaration)) {
        return buildComponentInfo(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    // variable = () =>
    if (Node.isVariableDeclaration(declaration)) {
        const init = declaration.getInitializer();
        if (init && Node.isArrowFunction(init)) {
            return buildComponentInfo(
                componentName,
                init.getParameters(),
                filePath
            );
        }
    }

    // class components
    if (Node.isClassDeclaration(declaration)) {
        const tparams = declaration.getTypeParameters();
        if (tparams?.[0]) {
            // hack: TS-morph doesn't give ParameterDeclaration for type params;
            // assume first type param extends Props interface, so we need custom extraction
            const propsTypeNode = tparams[0].getConstraintOrThrow();
            // build a fake parameter if needed; here just skip to null if unsupported
            const fakeParam = {
                getType: () => propsTypeNode.getType(),
                hasFlags: () => false,
            } as any;
            const props = extractPropsFromParameter(fakeParam as any);
            return {name: componentName, props, sourceFilePath: filePath};
        }
    }

    return null;
}

export default parseComponentDeclaration;
