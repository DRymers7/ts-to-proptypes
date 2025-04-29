import {describe, it, expect} from 'vitest';
import {Project} from 'ts-morph';
import {createSourceFile} from '../src/writer';
import {ComponentInfo} from '../src/interfaces/ComponentInfo';

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

        const project = new Project({
            useInMemoryFileSystem: true,
        });

        await createSourceFile(mockComponent, project);

        const generated = project.getSourceFileOrThrow(
            'src/components/TestComponent.propTypes.ts'
        );
        const text = generated.getFullText();

        const hasImport = !!generated.getImportDeclaration('prop-types');
        expect(hasImport).toBe(true);

        expect(text).toContain('TestComponent.propTypes = {');
        expect(text).toContain('title: PropTypes.string.isRequired');
        expect(text).toContain('count: PropTypes.number');

        expect(text.trim().endsWith('};')).toBe(true);
    });
});
