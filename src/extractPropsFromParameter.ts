import {ParsedProp} from './interfaces/ParsedProp';
import normalizePropType from './normalizePropType';
import ts from 'typescript';

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

    const typeText = type.getText();
    if (
        typeText === 'string' ||
        typeText === 'String' ||
        typeText === 'object' ||
        typeText === 'Object' ||
        typeText === 'any'
    ) {
        console.warn(
            `Warning: Attempted to extract props from native type: ${typeText}`
        );
        return [];
    }

    return type.getProperties().map((prop) => {
        const propName = prop.getName();
        const rawType = prop.getTypeAtLocation(param);
        const propType = normalizePropType(rawType);
        const isOptional = prop.hasFlags(ts.SymbolFlags.Optional);

        return {
            name: propName,
            type: propType,
            required: !isOptional,
        };
    });
}

export default extractPropsFromParameter;