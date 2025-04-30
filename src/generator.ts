import {ComponentInfo} from './interfaces/ComponentInfo';
import {ParsedProp} from './interfaces/ParsedProp';
import {typeMap} from './types';

/**
 * Maps a given prop type to the correct prop reference for JSX/TSX, and
 * returns a string that can be used to build the final component string.
 *
 * @param parsedProps ParsedProp from the array of parsed props in componentInfo
 * @returns string value of mapped prop
 */
function mapFromTypeMap(parsedProp: ParsedProp): string {
    const typeValue = typeMap[parsedProp.type] ?? typeMap['any'];
    return parsedProp.required ? `${typeValue}.isRequired` : typeValue;
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