import {describe, it, expect} from 'vitest';
import {Project} from 'ts-morph';
import parseComponentDeclaration from '../src/parseComponentDeclaration';
import ts from 'typescript';

describe('parseComponentDeclaration', () => {
    const createMockFunctionComponent = (code: string) => {
        const project = new Project();
        const sourceFile = project.createSourceFile('TestComponent.tsx', code);
        const func = sourceFile.getFunctions()[0];
        return {func, sourceFile};
    };

    const createMockArrowFunctionComponent = (code: string) => {
        const project = new Project();
        const sourceFile = project.createSourceFile(
            'TestArrowComponent.tsx',
            code
        );
        const variable =
            sourceFile.getVariableDeclarationOrThrow('ArrowComponent');
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
        const sourceFile = project.createSourceFile(
            'TestNonComponent.tsx',
            code
        );
        const variable =
            sourceFile.getVariableDeclarationOrThrow('NotAComponent');
        return {variable, sourceFile};
    };

    it('should extract props from a function component with basic types', () => {
        const {func, sourceFile} = createMockFunctionComponent(`
            type Props = { 
                name: string;
                count: number;
                active: boolean;
            };
            export function TestComponent({ name, count, active }: Props) {
                return <div>{name} {count} {active}</div>;
            }
        `);

        const result = parseComponentDeclaration(
            'TestComponent',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'TestComponent',
            sourceFilePath: expect.any(String),
            props: [
                {
                    name: 'name',
                    type: {kind: 'primitive', name: 'string'},
                    required: true,
                },
                {
                    name: 'count',
                    type: {kind: 'primitive', name: 'number'},
                    required: true,
                },
                {
                    name: 'active',
                    type: {kind: 'primitive', name: 'boolean'},
                    required: true,
                },
            ],
        });
    });

    it('should extract props from a function component with oneOf (enum) types', () => {
        const {func, sourceFile} = createMockFunctionComponent(`
            type Props = { 
                variant: 'primary' | 'secondary' | 'danger';
                size?: 'small' | 'medium' | 'large';
            };
            export function Button({ variant, size }: Props) {
                return <button className={\`\${variant} \${size}\`}>Button</button>;
            }
        `);

        const result = parseComponentDeclaration(
            'Button',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'Button',
            sourceFilePath: expect.any(String),
            props: [
                {
                    name: 'variant',
                    type: {
                        kind: 'oneOf',
                        values: ['primary', 'secondary', 'danger'],
                    },
                    required: true,
                },
                {
                    name: 'size',
                    type: {kind: 'oneOf', values: ['small', 'medium', 'large']},
                    required: false,
                },
            ],
        });
    });

    it('should extract props from a function component with oneOfType (mixed unions)', () => {
        const {func, sourceFile} = createMockFunctionComponent(`
            type Props = { 
                id: string | number;
                content: string | React.ReactNode;
            };
            export function Content({ id, content }: Props) {
                return <div id={id}>{content}</div>;
            }
        `);

        const result = parseComponentDeclaration(
            'Content',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'Content',
            sourceFilePath: expect.any(String),
            props: expect.arrayContaining([
                expect.objectContaining({
                    name: 'id',
                    type: expect.objectContaining({
                        kind: 'oneOfType',
                        types: expect.arrayContaining([
                            {kind: 'primitive', name: 'string'},
                            {kind: 'primitive', name: 'number'},
                        ]),
                    }),
                    required: true,
                }),
            ]),
        });
    });

    it('should extract props from an arrow function component', () => {
        const {func, sourceFile} = createMockArrowFunctionComponent(`
            type Props = { 
                title: string;
                subtitle?: string;
                items: string[];
            };
            export const ArrowComponent = ({ title, subtitle, items }: Props) => {
                return (
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <h2>{subtitle}</h2>}
                        <ul>
                            {items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                );
            };
        `);

        const result = parseComponentDeclaration(
            'ArrowComponent',
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'ArrowComponent',
            sourceFilePath: expect.any(String),
            props: [
                {
                    name: 'title',
                    type: {kind: 'primitive', name: 'string'},
                    required: true,
                },
                {
                    name: 'subtitle',
                    type: {kind: 'primitive', name: 'string'},
                    required: false,
                },
                {name: 'items', type: {kind: 'array'}, required: true},
            ],
        });
    });

    it('should extract props from a default exported function component', () => {
        const {func, sourceFile} = createMockDefaultFunctionComponent(`
            type Props = { 
                label: string;
                onClick: () => void;
            };
            export default function Button({ label, onClick }: Props) {
                return <button onClick={onClick}>{label}</button>;
            }
        `);

        const result = parseComponentDeclaration(
            'default', // name from export
            func,
            sourceFile.getFilePath()
        );

        expect(result).toEqual({
            name: 'Button',
            sourceFilePath: expect.any(String),
            props: [
                {
                    name: 'label',
                    type: {kind: 'primitive', name: 'string'},
                    required: true,
                },
                {name: 'onClick', type: {kind: 'function'}, required: true},
            ],
        });
    });

    it('should return null for non-component input', () => {
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
