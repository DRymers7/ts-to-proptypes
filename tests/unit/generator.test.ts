import {describe, it, expect} from 'vitest';
import {ComponentInfo} from '../../src/core/parser';
import {ParsedProp} from '../../src/core/extractPropsFromParameter';
import generateComponentString from '../../src/core/generator';

describe('generateComponentString tests', () => {
    // Basic tests
    it('should generate component string correctly with primitive types', () => {
        const testProps: ParsedProp[] = [
            {
                name: 'testProp',
                type: {kind: 'primitive', name: 'string'},
                required: true,
            },
            {
                name: 'testProp2',
                type: {kind: 'primitive', name: 'number'},
                required: false,
            },
            {
                name: 'testProp3',
                type: {kind: 'primitive', name: 'boolean'},
                required: true,
            },
        ];
        const testComponentInfo: ComponentInfo = {
            name: 'TestComponent',
            props: testProps,
            sourceFilePath: './TestComponent.tsx',
        };

        const result = generateComponentString(testComponentInfo);

        expect(result).toBe(
            `TestComponent.propTypes = {\n` +
                `  testProp: PropTypes.string.isRequired,\n` +
                `  testProp2: PropTypes.number,\n` +
                `  testProp3: PropTypes.bool.isRequired,\n` +
                `};`
        );
    });

    it('should return an empty propTypes block when props array is empty', () => {
        const emptyComponentInfo: ComponentInfo = {
            name: 'EmptyComponent',
            props: [],
            sourceFilePath: './EmptyComponent.tsx',
        };

        const result = generateComponentString(emptyComponentInfo);

        expect(result).toBe(`EmptyComponent.propTypes = {\n\n};`);
    });

    it('should correctly map non-primitive types with required flags', () => {
        const props: ParsedProp[] = [
            {name: 'data', type: {kind: 'object'}, required: false},
            {name: 'items', type: {kind: 'array'}, required: true},
            {name: 'callback', type: {kind: 'function'}, required: true},
            {name: 'fallback', type: {kind: 'any'}, required: false},
        ];
        const componentInfo: ComponentInfo = {
            name: 'ComplexComponent',
            props,
            sourceFilePath: './ComplexComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `ComplexComponent.propTypes = {\n` +
                `  data: PropTypes.object,\n` +
                `  items: PropTypes.array.isRequired,\n` +
                `  callback: PropTypes.func.isRequired,\n` +
                `  fallback: PropTypes.any,\n` +
                `};`
        );
    });

    // oneOf tests
    it('should generate PropTypes.oneOf for string literal unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'variant',
                type: {
                    kind: 'oneOf',
                    values: ['primary', 'secondary', 'danger'],
                },
                required: true,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'ButtonComponent',
            props,
            sourceFilePath: './ButtonComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `ButtonComponent.propTypes = {\n` +
                `  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']).isRequired,\n` +
                `};`
        );
    });

    it('should generate PropTypes.oneOf for number literal unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'level',
                type: {kind: 'oneOf', values: [1, 2, 3]},
                required: false,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'LevelComponent',
            props,
            sourceFilePath: './LevelComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `LevelComponent.propTypes = {\n` +
                `  level: PropTypes.oneOf([1, 2, 3]),\n` +
                `};`
        );
    });

    it('should generate PropTypes.oneOf for boolean literal unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'enabled',
                type: {kind: 'oneOf', values: [true, false]},
                required: true,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'ToggleComponent',
            props,
            sourceFilePath: './ToggleComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `ToggleComponent.propTypes = {\n` +
                `  enabled: PropTypes.oneOf([true, false]).isRequired,\n` +
                `};`
        );
    });

    it('should generate PropTypes.oneOf for mixed literal unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'value',
                type: {kind: 'oneOf', values: [1, 'default', true]},
                required: false,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'MixedComponent',
            props,
            sourceFilePath: './MixedComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `MixedComponent.propTypes = {\n` +
                `  value: PropTypes.oneOf([1, 'default', true]),\n` +
                `};`
        );
    });

    // oneOfType tests
    it('should generate PropTypes.oneOfType for primitive type unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'id',
                type: {
                    kind: 'oneOfType',
                    types: [
                        {kind: 'primitive', name: 'string'},
                        {kind: 'primitive', name: 'number'},
                    ],
                },
                required: true,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'IdentifierComponent',
            props,
            sourceFilePath: './IdentifierComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `IdentifierComponent.propTypes = {\n` +
                `  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,\n` +
                `};`
        );
    });

    it('should generate PropTypes.oneOfType for complex type unions', () => {
        const props: ParsedProp[] = [
            {
                name: 'content',
                type: {
                    kind: 'oneOfType',
                    types: [
                        {kind: 'primitive', name: 'string'},
                        {kind: 'array'},
                        {kind: 'function'},
                    ],
                },
                required: false,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'ContentComponent',
            props,
            sourceFilePath: './ContentComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `ContentComponent.propTypes = {\n` +
                `  content: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.func]),\n` +
                `};`
        );
    });

    it('should correctly handle nested oneOfType in oneOfType', () => {
        const props: ParsedProp[] = [
            {
                name: 'complex',
                type: {
                    kind: 'oneOfType',
                    types: [
                        {kind: 'primitive', name: 'string'},
                        {
                            kind: 'oneOfType',
                            types: [{kind: 'array'}, {kind: 'object'}],
                        },
                    ],
                },
                required: true,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'NestedComponent',
            props,
            sourceFilePath: './NestedComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `NestedComponent.propTypes = {\n` +
                `  complex: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOfType([PropTypes.array, PropTypes.object])]).isRequired,\n` +
                `};`
        );
    });

    // Multiple prop types
    it('should generate correct PropTypes for components with mixed prop types', () => {
        const props: ParsedProp[] = [
            {
                name: 'title',
                type: {kind: 'primitive', name: 'string'},
                required: true,
            },
            {name: 'data', type: {kind: 'array'}, required: true},
            {
                name: 'size',
                type: {kind: 'oneOf', values: ['small', 'medium', 'large']},
                required: false,
            },
            {
                name: 'handler',
                type: {
                    kind: 'oneOfType',
                    types: [
                        {kind: 'function'},
                        {kind: 'primitive', name: 'string'},
                    ],
                },
                required: false,
            },
        ];
        const componentInfo: ComponentInfo = {
            name: 'MixedPropsComponent',
            props,
            sourceFilePath: './MixedPropsComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `MixedPropsComponent.propTypes = {\n` +
                `  title: PropTypes.string.isRequired,\n` +
                `  data: PropTypes.array.isRequired,\n` +
                `  size: PropTypes.oneOf(['small', 'medium', 'large']),\n` +
                `  handler: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),\n` +
                `};`
        );
    });
});
