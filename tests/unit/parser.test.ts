import {describe, it, expect} from 'vitest';
import {parseComponents} from '../../src/core/parser';
import {Project} from 'ts-morph';

describe('parser', () => {
    const createMockSourceFile = (code: string) => {
        const project = new Project();
        const sourceFile = project.createSourceFile('TestFile.tsx', code);
        return sourceFile;
    };

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
                props: [
                    {
                        name: 'name',
                        type: {kind: 'primitive', name: 'string'},
                        required: true,
                    },
                ],
            },
            {
                name: 'Card',
                sourceFilePath: expect.any(String),
                props: [
                    {
                        name: 'title',
                        type: {kind: 'primitive', name: 'string'},
                        required: true,
                    },
                    {
                        name: 'description',
                        type: {kind: 'primitive', name: 'string'},
                        required: false,
                    },
                ],
            },
        ]);
    });

    it('should extract components with union types correctly', async () => {
        const sourceFile = createMockSourceFile(`
            type ButtonProps = { 
                variant: 'primary' | 'secondary' | 'danger';
                size?: 'small' | 'medium' | 'large';
                onClick: () => void;
            };
            export function Button({ variant, size, onClick }: ButtonProps) {
                return <button className={\`\${variant} \${size}\`} onClick={onClick}>Button</button>;
            }

            type InputProps = {
                value: string | number;
                onChange: (value: string | number) => void;
                type?: 'text' | 'password' | 'number';
            };
            export const Input = ({ value, onChange, type = 'text' }: InputProps) => {
                return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />;
            };
        `);

        const components = await parseComponents(sourceFile);

        expect(components.length).toBe(2);

        // Check Button component
        const buttonComponent = components.find((c) => c.name === 'Button');
        expect(buttonComponent).toBeDefined();
        expect(buttonComponent?.props).toContainEqual({
            name: 'variant',
            type: {kind: 'oneOf', values: ['primary', 'secondary', 'danger']},
            required: true,
        });
        expect(buttonComponent?.props).toContainEqual({
            name: 'size',
            type: {kind: 'oneOf', values: ['small', 'medium', 'large']},
            required: false,
        });

        // Check Input component
        const inputComponent = components.find((c) => c.name === 'Input');
        expect(inputComponent).toBeDefined();

        // Find the value prop in the Input component
        const valueProp = inputComponent?.props.find((p) => p.name === 'value');
        expect(valueProp).toBeDefined();
        expect(valueProp?.type.kind).toBe('oneOfType');

        // Find the type prop in the Input component
        const typeProp = inputComponent?.props.find((p) => p.name === 'type');
        expect(typeProp).toBeDefined();
        expect(typeProp?.type.kind).toBe('oneOf');
        if (typeProp?.type.kind === 'oneOf') {
            expect(typeProp?.type.values.length).toBe(3);
            expect(typeProp?.type.values).toEqual(
                expect.arrayContaining(['text', 'password', 'number'])
            );
        } else {
            throw new Error(
                `Expected typeProp kind to be 'oneOf', got ${typeProp?.type.kind}`
            );
        }
    });

    it('should return an empty array if no components are found', async () => {
        const sourceFile = createMockSourceFile(`
            const something = 123;
            const anotherThing = () => 456;
        `);

        const components = await parseComponents(sourceFile);

        expect(components).toEqual([]);
    });

    it('should handle multiple complex components in a single file', async () => {
        const sourceFile = createMockSourceFile(`
            type ListProps<T> = {
                items: T[];
                renderItem: (item: T, index: number) => React.ReactNode;
                keyExtractor?: (item: T, index: number) => string;
                emptyMessage?: string;
            };
            export function List<T>({ 
                items, 
                renderItem, 
                keyExtractor = (_, index) => index.toString(),
                emptyMessage = 'No items to display'
            }: ListProps<T>) {
                return (
                    <div>
                        {items.length === 0 ? (
                            <p>{emptyMessage}</p>
                        ) : (
                            <ul>
                                {items.map((item, index) => (
                                    <li key={keyExtractor(item, index)}>
                                        {renderItem(item, index)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            }

            type FormProps = {
                onSubmit: (data: Record<string, any>) => void;
                initialValues?: Record<string, any>;
                validation?: Record<string, (value: any) => string | null>;
                children: React.ReactNode;
            };
            export const Form = ({ 
                onSubmit, 
                initialValues = {}, 
                validation = {},
                children 
            }: FormProps) => {
                // Component implementation
                return <form onSubmit={() => onSubmit({})}>{children}</form>;
            };
        `);

        const components = await parseComponents(sourceFile);

        expect(components.length).toBe(2);

        // Check List component props
        const listComponent = components.find((c) => c.name === 'List');
        expect(listComponent).toBeDefined();
        expect(listComponent?.props).toContainEqual({
            name: 'items',
            type: {kind: 'array'},
            required: true,
        });
        expect(listComponent?.props).toContainEqual({
            name: 'renderItem',
            type: {kind: 'function'},
            required: true,
        });

        // Check Form component props
        const formComponent = components.find((c) => c.name === 'Form');
        expect(formComponent).toBeDefined();
        expect(formComponent?.props).toContainEqual({
            name: 'onSubmit',
            type: {kind: 'function'},
            required: true,
        });
        expect(formComponent?.props).toContainEqual(
            expect.objectContaining({
                name: 'children',
                required: true,
                type: expect.objectContaining({
                    kind: expect.any(String), // Accept any kind, since React.ReactNode might be complex
                }),
            })
        );
    });
});
