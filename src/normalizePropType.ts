import {Type} from 'ts-morph';

/**
 * Standardizes the raw type provided by the Node, into a traditional TS type. This
 * is for the purpose of simplifying type variance. Will default to 'any' if the
 * TS compiler is unable to determine the type.
 *
 * @param typeString raw string value returned from prop call to .getTypeAtLocation(param).getText()
 * @returns string value of prop type, normalized for easier use
 */
export function normalizePropType(typeOrText: Type): string {
    // 1) Union types → always 'any'
    if (typeOrText.isUnion()) {
        return 'any';
    }

    const textValue = typeOrText.getText();

    // arrays & tuples
    if (
        typeOrText.isArray() ||
        typeOrText.isTuple() ||
        textValue.endsWith('[]')
    ) {
        return 'array';
    }

    // functions
    if (typeOrText.getCallSignatures().length > 0) {
        return 'function';
    }

    // primitives
    if (typeOrText.isBoolean()) {
        return 'boolean';
    }
    if (typeOrText.isNumber()) {
        return 'number';
    }
    if (typeOrText.isString()) {
        return 'string';
    }

    // objects
    if (typeOrText.isObject()) {
        return 'object';
    }

    // fallback
    return 'any';
}
export default normalizePropType;
