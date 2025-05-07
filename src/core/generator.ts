import {ComponentInfo} from './parser';
import {ParsedProp} from './extractPropsFromParameter';
import {NormalizedPropType} from '../types/types';
import {PROP_TYPE_VALIDATORS} from '../constants';

/**
 * Generates the PropTypes declaration string for a React component.
 *
 * This function takes the component information with parsed props and generates
 * a complete PropTypes declaration that can be added to the component file.
 * It handles different prop types and their required/optional status.
 *
 * @param componentInfo - Information about the component and its props
 * @returns A string containing the complete PropTypes declaration
 * 
 * @example
 * ```typescript
 * import { generateComponentString } from 'ts-to-proptypes';
 * 
 * const componentInfo = {
 *   name: 'Button',
 *   props: [
 *     { name: 'label', type: { kind: 'primitive', name: 'string' }, required: true },
 *     { name: 'onClick', type: { kind: 'function' }, required: true },
 *     { name: 'disabled', type: { kind: 'primitive', name: 'boolean' }, required: false }
 *   ],
 *   sourceFilePath: './Button.tsx'
 * };
 * 
 * const propTypesString = generateComponentString(componentInfo);
 * // Result:
 * // Button.propTypes = {
 * //   label: PropTypes.string.isRequired,
 * //   onClick: PropTypes.func.isRequired,
 * //   disabled: PropTypes.bool,
 * // };
 * ```
 */
function generatePropTypeValidator(normalizedType: NormalizedPropType): string {
    const {kind} = normalizedType;

    // Handle each type kind with its specific generator
    switch (kind) {
        case 'primitive':
            return PROP_TYPE_VALIDATORS.primitive(normalizedType);
        case 'array':
            return PROP_TYPE_VALIDATORS.array();
        case 'object':
            return PROP_TYPE_VALIDATORS.object();
        case 'function':
            return PROP_TYPE_VALIDATORS.function();
        case 'any':
            return PROP_TYPE_VALIDATORS.any();
        case 'oneOf':
            return PROP_TYPE_VALIDATORS.oneOf(normalizedType);
        case 'oneOfType':
            return PROP_TYPE_VALIDATORS.oneOfType(
                normalizedType,
                generatePropTypeValidator
            );
        default:
            // Exhaustiveness check ensures we've handled all type kinds
            const _exhaustiveCheck: never = normalizedType;
            return 'PropTypes.any';
    }
}

/**
 * Creates a PropTypes validator string for a parsed prop, adding the required modifier if needed.
 *
 * @param parsedProp - The parsed prop with its type and required status
 * @returns A complete PropTypes validator string for the prop
 */
function createPropValidator(parsedProp: ParsedProp): string {
    const propTypeValidator = generatePropTypeValidator(parsedProp.type);
    return parsedProp.required
        ? `${propTypeValidator}.isRequired`
        : propTypeValidator;
}

/**
 * Generates the PropTypes declaration string for a React component.
 *
 * This function takes the component information with parsed props and generates
 * a complete PropTypes declaration that can be added to the component file.
 *
 * @param componentInfo - Information about the component and its props
 * @returns A string containing the complete PropTypes declaration
 */
function generateComponentString(componentInfo: ComponentInfo): string {
    // Transform each prop into its PropTypes declaration line
    const propLines = componentInfo.props.map((prop) => {
        const propValidator = createPropValidator(prop);
        return `  ${prop.name}: ${propValidator},`;
    });

    // If there are no props, add an empty line to maintain proper formatting
    if (propLines.length === 0) {
        propLines.push('');
    }

    // Combine all lines into the final PropTypes declaration
    return `${componentInfo.name}.propTypes = {\n${propLines.join('\n')}\n};`;
}

export default generateComponentString;