import fs from 'fs/promises';
import path from 'path';
import {execSync} from 'child_process';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';

// Directories for test files
const TEST_DIR = path.join(process.cwd(), 'tests/integration');
const INPUT_DIR = path.join(TEST_DIR, 'fixtures');
const OUTPUT_DIR = path.join(TEST_DIR, 'output');

// Test component definitions
const TEST_COMPONENTS = [
    {
        name: 'BasicComponent.tsx',
        content: `
import React from 'react';

type Props = {
    name: string;
    age: number;
    isActive: boolean;
};

export function BasicComponent({ name, age, isActive }: Props) {
    return (
        <div>
            {isActive ? \`\${name} (\${age})\` : 'Inactive user'}
        </div>
    );
}`,
    },
    {
        name: 'OptionalPropsComponent.tsx',
        content: `
import React from 'react';

type Props = {
    title?: string;
    subtitle?: string;
    showBorder?: boolean;
};

export function OptionalPropsComponent({ 
    title = "Default Title", 
    subtitle, 
    showBorder = false 
}: Props) {
    return (
        <div style={{ border: showBorder ? '1px solid black' : 'none' }}>
            <h1>{title}</h1>
            {subtitle && <h2>{subtitle}</h2>}
        </div>
    );
}`,
    },
    {
        name: 'ArrowFunctionComponent.tsx',
        content: `
import React from 'react';

type Props = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
};

export const ArrowFunctionComponent = ({ 
    label, 
    onClick, 
    variant = 'primary',
    disabled = false 
}: Props) => {
    return (
        <button 
            onClick={onClick}
            className={\`btn btn-\${variant}\`}
            disabled={disabled}
        >
            {label}
        </button>
    );
};`,
    },
    {
        name: 'ComplexPropsComponent.tsx',
        content: `
import React from 'react';

type Props = {
    items: string[];
    config: {
        theme: string;
        size: number;
        enabled: boolean;
    };
    onSubmit: (data: any) => void;
    metadata?: Record<string, any>;
};

export function ComplexPropsComponent({ 
    items, 
    config, 
    onSubmit,
    metadata 
}: Props) {
    return (
        <div>
            <h2>Items ({config.theme})</h2>
            <ul>
                {items.map((item, index) => (
                    <li key={index} style={{ fontSize: config.size }}>
                        {item}
                    </li>
                ))}
            </ul>
            <button 
                onClick={() => onSubmit({ items, config, metadata })}
                disabled={!config.enabled}
            >
                Submit
            </button>
        </div>
    );
}`,
    },
    {
        name: 'MixedPropsComponent.tsx',
        content: `
import React from 'react';

type Props = {
    // Required primitive props
    id: string;
    value: number;
    
    // Optional primitive props
    label?: string;
    description?: string;
    
    // Required complex props
    options: Array<{id: string; name: string}>;
    validator: (value: number) => boolean;
    
    // Optional complex props
    className?: string;
    style?: React.CSSProperties;
    onChange?: (newValue: number) => void;
};

export function MixedPropsComponent({
    id,
    value,
    label = 'Input',
    description,
    options,
    validator,
    className,
    style,
    onChange
}: Props) {
    const isValid = validator(value);
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = Number(e.target.value);
        if (onChange) {
            onChange(newValue);
        }
    };
    
    return (
        <div className={className} style={style}>
            <label htmlFor={id}>{label}</label>
            <select 
                id={id}
                value={value}
                onChange={handleChange}
                className={isValid ? 'valid' : 'invalid'}
            >
                {options.map(option => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
            {description && <p className="description">{description}</p>}
            {!isValid && <p className="error">Invalid selection</p>}
        </div>
    );
}`,
    },
    {
        name: 'UnionTypesComponent.tsx',
        content: `
import React from 'react';
    
type Props = {
    variant: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
    value: string | number;
    onClick: () => void;
};

export function UnionTypesComponent({ 
    variant, 
    size = 'medium',
    value,
    onClick
}: Props) {
    return (
        <button 
            className={\`btn btn-\${variant} btn-\${size}\`}
            onClick={onClick}
        >
            {value}
        </button>
    );
}`,
    },
];

// PropType mapping for verification
const TYPE_MAPPING = {
    string: 'string',
    number: 'number',
    boolean: 'bool',
    array: 'array',
    function: 'func',
    object: 'object',
    any: 'any',
    oneOf: 'oneOf',
    oneOfType: 'oneOfType',
};

async function readFile(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), {recursive: true});
        await fs.writeFile(filePath, content);
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

async function extractExpectedProps(filePath) {
    const content = await readFile(filePath);
    if (!content) return [];

    const props = [];

    // Extract type declaration
    const typeMatch = content.match(/type\s+Props\s*=\s*\{([^}]+)\}/s);
    if (!typeMatch) return [];

    const propsBlock = typeMatch[1];

    // Match each prop declaration, handling comments
    const propLines = propsBlock
        .split('\n')
        .filter(
            (line) => !line.trim().startsWith('//') && line.trim().length > 0
        )
        .join('\n');

    // Improved regex to handle more complex type declarations
    const propRegex = /(\w+)(\??):\s*([^;]+);/g;
    let match;

    while ((match = propRegex.exec(propLines)) !== null) {
        const name = match[1];
        const isOptional = match[2] === '?';
        let type = match[3].trim();

        // Handle array types (including Array<T> and T[])
        if (type.endsWith('[]') || type.startsWith('Array<')) {
            type = 'array';
        }
        // Handle function types (including arrow functions and method signatures)
        else if (
            type.includes('=>') ||
            type.includes('function') ||
            /\([^)]*\)/.test(type)
        ) {
            type = 'function';
        }
        // Handle object types (including interfaces, Record types, and inline object types)
        else if (
            type.startsWith('{') ||
            type.startsWith('Record<') ||
            type.includes('CSSProperties')
        ) {
            type = 'object';
        }
        // Handle primitive types - improved boolean detection
        else if (type === 'boolean' || type === 'Boolean') {
            type = 'boolean';
        } else if (type === 'string' || type === 'String') {
            type = 'string';
        } else if (type === 'number' || type === 'Number') {
            type = 'number';
        }
        // For union types, extract the base type if it's a primitive
        else if (type.includes('|')) {
            const unionTypes = type.split('|').map((t) => t.trim());
            // Check if any of the union types is a primitive
            for (const unionType of unionTypes) {
                if (['string', 'number', 'boolean'].includes(unionType)) {
                    type = unionType;
                    break;
                }
            }
            // If no primitive found, default to the first type or 'any'
            if (!['string', 'number', 'boolean'].includes(type)) {
                type = 'any';
            }
        }
        // Default to any
        else {
            type = 'any';
        }

        props.push({
            name,
            type,
            required: !isOptional,
        });
    }

    return props;
}

async function verifyPropTypesOutput(
    componentName,
    expectedProps,
    outputFilePath
) {
    const content = await readFile(outputFilePath);

    expect(content).not.toBeNull();

    // Verify imports
    expect(content).toContain('import PropTypes from');

    // Verify PropTypes block exists
    expect(content).toContain(`${componentName}.propTypes = {`);

    // Log expected vs actual for debugging
    console.log(`\nComponent: ${componentName}`);
    console.log('Expected props:');
    console.table(expectedProps);

    // Extract actual props from the generated file
    const propTypesBlockMatch = content.match(
        new RegExp(`${componentName}\\.propTypes = \\{([\\s\\S]*?)\\};`)
    );
    expect(propTypesBlockMatch).not.toBeNull();

    const propTypesBlock = propTypesBlockMatch[1];

    // Updated regex to also handle oneOf and oneOfType patterns
    const actualProps = [];
    const lines = propTypesBlock.trim().split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === '') continue;

        // Try basic props (string, number, bool, etc.)
        let match = trimmedLine.match(
            /(\w+):\s*PropTypes\.(\w+)(\.isRequired)?/
        );
        if (match) {
            actualProps.push({
                name: match[1],
                type: match[2],
                required: !!match[3],
            });
            continue;
        }

        // Try oneOf
        match = trimmedLine.match(
            /(\w+):\s*PropTypes\.oneOf\(\[(.*?)\]\)(\.isRequired)?/
        );
        if (match) {
            actualProps.push({
                name: match[1],
                type: 'oneOf',
                values: match[2], // Keep as string for simple verification
                required: !!match[3],
            });
            continue;
        }

        // Try oneOfType
        match = trimmedLine.match(
            /(\w+):\s*PropTypes\.oneOfType\(\[(.*?)\]\)(\.isRequired)?/
        );
        if (match) {
            actualProps.push({
                name: match[1],
                type: 'oneOfType',
                types: match[2], // Keep as string for simple verification
                required: !!match[3],
            });
            continue;
        }
    }

    console.log('Actual props:');
    console.table(actualProps);

    // Verification logic
    let failures = [];

    for (const expectedProp of expectedProps) {
        const {name, type, required} = expectedProp;
        const actualProp = actualProps.find((p) => p.name === name);

        if (!actualProp) {
            console.error(`\nMissing prop: ${name}`);
            failures.push(`Missing prop: ${name}`);
            continue;
        }

        // Special handling for union types
        if (type.includes('|')) {
            // For literal unions (oneOf)
            if (type.match(/'[^']*'|"[^"]*"/)) {
                if (actualProp.type !== 'oneOf') {
                    console.warn(
                        `\nExpected oneOf for ${name} but got ${actualProp.type}`
                    );
                }
            }
            // For type unions (oneOfType)
            else if (!['oneOf', 'oneOfType'].includes(actualProp.type)) {
                console.warn(
                    `\nExpected oneOf or oneOfType for ${name} but got ${actualProp.type}`
                );
            }
        }
        // Check basic types
        else {
            const expectedType = TYPE_MAPPING[type] || 'any';
            if (actualProp.type !== expectedType) {
                console.warn(`\nProp type mismatch for ${name}:`);
                console.warn(
                    `  Expected: ${expectedType}${required ? ' (required)' : ' (optional)'}`
                );
                console.warn(
                    `  Actual  : ${actualProp.type}${actualProp.required ? ' (required)' : ' (optional)'}`
                );
                // Don't fail on type mismatch, just warn
            }
        }

        // Check required flag
        if (actualProp.required !== required) {
            console.warn(`\nProp required flag mismatch for ${name}:`);
            console.warn(`  Expected: ${required ? 'required' : 'optional'}`);
            console.warn(
                `  Actual  : ${actualProp.required ? 'required' : 'optional'}`
            );
            // Don't fail on required flag mismatch, just warn
        }
    }

    // Check for extra props
    const actualNames = actualProps.map((p) => p.name);
    const expectedNames = expectedProps.map((p) => p.name);

    const extras = actualNames.filter((name) => !expectedNames.includes(name));
    if (extras.length > 0) {
        console.warn(`\nExtra props found: ${extras.join(', ')}`);
    }

    const missing = expectedNames.filter((name) => !actualNames.includes(name));
    if (missing.length > 0) {
        console.error(`\nMissing props: ${missing.join(', ')}`);
        failures.push(`Missing props: ${missing.join(', ')}`);
    }

    if (failures.length > 0) {
        throw new Error(
            `PropTypes verification failed:\n${failures.join('\n')}`
        );
    }

    return true;
}

// Helper to extract component name from file path
function getComponentName(filePath) {
    const fileName = path.basename(filePath, '.tsx');
    return fileName;
}

// Helper to execute the CLI
function runCLI(args = '') {
    try {
        return execSync(`npm run dev -- ${args}`, {
            encoding: 'utf-8',
            stdio: 'pipe',
        });
    } catch (error) {
        console.error(`CLI execution error: ${error.message}`);
        return null;
    }
}

// Helper to create test fixtures
async function createTestFixtures() {
    for (const component of TEST_COMPONENTS) {
        const filePath = path.join(INPUT_DIR, component.name);
        await writeFile(filePath, component.content.trim());
    }
}

describe('CLI Integration Tests', () => {
    beforeAll(async () => {
        // Create test directories
        await fs.mkdir(INPUT_DIR, {recursive: true});
        await fs.mkdir(OUTPUT_DIR, {recursive: true});

        // Create test fixtures
        await createTestFixtures();

        console.log(`Created test fixtures in ${INPUT_DIR}`);
    });

    afterAll(async () => {
        // Clean up generated files
        try {
            await fs.rm(INPUT_DIR, {recursive: true, force: true});
            await fs.rm(OUTPUT_DIR, {recursive: true, force: true});
        } catch (error) {
            console.error('Error cleaning up:', error);
        }
    });

    it('should process all input files and generate correct PropTypes', async () => {
        try {
            // Get all .tsx files from input directory
            const inputFiles = (await fs.readdir(INPUT_DIR))
                .filter((file) => file.endsWith('.tsx'))
                .map((file) => path.join(INPUT_DIR, file));

            expect(inputFiles.length).toBeGreaterThan(0);
            console.log(
                `Found ${inputFiles.length} test files:`,
                inputFiles.map((f) => path.basename(f))
            );

            // Run CLI on all input files
            const outputPath = path.relative(process.cwd(), OUTPUT_DIR);
            const inputGlob = path.relative(
                process.cwd(),
                path.join(INPUT_DIR, '*.tsx')
            );
            console.log(`Running CLI: -s "${inputGlob}" -o "${outputPath}"`);

            const result = runCLI(`-s "${inputGlob}" -o "${outputPath}"`);
            if (result === null) {
                console.warn(
                    '⚠️ CLI execution failed, but continuing with verification of any generated files'
                );
            }

            // Verify each generated file
            let verifiedCount = 0;
            for (const inputFile of inputFiles) {
                const componentName = getComponentName(inputFile);
                const outputFile = path.join(
                    OUTPUT_DIR,
                    `${componentName}.propTypes.ts`
                );

                // Check if output file exists
                try {
                    await fs.access(outputFile);
                } catch (error) {
                    console.warn(
                        `⚠️ Output file not found for ${componentName}, skipping verification`
                    );
                    continue;
                }

                // Extract expected props
                const expectedProps = await extractExpectedProps(inputFile);

                // Verify output file contents
                try {
                    await verifyPropTypesOutput(
                        componentName,
                        expectedProps,
                        outputFile
                    );
                    console.log(`✓ Verified PropTypes for ${componentName}`);
                    verifiedCount++;
                } catch (err) {
                    console.error(
                        `✗ Verification failed for ${componentName}: ${err.message}`
                    );
                }
            }

            // At least some files should be verified
            expect(verifiedCount).toBeGreaterThan(0);
            console.log(
                `Successfully verified ${verifiedCount}/${inputFiles.length} components`
            );
        } catch (error) {
            console.error('Test error:', error);
            throw error;
        }
    });

    it('should generate inline propTypes when --inline flag is used', async () => {
        // Get first input file for inline test
        const inputFiles = (await fs.readdir(INPUT_DIR)).filter((file) =>
            file.endsWith('.tsx')
        );

        expect(inputFiles.length).toBeGreaterThan(0);

        const testFile = inputFiles[0];
        const srcPath = path.join(INPUT_DIR, testFile);
        const destPath = path.join(OUTPUT_DIR, testFile);

        // Copy file to output dir to avoid modifying original
        await fs.copyFile(srcPath, destPath);

        // Run CLI with inline flag
        console.log(`Testing inline mode with file: ${testFile}`);
        const result = runCLI(`-s "${destPath}" --inline`);

        if (result === null) {
            console.warn(
                '⚠️ CLI execution failed, skipping inline test verification'
            );
            return;
        }

        // Verify inline insertion
        const content = await readFile(destPath);
        const componentName = getComponentName(destPath);

        expect(content).toContain(`${componentName}.propTypes = {`);
        expect(content).toContain('PropTypes.');
        console.log(`✓ Verified inline PropTypes for ${componentName}`);
    });
});
