import {describe, it, expect} from 'vitest';
import {Project} from 'ts-morph';
import parseComponentDeclaration from '../src/parseComponentDeclaration';
import ts from 'typescript';

const createMockFunctionComponent = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile('TestComponent.tsx', code);
    const func = sourceFile.getFunctions()[0];
    return {func, sourceFile};
};

const createMockArrowFunctionComponent = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile('TestArrowComponent.tsx', code);
    const variable = sourceFile.getVariableDeclarationOrThrow('HelloWorld');
    const func = variable.getInitializerIfKindOrThrow(
        ts.SyntaxKind.ArrowFunction
    );
    return {func, sourceFile};
};

const createMockDefaultFunctionComponent = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile(
        'TestDefaultComponent.tsx',
        code
    );
    const func = sourceFile.getFunctions()[0];
    return {func, sourceFile};
};

const createMockNonComponent = (code: string) => {
    const project = new Project();
    const sourceFile = project.createSourceFile('TestNonComponent.tsx', code);
    const variable = sourceFile.getVariableDeclarationOrThrow('NotAComponent');
    return {variable, sourceFile};
};

/**
 * Test suite for parseComponentDeclaration module. If working as intended,
 * this module should expose one method that will correctly parse a given component's
 * declaration. 
 */
describe('parseComponentDeclaration', () => {
    it('should extract props from a function component', () => {
        const {func, sourceFile} = createMockFunctionComponent(`
      type Props = { name: string };
      export function HelloWorld({ name }: Props) {
        return <div>{name}</div>;
      }
    `);

        const result = parseComponentDeclaration(
            'HelloWorld',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'HelloWorld',
            sourceFilePath: expect.any(String),
            props: [{name: 'name', type: 'string', required: true}],
        });
    });
    it('should extract props from an arrow function component', () => {
        const {func, sourceFile} = createMockArrowFunctionComponent(`
            type Props = { name: string };
            export const HelloWorld = ({ name }: Props) => {
              return (<div>{name}</div>);
            };
          `);

        const result = parseComponentDeclaration(
            'HelloWorld',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'HelloWorld',
            sourceFilePath: expect.any(String),
            props: [{name: 'name', type: 'string', required: true}],
        });
    });
    it('should extract props from a default exported function component', () => {
        const {func, sourceFile} = createMockDefaultFunctionComponent(`
          type Props = { title: string };
          export default function HelloWorld({ title }: Props) {
            return (<div>{title}</div>);
          }
        `);

        const result = parseComponentDeclaration(
            'default', // name from export
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'default',
            sourceFilePath: expect.any(String),
            props: [{name: 'title', type: 'string', required: true}],
        });
    });
    it('should return null for non component input', () => {
        const {variable, sourceFile} = createMockNonComponent(`
            export const NotAComponent = 42;
            `);
        const result = parseComponentDeclaration(
            'NotAComponent',
            variable,
            sourceFile.getFilePath()
        );
        expect(result).toBeNull();
    });
});
