import {describe, it, expect} from 'vitest';
import normalizePropType from '../src/normalizePropType';
import {Project, Type} from 'ts-morph';
import { NormalizedPropType } from '../src/types';
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
        expect(normalizePropType(stringType)).toEqual({kind: 'primitive', name: 'string'});
    });

    it('should normalize number type', () => {
        const numberType = createTypeFromText('number');
        expect(normalizePropType(numberType)).toEqual({kind: 'primitive', name: 'number'});
    });

    it('should normalize boolean type', () => {
        const booleanType = createTypeFromText('boolean');
        expect(normalizePropType(booleanType)).toEqual({kind: 'primitive', name: 'boolean'});
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
        const functionType = createTypeFromText('(a: string, b: number) => boolean');
        expect(normalizePropType(functionType)).toEqual({kind: 'function'});
    });

    it('should normalize function types with function keyword', () => {
        const functionType = createTypeFromText('function(x: number): string');
        expect(normalizePropType(functionType)).toEqual({kind: 'function'});
    });

    // Object Types
    it('should normalize plain object types', () => {
        const objectType = createTypeFromText('{ prop1: string; prop2: number }');
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
        const variableDeclaration = sourceFile.getVariableDeclarationOrThrow('foo');
        expect(normalizePropType(variableDeclaration.getType())).toEqual({kind: 'object'});
    });

    // Union Types - oneOf (all literals)
    it('should normalize string literal unions as oneOf', () => {
        const stringLiteralUnion = createTypeFromText("'small' | 'medium' | 'large'");
        expect(normalizePropType(stringLiteralUnion)).toEqual({
            kind: 'oneOf',
            values: ['small', 'medium', 'large']
        });
    });

    it('should normalize number literal unions as oneOf', () => {
        const numberLiteralUnion = createTypeFromText('1 | 2 | 3');
        expect(normalizePropType(numberLiteralUnion)).toEqual({
            kind: 'oneOf',
            values: [1, 2, 3]
        });
    });

    it('should normalize boolean literal unions as oneOf', () => {
        const booleanLiteralUnion = createTypeFromText('true | false');
        const result = normalizePropType(booleanLiteralUnion);
        expect(result.kind).toBe('oneOf');
        if (result.kind === 'oneOf') {
            expect(result.values.length).toBe(2);
            expect(result.values).toEqual(expect.arrayContaining([true, false]));
        }
        else {
            fail(`Expected kind to be 'oneOf', got ${result.kind}`)
        }
    });

    it('should normalize mixed literal unions as oneOf', () => {
        const mixedLiteralUnion = createTypeFromText("1 | 'text' | true");
        const result = normalizePropType(mixedLiteralUnion);
        expect(result.kind).toBe('oneOf');
        if (result.kind === 'oneOf') {
            expect(result.values.length).toBe(3);
            expect(result.values).toEqual(expect.arrayContaining([1, 'text', true]));
        } else {
            fail(`Expected kind to be 'oneOf', got ${result.kind}`)
        }
    });

    it('should normalize primitive type unions as oneOfType', () => {
        const primitiveUnion = createTypeFromText('string | number');
        const result = normalizePropType(primitiveUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(expect.arrayContaining([
                {kind: 'primitive', name: 'string'},
                {kind: 'primitive', name: 'number'}
            ]));
        } else {
            throw new Error(`Expected kind to be 'oneOfType', got ${result.kind}`)
        }
    });
    
    it('should normalize complex type unions as oneOfType', () => {
        const complexUnion = createTypeFromText('string | string[] | (() => void)');
        const result = normalizePropType(complexUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(expect.arrayContaining([
                {kind: 'primitive', name: 'string'},
                {kind: 'array'},
                {kind: 'function'}
            ]));
        } else {
            throw new Error(`Expected kind to be 'oneOfType', got ${result.kind}`)
        }
    });
    
    it('should normalize unions with object types as oneOfType', () => {
        const objectUnion = createTypeFromText('{ id: number } | string');
        const result = normalizePropType(objectUnion);
        expect(result.kind).toBe('oneOfType');
        if (result.kind === 'oneOfType') {
            expect(result.types).toEqual(expect.arrayContaining([
                {kind: 'object'},
                {kind: 'primitive', name: 'string'}
            ]));
        } else {
            throw new Error(`Expected kind to be 'oneOfType', got ${result.kind}`)
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
        // Optional types in TS are often represented as: type | undefined
        const optionalType = createTypeFromText('string | undefined');
        // This tests that we'd handle it as a oneOfType
        const result = normalizePropType(optionalType);
        expect(result.kind).toBe('oneOfType');
    });
});