import {describe, it, expect} from 'vitest';
import {parseComponents} from '../src/parser';

describe('parseComponents', () => {
    it('should parse a basic function component with props', async () => {
        const components = await parseComponents(
            'input_files/BasicComponentInput.tsx'
        );

        expect(components.length).toBe(1);
        expect(components[0]).toEqual({
            name: 'HelloWorld',
            sourceFilePath: expect.any(String),
            props: [
                {name: 'name', type: 'string', required: true},
                {name: 'age', type: 'number', required: true},
            ],
        });
    });

    it('should handle optional props correctly', async () => {
        const components = await parseComponents('examples/optional.tsx');

        expect(components[0].props).toContainEqual({
            name: 'title',
            type: 'string',
            required: false,
        });
    });

    it('should ignore files with no components', async () => {
        const components = await parseComponents('examples/no-components.tsx');
        expect(components.length).toBe(0);
    });
});
