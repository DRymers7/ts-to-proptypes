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
    // 1) Union types must be handled before anything else
    if (typeOrText.isUnion()) {
        const members = typeOrText.getUnionTypes();
        // 2) Filter out undefined (makes optional props work)
        const nonUndef = members.filter((t) => t.getText() !== 'undefined');
        // 3) If there’s just one real type left, recurse
        if (nonUndef.length === 1) {
            return normalizePropType(nonUndef[0]);
        }
        // 4a) Union of string literals → string
        const allStringLits = nonUndef.every((t) =>
            /^['"].*['"]$/.test(t.getText())
        );
        if (allStringLits) return 'string';
        // 4b) Union of numeric literals → number
        const allNumberLits = nonUndef.every((t) =>
            /^\d+(\.\d+)?$/.test(t.getText())
        );
        if (allNumberLits) return 'number';
        // 4c) Union of boolean literals → boolean
        const allBoolLits = nonUndef.every(
            (t) => t.getText() === 'true' || t.getText() === 'false'
        );
        if (allBoolLits) return 'boolean';
        // otherwise we don’t know—fall through to later
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

    // everything else that looks like an object
    if (typeOrText.isObject()) {
        return 'object';
    }

    // give up
    return 'any';
}

export default normalizePropType;
