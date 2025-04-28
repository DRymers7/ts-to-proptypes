import { ComponentInfo } from "./interfaces/ComponentInfo";
import { Node } from "ts-morph";
import extractPropsFromParameter from "./extractPropsFromParameter";

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

export default parseComponentDeclaration;