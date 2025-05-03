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

/**
 * Write options associated with CLI arguments.
 */
export interface WriteOptions {
    outDir?: string;
    inline?: boolean;
    prettier?: boolean;
}

/**
 * Type representation for ts-to-proptypes to standardize the AST node value to a generic
 * constant, and then use that value to generate a new tsx prop.
 */
export type NormalizedPropType =
  | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' }
  | { kind: 'array' }
  | { kind: 'object' }
  | { kind: 'function' }
  | { kind: 'oneOf'; values: Array<string | number | boolean> }
  | { kind: 'oneOfType'; types: NormalizedPropType[] }
  | { kind: 'any' };