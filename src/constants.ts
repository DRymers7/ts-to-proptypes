import {NormalizedPropType} from './types/types';

/**
 * A mapping of PropTypes validator expressions for each normalized type kind
 */
export const PROP_TYPE_VALIDATORS = {
    primitive: (
        type: Extract<NormalizedPropType, {kind: 'primitive'}>
    ): string =>
        type.name === 'boolean' ? 'PropTypes.bool' : `PropTypes.${type.name}`,
    array: (): string => 'PropTypes.array',
    object: (): string => 'PropTypes.object',
    function: (): string => 'PropTypes.func',
    any: (): string => 'PropTypes.any',
    oneOf: (type: Extract<NormalizedPropType, {kind: 'oneOf'}>): string => {
        const valuesString = type.values
            .map((value) =>
                typeof value === 'string' ? `'${value}'` : String(value)
            )
            .join(', ');
        return `PropTypes.oneOf([${valuesString}])`;
    },
    oneOfType: (
        type: Extract<NormalizedPropType, {kind: 'oneOfType'}>,
        generator: (type: NormalizedPropType) => string
    ): string => {
        const typesString = type.types.map(generator).join(', ');
        return `PropTypes.oneOfType([${typesString}])`;
    },
};
