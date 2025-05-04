import {Type} from 'ts-morph';
import {NormalizedPropType} from './types';

/**
 * Type guard to check if a union type contains an undefined type
 */
function hasUndefinedType(unionTypes: Type[]): boolean {
    return unionTypes.some((t) => t.isUndefined());
}

/**
 * Extracts literal values from a union type if all union members are literals
 *
 * @param unionTypes - Array of union type members
 * @returns Object containing success status and extracted values (if applicable)
 */
function extractLiteralValues(unionTypes: Type[]): {
    isAllLiterals: boolean;
    values: Array<string | number | boolean>;
} {
    const literalValues: Array<string | number | boolean> = [];

    for (const unionType of unionTypes) {
        // Handle string literals
        if (unionType.isStringLiteral()) {
            literalValues.push(unionType.getLiteralValue() as string);
            continue;
        }

        // Handle number literals
        if (unionType.isNumberLiteral()) {
            literalValues.push(unionType.getLiteralValue() as number);
            continue;
        }

        // Handle boolean literals
        if (unionType.getText() === 'true') {
            literalValues.push(true);
            continue;
        }

        if (unionType.getText() === 'false') {
            literalValues.push(false);
            continue;
        }

        // Try to handle other literals
        if (unionType.isLiteral()) {
            try {
                const value = unionType.getLiteralValue();
                if (
                    typeof value === 'string' ||
                    typeof value === 'number' ||
                    typeof value === 'boolean'
                ) {
                    literalValues.push(value);
                    continue;
                }
            } catch {
                // Fall through to the default case
            }
        }

        // If we got here, this isn't a supported literal type
        return {isAllLiterals: false, values: []};
    }

    return {isAllLiterals: true, values: literalValues};
}

/**
 * Handles the special case of optional types (T | undefined)
 *
 * @param type - The type to check
 * @param typeText - The string representation of the type
 * @returns A normalized representation of the optional type if applicable, null otherwise
 */
function handleOptionalType(
    type: Type,
    typeText: string
): NormalizedPropType | null {
    // Check for direct text pattern
    if (typeText.includes(' | undefined') || typeText.includes('|undefined')) {
        const baseTypeText = typeText.split(/\s*\|\s*undefined/)[0];
        const baseType = normalizeByTypeText(baseTypeText);

        return {
            kind: 'oneOfType',
            types: [baseType, {kind: 'any'}], // `any` represents undefined
        };
    }

    // Check for union with undefined using ts-morph API
    if (type.isUnion()) {
        const unionTypes = type.getUnionTypes();
        if (unionTypes.length === 2 && hasUndefinedType(unionTypes)) {
            const types = unionTypes
                .filter((t) => !t.isUndefined())
                .map((t) => normalizePropType(t));

            return {kind: 'oneOfType', types};
        }
    }

    return null;
}

/**
 * Normalizes a type based on its text representation
 * Used as a fallback for special cases
 *
 * @param typeText - The string representation of the type
 * @returns A normalized type representation
 */
function normalizeByTypeText(typeText: string): NormalizedPropType {
    if (typeText === 'boolean') return {kind: 'primitive', name: 'boolean'};
    if (typeText === 'string') return {kind: 'primitive', name: 'string'};
    if (typeText === 'number') return {kind: 'primitive', name: 'number'};
    if (typeText.endsWith('[]')) return {kind: 'array'};

    // Default to any for unrecognized types
    return {kind: 'any'};
}

/**
 * Normalizes union types by checking for literals or regular type unions
 *
 * @param type - The union type to normalize
 * @returns A normalized representation of the union type
 */
function normalizeUnionType(type: Type): NormalizedPropType {
    const unionTypes = type.getUnionTypes();

    // Extract literal values if applicable
    const {isAllLiterals, values} = extractLiteralValues(unionTypes);

    if (isAllLiterals && values.length > 0) {
        return {kind: 'oneOf', values};
    }

    // Otherwise handle as oneOfType
    const types = unionTypes.map((t) => normalizePropType(t));
    return {kind: 'oneOfType', types};
}

/**
 * Converts TypeScript types to a normalized representation for PropTypes generation.
 *
 * This function analyzes a TypeScript type and returns a standardized representation
 * that can be used to generate appropriate PropTypes validators. It handles primitive
 * types, arrays, objects, functions, unions, and optional types.
 *
 * @param type - The TypeScript type to normalize
 * @returns A normalized representation of the type for PropTypes generation
 */
export function normalizePropType(type: Type): NormalizedPropType {
    const typeText = type.getText();

    // Handle optional types first as a special case
    const optionalType = handleOptionalType(type, typeText);
    if (optionalType) {
        return optionalType;
    }

    // Handle primitive types
    if (typeText === 'boolean') return {kind: 'primitive', name: 'boolean'};
    if (typeText === 'string') return {kind: 'primitive', name: 'string'};
    if (typeText === 'number') return {kind: 'primitive', name: 'number'};

    // Handle union types
    if (type.isUnion()) {
        return normalizeUnionType(type);
    }

    // Handle array types
    if (type.isArray() || type.isTuple() || typeText.endsWith('[]')) {
        return {kind: 'array'};
    }

    // Handle function types
    if (type.getCallSignatures().length > 0) {
        return {kind: 'function'};
    }

    // Handle primitive types via ts-morph API
    if (type.isNumber()) return {kind: 'primitive', name: 'number'};
    if (type.isString()) return {kind: 'primitive', name: 'string'};

    // Handle object types
    if (type.isObject()) {
        return {kind: 'object'};
    }

    // Default to any for unrecognized types
    return {kind: 'any'};
}
