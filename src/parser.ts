import { ComponentInfo } from "./interfaces/ComponentInfo";
import { ExportedDeclarations, SourceFile } from "ts-morph";
import { DECLARATIONS } from "./constants";

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
async function parseComponents(sourceFile: SourceFile): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    const exports: ReadonlyMap<string, ExportedDeclarations[]> = sourceFile.getExportedDeclarations();
    for (const [name, declarations] of exports.entries()) {
        for (const declaration of declarations) {
            const kind = declaration.getKindName();
            if (kind === DECLARATIONS.FUNCTION_DECLARATION ||
                kind === DECLARATIONS.ARROW_FUNCTION ||
                kind === DECLARATIONS.CLASS_DECLARATION) {
                    console.log("Found exported kind: ${}", kind);
                    const extractedProps = extractPropsFromComponent(declaration);
            }
        }   
    }
    return components;
}

/**
 * Placeholder: todo
 * 
 * @param declaration 
 */
function extractPropsFromComponent(declaration: ExportedDeclarations) {

}


export {parseComponents};
