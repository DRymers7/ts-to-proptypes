import {describe, it, expect} from 'vitest';
import {ComponentInfo} from '../src/interfaces/ComponentInfo';
import {ParsedProp} from '../src/interfaces/ParsedProp';
import generateComponentString from '../src/generator';

/**
 * Test suite to test the generator module. If performing as intended, 
 * the module should expose one method to generate an output string that can 
 * be used by the ts-morph file writer.
 */
describe('generateComponentString tests', () => {
    it('should generate component string correctly, when given complete ComponentInfo', () => {
        const testProps: ParsedProp[] = [
            {name: 'testProp', type: 'string', required: true},
            {name: 'testProp2', type: 'number', required: false},
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

    it('should correctly map multiple prop types with required flags', () => {
        const props: ParsedProp[] = [
            {name: 'enabled', type: 'boolean', required: true},
            {name: 'data', type: 'object', required: false},
            {name: 'callback', type: 'function', required: true},
        ];
        const componentInfo: ComponentInfo = {
            name: 'ComplexComponent',
            props,
            sourceFilePath: './ComplexComponent.tsx',
        };

        const result = generateComponentString(componentInfo);

        expect(result).toBe(
            `ComplexComponent.propTypes = {\n` +
                `  enabled: PropTypes.bool.isRequired,\n` +
                `  data: PropTypes.object,\n` +
                `  callback: PropTypes.func.isRequired,\n` +
                `};`
        );
    });
});
