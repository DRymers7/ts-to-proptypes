import {describe, it, expect} from 'vitest';
import {parseComponents} from '../src/parser';
import {Project} from 'ts-morph';

const createMockSourceFile = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile('TestFile.tsx', code);
    return sourceFile;
};

describe('parserTests', () => {
    it('should extract all components and their props from a file', async () => {
        const sourceFile = createMockSourceFile(`
      type HelloProps = { name: string };
      export function HelloWorld({ name }: HelloProps) {
        return <div>Hello {name}</div>;
      }

      type CardProps = { title: string; description?: string };
      export const Card = ({ title, description }: CardProps) => {
        return <div>{title} - {description}</div>;
      };

      export const NotAComponent = 42;
    `);

        const components = await parseComponents(sourceFile);

        expect(components).toEqual([
            {
                name: 'HelloWorld',
                sourceFilePath: expect.any(String),
                props: [{name: 'name', type: 'string', required: true}],
            },
            {
                name: 'Card',
                sourceFilePath: expect.any(String),
                props: [
                    {name: 'title', type: 'string', required: true},
                    {name: 'description', type: 'string', required: false},
                ],
            },
        ]);
    });

    it('should return an empty array if no components are found', async () => {
        const sourceFile = createMockSourceFile(`
      const something = 123;
      const anotherThing = () => 456;
    `);

        const components = await parseComponents(sourceFile);

        expect(components).toEqual([]);
    });
});
