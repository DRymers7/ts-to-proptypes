import {normalizePropType} from './normalizePropType';
import {ParameterDeclaration, Symbol, SymbolFlags, Type} from 'ts-morph';
import {NormalizedPropType} from '../types/types';

/**
 * Interface representation of a Prop. Should consist of:
 * 1. Prop name as str
 * 2. Prop type as NormalizedPropType type
 * 3. Required (boolean)
 */
export interface ParsedProp {
    name: string;
    type: NormalizedPropType;
    required: boolean;
}

/**
 * Extracts prop type information from a React component parameter declaration.
 *
 * This function analyzes TypeScript type information to extract prop types and their
 * characteristics (name, required status, and normalized type representation). It also
 * recursively extracts nested properties from object types.
 *
 * @param param - The parameter declaration object from ts-morph, typically the props parameter
 * @returns An array of parsed prop information with normalized type representations
 * 
 * @example
 * ```typescript
 * import { Project } from 'ts-morph';
 * 
 * const project = new Project();
 * const sourceFile = project.createSourceFile('temp.tsx', `
 *   type Props = { name: string; count?: number; };
 *   function MyComponent({ name, count }: Props) { return null; }
 * `);
 * 
 * const component = sourceFile.getFunctions()[0];
 * const propsParam = component.getParameters()[0];
 * const props = extractPropsFromParameter(propsParam);
 * // Result: [
 * //   { name: 'name', type: { kind: 'primitive', name: 'string' }, required: true },
 * //   { name: 'count', type: { kind: 'primitive', name: 'number' }, required: false }
 * // ]
 * ```
 */
function extractPropsFromParameter(param: ParameterDeclaration): ParsedProp[] {
    const rootType = param.getType();

    /**
     * Recursive function to extract props from a type, including nested properties
     *
     * @param propType - The TypeScript type to extract props from
     * @param parentRequired - Whether the parent prop is required
     * @returns Array of parsed props from this type and its nested types
     */
    const extractPropsFromType = (
        propType: Type,
        parentRequired: boolean = true
    ): ParsedProp[] => {
        // Extract direct properties from the type
        const directProps = propType.getProperties().map((propSymbol) => {
            const name = propSymbol.getName();
            const rawType = propSymbol.getTypeAtLocation(param);
            const isRequired =
                !propSymbol.hasFlags(SymbolFlags.Optional) && parentRequired;

            // For optional properties, we want to just set the required flag to false
            // but still use the correct type (not the union with undefined)
            return {
                name,
                type: normalizePropType(rawType),
                required: isRequired,
                symbol: propSymbol,
                rawType,
            };
        });

        // For each direct prop that is an object type, extract nested props
        const nestedProps = directProps
            .filter(
                (prop) => prop.rawType.isObject() && !prop.rawType.isArray()
            )
            .flatMap((prop) =>
                extractPropsFromType(prop.rawType, prop.required)
            );

        // Return all props without the temporary metadata
        return [...directProps, ...nestedProps].map(
            ({name, type, required}) => ({
                name,
                type,
                required,
            })
        );
    };

    return extractPropsFromType(rootType);
}

export default extractPropsFromParameter;