import {describe, it, expect} from 'vitest';
import {Project} from 'ts-morph';
import {createSourceFile} from '../src/writer';
import {ComponentInfo} from '../src/interfaces/ComponentInfo';
import {WriteOptions} from '../src/types';

/**
 * Test suite for file writing logic. If working as intended, this module
 * should be able to accept a string of input derived from ComponentInfo, and then
 * write that properly formed to a new props file with a standardized extension and ending.
 */
describe('createSourceFile', () => {
    it('should create a .propTypes.ts file with correct PropTypes block', async () => {
        const mockComponent: ComponentInfo = {
            name: 'TestComponent',
            sourceFilePath: 'src/components/TestComponent.tsx',
            props: [
                {name: 'title', type: 'string', required: true},
                {name: 'count', type: 'number', required: false},
            ],
        };

        const writeOptions: WriteOptions = {
            outDir: '/test',
            inline: false,
            prettier: false,
        };

        const project = new Project({
            useInMemoryFileSystem: true,
        });

        await createSourceFile(mockComponent, project, writeOptions);

        const generated = project.getSourceFileOrThrow(
            '/test/TestComponent.propTypes.ts'
        );
        const text = generated.getFullText();

        expect(generated.getImportDeclaration('prop-types')).toBeDefined();
        expect(text).toContain('TestComponent.propTypes = {');
        expect(text).toContain('title: PropTypes.string.isRequired');
        expect(text).toContain('count: PropTypes.number');
        expect(text.trim().endsWith('};')).toBe(true);
    });
    it('should append PropTypes to the original file when inline is true', async () => {
        const project = new Project({useInMemoryFileSystem: true});

        const file = project.createSourceFile(
            'src/components/TestComponent.tsx',
            '',
            {overwrite: true}
        );

        const mockComponent: ComponentInfo = {
            name: 'TestComponent',
            sourceFilePath: 'src/components/TestComponent.tsx',
            props: [{name: 'foo', type: 'boolean', required: true}],
        };

        await createSourceFile(mockComponent, project, {
            inline: true,
            prettier: false,
        });

        const updated = project.getSourceFileOrThrow(
            'src/components/TestComponent.tsx'
        );
        const text = updated.getFullText();
        expect(text).toContain('TestComponent.propTypes =');
    });
});
