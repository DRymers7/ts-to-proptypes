import {describe, it, expect, expectTypeOf} from 'vitest';
import parseComponentDeclaration from '../src/parseComponentDeclaration';
import {Project} from 'ts-morph';
import extractPropsFromParameter from '../src/extractPropsFromParameter';

const createMockParameterFromText = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile('TestComponent.tsx', code);
    project.createSourceFile('test.txt', code);
    const func = sourceFile.getFunctions()[0];
    return func.getParameters()[0];
};

describe('parseComponentDeclaration tests', () => {
    it('should extract simmple props correctly', () => {
        const param = createMockParameterFromText(`
            type: Props = { name: string };
            function HelloWorld({ name }: Props) {}
            `);
        const extractedProps = extractPropsFromParameter(param);
        expect(extractedProps).toEqual({
            name: 'name',
            type: 'string',
            required: true,
        });
    });
});
