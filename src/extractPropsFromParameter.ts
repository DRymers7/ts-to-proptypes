import {ParsedProp} from './interfaces/ParsedProp';
import normalizePropType from './normalizePropType';
import {SymbolFlags, Type} from 'ts-morph';

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
    const props: ParsedProp[] = [];

    function extractNestedProps(propType: Type, propName: string, required: boolean) {
        if (propType.isObject() && !propType.isArray()) {
            propType.getProperties().forEach((nestedSym) => {
                const nestedName = nestedSym.getName();
                const nestedType = nestedSym.getTypeAtLocation(param);
                const nestedNormalizedType = normalizePropType(nestedType);
                const nestedRequired = !nestedSym.hasFlags(
                    SymbolFlags.Optional
                ) && required; // Inherit parent's required status
                
                props.push({
                    name: nestedName,
                    type: nestedNormalizedType,
                    required: nestedRequired,
                });
                
                // Recursively extract deeper nested props
                extractNestedProps(nestedType, nestedName, nestedRequired);
            });
        }
    }

    type.getProperties().forEach((propSymbol) => {
        const name = propSymbol.getName();
        const rawType = propSymbol.getTypeAtLocation(param);
        const normalizedType = normalizePropType(rawType);
        const required = !propSymbol.hasFlags(SymbolFlags.Optional);
        
        props.push({name, type: normalizedType, required});
        
        // Extract nested properties
        extractNestedProps(rawType, name, required);
    });

    return props;
}

export default extractPropsFromParameter;
