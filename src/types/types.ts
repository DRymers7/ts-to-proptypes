/**
 * Mapping of TypeScript primitive types to their corresponding PropTypes validators.
 *
 * This constant provides a direct mapping between TypeScript primitive types
 * and their React PropTypes equivalents. For example, the TypeScript 'boolean'
 * type maps to 'PropTypes.bool' in React's PropTypes system.
 *
 * @example
 * // Converting a TypeScript type to a PropTypes validator
 * const tsType = 'boolean';
 * const propTypeValidator = PROP_TYPE_VALIDATORS[tsType]; // 'PropTypes.bool'
 */
export const PROP_TYPE_VALIDATORS = {
    string: 'PropTypes.string',
    number: 'PropTypes.number',
    boolean: 'PropTypes.bool',
    object: 'PropTypes.object',
    array: 'PropTypes.array',
    function: 'PropTypes.func',
    any: 'PropTypes.any',
} as const;

/**
 * Type of primitive values supported in PropTypes.
 *
 * This represents the three fundamental primitive types in TypeScript
 * that map directly to PropTypes validators.
 */
export type PrimitiveTypeName = 'string' | 'number' | 'boolean';

/**
 * Type of primitive values accepted in oneOf validators.
 *
 * These are the literal value types that can be used in PropTypes.oneOf([...])
 * validators. They represent the concrete values that a prop can take.
 */
export type PropTypeValue = string | number | boolean;

/**
 * Normalized representation of a TypeScript type for PropTypes generation.
 *
 * This discriminated union represents different kinds of TypeScript types in a
 * normalized format that can be easily translated to PropTypes validators.
 * Each variant corresponds to a different PropTypes validator pattern.
 *
 * @example
 * // A primitive string type
 * const stringType: NormalizedPropType = { kind: 'primitive', name: 'string' };
 *
 * // A union of literal values (enum-like)
 * const colorType: NormalizedPropType = {
 *   kind: 'oneOf',
 *   values: ['primary', 'secondary', 'error']
 * };
 *
 * // A union of different types
 * const contentType: NormalizedPropType = {
 *   kind: 'oneOfType',
 *   types: [
 *     { kind: 'primitive', name: 'string' },
 *     { kind: 'array' }
 *   ]
 * };
 */
export type NormalizedPropType =
    | {kind: 'primitive'; name: PrimitiveTypeName}
    | {kind: 'array'}
    | {kind: 'object'}
    | {kind: 'function'}
    | {kind: 'oneOf'; values: readonly PropTypeValue[]}
    | {kind: 'oneOfType'; types: readonly NormalizedPropType[]}
    | {kind: 'any'};

/**
 * Configuration options for file writing operations.
 *
 * These options control how PropTypes declarations are written to files.
 * They correspond to command-line arguments passed to the CLI.
 *
 * @property outDir - Directory where output files should be created. When omitted,
 *                    files are created alongside the source files.
 * @property inline - Whether to append PropTypes to the original source file instead
 *                    of creating separate .propTypes.ts files.
 * @property prettier - Whether to format the generated code using Prettier.
 *                      Requires Prettier to be installed in the project.
 *
 * @example
 * // Writing PropTypes to separate files in a specific directory
 * const options: WriteOptions = {
 *   outDir: './generated',
 *   inline: false,
 *   prettier: true
 * };
 *
 * // Appending PropTypes to original files
 * const inlineOptions: WriteOptions = {
 *   inline: true,
 *   prettier: true
 * };
 */
export interface WriteOptions {
    /**
     * Directory where output files should be created.
     * When omitted, files are created alongside the source files.
     */
    outDir?: string;

    /**
     * Whether to append PropTypes to the original source file
     * instead of creating separate .propTypes.ts files.
     */
    inline?: boolean;

    /**
     * Whether to format the generated code using Prettier.
     * Requires Prettier to be installed in the project.
     */
    prettier?: boolean;
}
