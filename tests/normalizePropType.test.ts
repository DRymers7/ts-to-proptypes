import {describe, it, expect} from 'vitest';
import normalizePropType from '../src/normalizePropType';
import {Project, Type} from 'ts-morph';

const createTypeFromText = (typeText: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile(
        'Test.tsx',
        `
        type TestType = ${typeText};
        const foo: TestType = undefined as any;
        `
    );
    const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('foo');
    return variableDeclaration.getType();
};

describe('normalizePropType', () => {
    it('should normalize string types', () => {
        const stringType = createTypeFromText('string');
        expect(normalizePropType(stringType)).toBe('string');
    });

    it('should normalize array types', () => {
        const arrayType = createTypeFromText('Array<string>'); // FIXED
        expect(normalizePropType(arrayType)).toBe('array');
    });

    it('should normalize object/record types', () => {
        const objectType = createTypeFromText('Record<string, number>'); 
        expect(normalizePropType(objectType)).toBe('object');
    });

    it('should normalize function types', () => {
        const functionType = createTypeFromText('() => void'); 
        expect(normalizePropType(functionType)).toBe('function');
    });

    it('should default to any for unknown types', () => {
        const undefinedType = createTypeFromText('undefined');
        expect(normalizePropType(undefinedType)).toBe('any');
    });
});