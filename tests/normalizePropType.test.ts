import {describe, it, expect} from 'vitest';
import {normalizePropType} from '../src/normalizePropType';
import {Project, Type} from 'ts-morph';
import {NormalizedPropType} from '../src/types';
import {fail} from 'assert';

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
    // Primitive Types
    it('should normalize string type', () => {
        const stringType = createTypeFromText('string');
        expect(normalizePropType(stringType)).toEqual({
            kind: 'primitive',
            name: 'string',
        });
    });

    it('should normalize number type', () => {
        const numberType = createTypeFromText('number');
        expect(normalizePropType(numberType)).toEqual({
            kind: 'primitive',
            name: 'number',
        });
    });

    it('should normalize boolean type', () => {
        const booleanType = createTypeFromText('boolean');
        expect(normalizePropType(booleanType)).toEqual({
            kind: 'primitive',
            name: 'boolean',
        });
    });

    // Array Types
    it('should normalize array types with Array<T> syntax', () => {
        const arrayType = createTypeFromText('Array<string>');
        expect(normalizePropType(arrayType)).toEqual({kind: 'array'});
    });

    it('should normalize array types with T[] syntax', () => {
        const arrayType = createTypeFromText('string[]');
        expect(normalizePropType(arrayType)).toEqual({kind: 'array'});
    });

    it('should normalize tuple types', () => {
        const tupleType = createTypeFromText('[string, number]');
        expect(normalizePropType(tupleType)).toEqual({kind: 'array'});
    });

    // Function Types
    it('should normalize function types with arrow syntax', () => {
        const functionType = createTypeFromText('() => void');
        expect(normalizePropType(functionType)).toEqual({kind: 'function'});
    });

    it('should normalize function types with parameters', () => {
        const functionType = createTypeFromText(
            '(a: string, b: number) => boolean'
        );
        expect(normalizePropType(functionType)).toEqual({kind: 'function'});
    });

    it('should normalize function types with function keyword', () => {
        const functionType = createTypeFromText('function(x: number): string');
        expect(normalizePropType(functionType)).toEqual({kind: 'function'});
    });

    // Object Types
    it('should normalize plain object types', () => {
        const objectType = createTypeFromText(
            '{ prop1: string; prop2: number }'
        );
        expect(normalizePropType(objectType)).toEqual({kind: 'object'});
    });

    it('should normalize Record types', () => {
        const recordType = createTypeFromText('Record<string, any>');
        expect(normalizePropType(recordType)).toEqual({kind: 'object'});
    });

    it('should normalize interface types', () => {
        const project = new Project();
        const sourceFile = project.createSourceFile(
            'Interface.tsx',
            `
            interface TestInterface { prop: string }
            const foo: TestInterface = undefined as any;
            `
        );
        const variableDeclaration =
            sourceFile.getVariableDeclarationOrThrow('foo');
        expect(normalizePropType(variableDeclaration.getType())).toEqual({
            kind: 'object',
        });
    });

    // Union Types - oneOf (all literals)
    it('should normalize string literal unions as oneOf', () => {
        const stringLiteralUnion = createTypeFromText(
            "'small' | 'medium' | 'large'"
        );
        expect(normalizePropType(stringLiteralUnion)).toEqual({
            kind: 'oneOf',
            values: ['small', 'medium', 'large'],
        });
    });

    it('should normalize number literal unions as oneOf', () => {
        const numberLiteralUnion = createTypeFromText('1 | 2 | 3');
        expect(normalizePropType(numberLiteralUnion)).toEqual({
            kind: 'oneOf',
            values: [1, 2, 3],
        });
    });

    it('should normalize primitive type unions as oneOfType', () => {
        const primitiveUnion = createTypeFromText('string | number');
        const result = normalizePropType(primitiveUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(
                expect.arrayContaining([
                    {kind: 'primitive', name: 'string'},
                    {kind: 'primitive', name: 'number'},
                ])
            );
        } else {
            throw new Error(
                `Expected kind to be 'oneOfType', got ${result.kind}`
            );
        }
    });

    it('should normalize complex type unions as oneOfType', () => {
        const complexUnion = createTypeFromText(
            'string | string[] | (() => void)'
        );
        const result = normalizePropType(complexUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(
                expect.arrayContaining([
                    {kind: 'primitive', name: 'string'},
                    {kind: 'array'},
                    {kind: 'function'},
                ])
            );
        } else {
            throw new Error(
                `Expected kind to be 'oneOfType', got ${result.kind}`
            );
        }
    });

    it('should normalize unions with object types as oneOfType', () => {
        const objectUnion = createTypeFromText('{ id: number } | string');
        const result = normalizePropType(objectUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(
                expect.arrayContaining([
                    {kind: 'object'},
                    {kind: 'primitive', name: 'string'},
                ])
            );
        } else {
            throw new Error(
                `Expected kind to be 'oneOfType', got ${result.kind}`
            );
        }
    });

    // Special and Edge Cases
    it('should default to any for undefined type', () => {
        const undefinedType = createTypeFromText('undefined');
        expect(normalizePropType(undefinedType)).toEqual({kind: 'any'});
    });

    it('should default to any for null type', () => {
        const nullType = createTypeFromText('null');
        expect(normalizePropType(nullType)).toEqual({kind: 'any'});
    });

    it('should handle optional types correctly', () => {
        // Create a mock Type object that properly represents a union type
        const mockOptionalType = {
            getText: () => 'string | undefined',
            isUnion: () => true,
            getUnionTypes: () => [
                {
                    getText: () => 'string',
                    isString: () => true,
                    isUndefined: () => false,
                    isArray: () => false,
                    isTuple: () => false,
                    getCallSignatures: () => [],
                    isNumber: () => false,
                    isObject: () => false,
                    getLiteralValue: () => undefined,
                } as unknown as Type,
                {
                    getText: () => 'undefined',
                    isString: () => false,
                    isUndefined: () => true,
                    isArray: () => false,
                    isTuple: () => false,
                    getCallSignatures: () => [],
                    isNumber: () => false,
                    isObject: () => false,
                    getLiteralValue: () => undefined,
                } as unknown as Type,
            ],
            isString: () => false,
            isNumber: () => false,
            isBoolean: () => false,
            isArray: () => false,
            isTuple: () => false,
            getCallSignatures: () => [],
            isObject: () => false,
        } as unknown as Type;

        // Use our mock type instead of createTypeFromText
        const result = normalizePropType(mockOptionalType);
        expect(result.kind).toBe('oneOfType');
    });
});
