import {Type} from 'ts-morph';

/**
 * Standardizes the raw type provided by the Node, into a traditional TS type. This
 * is for the purpose of simplifying type variance. Will default to 'any' if the
 * TS compiler is unable to determine the type.
 *
 * @param typeString raw string value returned from prop call to .getTypeAtLocation(param).getText()
 * @returns string value of prop type, normalized for easier use
 */
function normalizePropType(typeOrText: Type): string {
    const textValue = typeOrText.getText();

    if (
        textValue === 'String' ||
        textValue === 'Object' ||
        textValue === 'Function'
    ) {
        console.warn(`Warning: Detected JavaScript native type: ${textValue}`);
        return 'any';
    }

    if (
        typeOrText.isArray() ||
        typeOrText.isTuple() ||
        textValue.endsWith('[]')
    ) {
        return 'array';
    }
    if (typeOrText.getCallSignatures().length > 0) {
        return 'function';
    }
    if (typeOrText.isBoolean()) {
        return 'boolean';
    }
    if (typeOrText.isNumber()) {
        return 'number';
    }
    if (typeOrText.isString()) {
        return 'string';
    }
    if (typeOrText.isObject()) {
        return 'object';
    }

    return 'any';
}

export default normalizePropType;
