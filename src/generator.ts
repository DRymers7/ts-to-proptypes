import {ComponentInfo} from './interfaces/ComponentInfo';
import {ParsedProp} from './interfaces/ParsedProp';
import {typeMap} from './types';
import {NormalizedPropType} from './types';

/**
 * Generates the PropTypes validator string based on the normalized type
 *
 * @param normalizedType The normalized prop type
 * @returns String representation of the PropType validator
 */
function generatePropTypeValidator(normalizedType: NormalizedPropType): string {
    switch (normalizedType.kind) {
        case 'primitive':
            return normalizedType.name === 'boolean'
                ? 'PropTypes.bool'
                : `PropTypes.${normalizedType.name}`;

        case 'array':
            return 'PropTypes.array';

        case 'object':
            return 'PropTypes.object';

        case 'function':
            return 'PropTypes.func';

        case 'oneOf':
            const values = normalizedType.values
                .map((value) =>
                    typeof value === 'string' ? `'${value}'` : String(value)
                )
                .join(', ');
            return `PropTypes.oneOf([${values}])`;

        case 'oneOfType':
            const types = normalizedType.types
                .map((type) => generatePropTypeValidator(type))
                .join(', ');
            return `PropTypes.oneOfType([${types}])`;

        case 'any':
            return 'PropTypes.any';
    }
}

/**
 * Maps a given prop type to the correct prop reference for JSX/TSX, and
 * returns a string that can be used to build the final component string.
 *
 * @param parsedProp ParsedProp from the array of parsed props in componentInfo
 * @returns string value of mapped prop
 */
function mapFromTypeMap(parsedProp: ParsedProp): string {
    const propType = generatePropTypeValidator(parsedProp.type);
    return parsedProp.required ? `${propType}.isRequired` : propType;
}

/**
 * Accepts the extracted props and component information, and generates
 * a string of the component, with the .PropTypes attributes filled in.
 *
 * @param componentInfo ComponentInfo interface created from parser
 * @returns string value of a component, to be written into a file later.
 */
function generateComponentString(componentInfo: ComponentInfo): string {
    const lines = componentInfo.props.map((prop) => {
        const propStringValue = mapFromTypeMap(prop);
        return `  ${prop.name}: ${propStringValue},`;
    });

    return `${componentInfo.name}.propTypes = {\n${lines.join('\n')}\n};`;
}

export default generateComponentString;
