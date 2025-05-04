import {describe, it, expect} from 'vitest';
import extractPropsFromParameter from '../src/extractPropsFromParameter';
import {Project} from 'ts-morph';

describe('extractPropsFromParameter', () => {
    const createParamDeclaration = (code: string) => {
        const project = new Project();
        const sourceFile = project.createSourceFile('TestComponent.tsx', code);
        const func = sourceFile.getFunctions()[0];
        return func.getParameters()[0];
    };

    it('should extract primitive props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                name: string;
                age: number;
                isActive: boolean;
            };
            function TestComponent({ name, age, isActive }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        expect(result).toEqual([
            {
                name: 'name',
                type: {kind: 'primitive', name: 'string'},
                required: true,
            },
            {
                name: 'age',
                type: {kind: 'primitive', name: 'number'},
                required: true,
            },
            {
                name: 'isActive',
                type: {kind: 'primitive', name: 'boolean'},
                required: true,
            },
        ]);
    });

    it('should mark optional props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                required: string;
                optional?: number;
            };
            function TestComponent({ required, optional }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        expect(result).toEqual([
            {
                name: 'required',
                type: {kind: 'primitive', name: 'string'},
                required: true,
            },
            {
                name: 'optional',
                type: {kind: 'primitive', name: 'number'},
                required: false,
            },
        ]);
    });

    it('should extract array props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                items: string[];
                records: Array<number>;
            };
            function TestComponent({ items, records }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        expect(result).toEqual([
            {name: 'items', type: {kind: 'array'}, required: true},
            {name: 'records', type: {kind: 'array'}, required: true},
        ]);
    });

    it('should extract function props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                onClick: () => void;
                onSubmit: (data: any) => boolean;
            };
            function TestComponent({ onClick, onSubmit }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        expect(result).toEqual([
            {name: 'onClick', type: {kind: 'function'}, required: true},
            {name: 'onSubmit', type: {kind: 'function'}, required: true},
        ]);
    });

    it('should extract object props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                config: { theme: string; size: number };
                meta: Record<string, any>;
            };
            function TestComponent({ config, meta }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        // Note: The nested properties (theme, size) should also be extracted
        expect(result).toContainEqual({
            name: 'config',
            type: {kind: 'object'},
            required: true,
        });
        expect(result).toContainEqual({
            name: 'meta',
            type: {kind: 'object'},
            required: true,
        });
        // Check for nested properties
        expect(result).toContainEqual({
            name: 'theme',
            type: {kind: 'primitive', name: 'string'},
            required: true,
        });
        expect(result).toContainEqual({
            name: 'size',
            type: {kind: 'primitive', name: 'number'},
            required: true,
        });
    });

    it('should extract oneOf (literal union) props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                variant: 'primary' | 'secondary' | 'danger';
                size?: 'small' | 'medium' | 'large';
            };
            function TestComponent({ variant, size }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        expect(result).toContainEqual({
            name: 'variant',
            type: {
                kind: 'oneOf',
                values: ['primary', 'secondary', 'danger'],
            },
            required: true,
        });

        expect(result).toContainEqual({
            name: 'size',
            type: {
                kind: 'oneOf',
                values: ['small', 'medium', 'large'],
            },
            required: false,
        });
    });

    it('should extract oneOfType (mixed union) props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                id: string | number;
                content: string | (() => void) | string[];
            };
            function TestComponent({ id, content }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        // Find the 'id' prop
        const idProp = result.find((prop) => prop.name === 'id');
        expect(idProp).toBeDefined();
        expect(idProp?.type.kind).toBe('oneOfType');
        if (idProp?.type.kind === 'oneOfType') {
            expect(idProp.type.types).toEqual(
                expect.arrayContaining([
                    {kind: 'primitive', name: 'string'},
                    {kind: 'primitive', name: 'number'},
                ])
            );
        } else {
            throw new Error(
                `Expected idProp kind to be 'oneOfType', got ${idProp?.type.kind}`
            );
        }

        // Find the 'content' prop
        const contentProp = result.find((prop) => prop.name === 'content');
        expect(contentProp).toBeDefined();
        expect(contentProp?.type.kind).toBe('oneOfType');
        if (contentProp?.type.kind === 'oneOfType') {
            expect(contentProp.type.types).toEqual(
                expect.arrayContaining([
                    {kind: 'primitive', name: 'string'},
                    {kind: 'function'},
                    {kind: 'array'},
                ])
            );
        } else {
            throw new Error(
                `Expected contentProp kind to be 'oneOfType', got ${contentProp?.type.kind}`
            );
        }
    }); // ← Closed the oneOfType test here

    it('should handle complex nested props correctly', () => {
        const param = createParamDeclaration(`
            type Props = { 
                config: {
                    theme: 'light' | 'dark';
                    options: {
                        showHeader?: boolean;
                        showFooter?: boolean;
                    }
                };
            };
            function TestComponent({ config }: Props) {
                return null;
            }
        `);

        const result = extractPropsFromParameter(param);

        // Check for the main config prop
        expect(result).toContainEqual({
            name: 'config',
            type: {kind: 'object'},
            required: true,
        });

        // Check for the theme prop
        const themeProp = result.find((prop) => prop.name === 'theme');
        expect(themeProp).toBeDefined();
        expect(themeProp?.type.kind).toBe('oneOf');
        if (themeProp?.type.kind === 'oneOf') {
            expect(themeProp.type.values).toEqual(['light', 'dark']);
        } else {
            throw new Error(
                `Expected themeProp kind to be 'oneOf', got ${themeProp?.type.kind}`
            );
        }

        // Check for the options prop
        expect(result).toContainEqual({
            name: 'options',
            type: {kind: 'object'},
            required: true,
        });

        // Check for nested option props
        expect(result).toContainEqual({
            name: 'showHeader',
            type: {kind: 'primitive', name: 'boolean'},
            required: false,
        });

        expect(result).toContainEqual({
            name: 'showFooter',
            type: {kind: 'primitive', name: 'boolean'},
            required: false,
        });
    });
});
