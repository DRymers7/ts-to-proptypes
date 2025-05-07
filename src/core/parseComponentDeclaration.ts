import {ComponentInfo} from './parser';
import {
    Node,
    ParameterDeclaration,
    FunctionDeclaration,
    ArrowFunction,
    ClassDeclaration,
    VariableDeclaration,
    TypeParameterDeclaration,
} from 'ts-morph';
import extractPropsFromParameter from './extractPropsFromParameter';
import path from 'path';

/**
 * Possible component declaration types that can be parsed
 */
type ComponentDeclarationType =
    | FunctionDeclaration
    | ArrowFunction
    | VariableDeclaration
    | ClassDeclaration;

/**
 * Determines component name based on declaration type and export name.
 * For default exports, extracts the name from the declaration or falls back to the filename.
 *
 * @param exportName - The name from the export declaration
 * @param declaration - The AST node of the component declaration
 * @param filePath - Path to the source file
 * @returns The resolved component name
 */
function determineComponentName(
    exportName: string,
    declaration: Node,
    filePath: string
): string {
    // Handle non-default exports directly
    if (exportName !== 'default') {
        return exportName;
    }

    // Extract name from function declarations
    if (Node.isFunctionDeclaration(declaration)) {
        const name = declaration.getName();
        if (name) return name;
    }

    // Extract name from class declarations
    else if (Node.isClassDeclaration(declaration)) {
        const name = declaration.getName();
        if (name) return name;
    }

    // Extract name from variable declarations
    else if (Node.isVariableDeclaration(declaration)) {
        return declaration.getName();
    }

    // Fallback to capitalized filename
    const filename = path.basename(filePath, path.extname(filePath));
    return filename.charAt(0).toUpperCase() + filename.slice(1);
}

/**
 * Extracts component props from function component parameters
 *
 * @param componentName - Name of the component
 * @param parameters - The parameter declarations from the function
 * @param filePath - Path to the source file
 * @returns Component info object or null if no props could be extracted
 */
function extractPropsFromFunctionComponent(
    componentName: string,
    parameters: ParameterDeclaration[],
    filePath: string
): ComponentInfo | null {
    if (parameters.length === 0) {
        return null;
    }

    const props = extractPropsFromParameter(parameters[0]);
    return {
        name: componentName,
        props,
        sourceFilePath: filePath,
    };
}

/**
 * Extracts component props from class component type parameters
 *
 * @param componentName - Name of the component
 * @param typeParameters - The type parameters from the class
 * @param filePath - Path to the source file
 * @returns Component info object or null if no props could be extracted
 */
function extractPropsFromClassComponent(
    componentName: string,
    typeParameters: TypeParameterDeclaration[] | undefined,
    filePath: string
): ComponentInfo | null {
    // Check if we have type parameters (like in React.Component<Props>)
    if (!typeParameters || typeParameters.length === 0) {
        return null;
    }

    try {
        // Get the first type parameter constraint (the Props interface)
        const propsTypeNode = typeParameters[0].getConstraint();
        if (!propsTypeNode) {
            return null;
        }

        // Create an adapter to extract props from the type
        const propsAdapter: Pick<ParameterDeclaration, 'getType'> = {
            getType: () => propsTypeNode.getType(),
        };

        const props = extractPropsFromParameter(
            propsAdapter as ParameterDeclaration
        );
        return {
            name: componentName,
            props,
            sourceFilePath: filePath,
        };
    } catch (error) {
        // If we can't extract the props, return null
        return null;
    }
}

/**
 * Parses a React component declaration and extracts its props.
 *
 * This function analyzes different types of React component declarations (function
 * components, arrow function components, class components) and extracts their props
 * into a standardized ComponentInfo structure.
 *
 * @param exportName - The name from the export declaration
 * @param declaration - The AST node of the component declaration
 * @param filePath - Path to the source file
 * @returns Component info object or null if not a valid component
 * 
 * @example
 * ```typescript
 * import { Project } from 'ts-morph';
 * 
 * const project = new Project();
 * const sourceFile = project.createSourceFile('temp.tsx', `
 *   export function Button({ label }: { label: string }) {
 *     return <button>{label}</button>;
 *   }
 * `);
 * 
 * const exportedDecls = sourceFile.getExportedDeclarations();
 * const buttonDecl = exportedDecls.get('Button')?.[0];
 * 
 * if (buttonDecl) {
 *   const componentInfo = parseComponentDeclaration('Button', buttonDecl, 'temp.tsx');
 *   // Now we have the component info with props
 * }
 * ```
 */
function parseComponentDeclaration(
    exportName: string,
    declaration: Node,
    filePath: string
): ComponentInfo | null {
    const componentName = determineComponentName(
        exportName,
        declaration,
        filePath
    );

    // Handle function declarations
    if (Node.isFunctionDeclaration(declaration)) {
        return extractPropsFromFunctionComponent(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    // Handle arrow functions
    if (Node.isArrowFunction(declaration)) {
        return extractPropsFromFunctionComponent(
            componentName,
            declaration.getParameters(),
            filePath
        );
    }

    // Handle variable declarations with arrow function initializers
    if (Node.isVariableDeclaration(declaration)) {
        const initializer = declaration.getInitializer();
        if (initializer && Node.isArrowFunction(initializer)) {
            return extractPropsFromFunctionComponent(
                componentName,
                initializer.getParameters(),
                filePath
            );
        }
    }

    // Handle class components
    if (Node.isClassDeclaration(declaration)) {
        return extractPropsFromClassComponent(
            componentName,
            declaration.getTypeParameters(),
            filePath
        );
    }

    // Not a recognized component type
    return null;
}

export default parseComponentDeclaration;
