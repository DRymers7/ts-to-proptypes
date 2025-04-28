import {Type} from 'ts-morph';

/**
 * // TODO: update docs
 *
 * @param typeString raw string value returned from prop call to .getTypeAtLocation(param).getText()
 * @returns string value of prop type, normalized for easier use
 */
function normalizePropType(typeOrText: Type): string {
    const textValue = typeOrText.getText();

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
