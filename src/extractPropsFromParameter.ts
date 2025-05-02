import {ParsedProp} from './interfaces/ParsedProp';
import normalizePropType from './normalizePropType';
import {SymbolFlags} from 'ts-morph';

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

    type.getProperties().forEach((propSymbol) => {
        const name = propSymbol.getName();
        const rawType = propSymbol.getTypeAtLocation(param);
        const typeName = normalizePropType(rawType);
        const required = !propSymbol.hasFlags(SymbolFlags.Optional);
        props.push({name, type: typeName, required});

        // flatten nested object
        if (rawType.isObject() && !rawType.isArray()) {
            rawType.getProperties().forEach((nestedSym) => {
                const nestedName = nestedSym.getName();
                const nestedType = nestedSym.getTypeAtLocation(param);
                const nestedTypeName = normalizePropType(nestedType);
                const nestedRequired = !nestedSym.hasFlags(
                    SymbolFlags.Optional
                );
                props.push({
                    name: nestedName,
                    type: nestedTypeName,
                    required: nestedRequired,
                });
            });
        }
    });

    return props;
}

export default extractPropsFromParameter;
