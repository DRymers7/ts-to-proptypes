/**
 * Record representation of PropType attributes
 * associated with various typescript types.
 */
export const typeMap: Record<string, string> = {
    string: 'PropTypes.string',
    number: 'PropTypes.number',
    boolean: 'PropTypes.bool',
    object: 'PropTypes.object',
    array: 'PropTypes.array',
    function: 'PropTypes.func',
    any: 'PropTypes.any',
};
