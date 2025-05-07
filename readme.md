![npm version](https://img.shields.io/npm/v/ts-to-proptypes)
![build status](https://img.shields.io/github/actions/workflow/status/DRymers7/ts-to-proptypes/ci.yml?branch=main)
![license](https://img.shields.io/github/license/DRymers7/ts-to-proptypes)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9%2B-blue)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# ts-to-proptypes

Generate React PropTypes declarations automatically from TypeScript interfaces and types.

## Introduction

`ts-to-proptypes` is a developer tool that bridges the gap between TypeScript's static type system and React's runtime PropTypes validation. It analyzes your TypeScript React components and generates corresponding PropTypes definitions, enhancing your components with runtime type checking without the manual effort of maintaining duplicate type definitions.

This tool is particularly useful for projects that:

- Use TypeScript for static type checking
- Need runtime validation through PropTypes
- Want to maintain consistency between TypeScript types and PropTypes
- Generate documentation from PropTypes (such as with Storybook)

## Installation

Install the package as a development dependency:

```bash
# Using npm
npm install ts-to-proptypes --save-dev

# Using yarn
yarn add ts-to-proptypes --dev

# Using pnpm
pnpm add -D ts-to-proptypes
```

#### Installing from GitHub Packages
Add this to your project's .npmrc file:

```bash 
@drymers:registry=https://npm.pkg.github.com
```
Then, install normally 

```bash
npm install @drymers/ts-to-proptypes --save-dev
```

## Features

`ts-to-proptypes` provides several key features to enhance your React development workflow:

- **Automatic PropTypes Generation**: Convert TypeScript interfaces and types to PropTypes declarations
- **Function Component Support**: Works with both standard and arrow function components
- **Default Export Detection**: Properly handles default exports by identifying the actual component name
- **Required Props Identification**: Preserves optional/required status from TypeScript definitions
- **Type Mapping**: Intelligently maps TypeScript types to appropriate PropTypes validators
- **Inline or Separate Files**: Generate PropTypes in the same file or in separate files
- **Prettier Integration**: Format the generated code according to your project's Prettier configuration

## Usage

### Command Line Interface

The basic usage of the CLI is:

```bash
npx ts-to-proptypes -s "src/components/**/*.tsx" -o "output"
```

For persistent usage, add it to your package.json scripts:

```json
"scripts": {
  "generate-proptypes": "ts-to-proptypes -s \"src/components/**/*.tsx\" -o \"src/proptypes\""
}
```

### Example

Given a TypeScript component:

```tsx
// Button.tsx
import React from 'react';

type ButtonProps = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
};

export function Button({
    label,
    onClick,
    variant = 'primary',
    disabled = false,
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`btn btn-${variant}`}
            disabled={disabled}
        >
            {label}
        </button>
    );
}
```

`ts-to-proptypes` generates:

```tsx
// Button.propTypes.ts
import PropTypes from 'prop-types';

Button.propTypes = {
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.string,
    disabled: PropTypes.bool,
};
```

### Inline Mode

With the `--inline` flag, PropTypes are added directly to the component file:

```tsx
// Button.tsx after inline generation
import React from 'react';
import PropTypes from 'prop-types';

type ButtonProps = {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
};

export function Button({
    label,
    onClick,
    variant = 'primary',
    disabled = false,
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`btn btn-${variant}`}
            disabled={disabled}
        >
            {label}
        </button>
    );
}

Button.propTypes = {
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    variant: PropTypes.string,
    disabled: PropTypes.bool,
};
```

## Command Line Options

| Option       | Alias | Description                             | Default           |
| ------------ | ----- | --------------------------------------- | ----------------- |
| `--source`   | `-s`  | Glob pattern for source files           | `src/**/*.tsx`    |
| `--outDir`   | `-o`  | Directory to place generated files      | Current directory |
| `--inline`   | -     | Append PropTypes into the original file | `false`           |
| `--prettier` | -     | Format generated files using Prettier   | `false`           |

## How It Works

`ts-to-proptypes` operates in several stages:

1. **Component Detection**: Parses the TypeScript AST to identify React components in your codebase
2. **Props Extraction**: Extracts props interface or type definitions from the components
3. **Type Analysis**: Analyzes TypeScript types and maps them to PropTypes equivalents
4. **Code Generation**: Generates PropTypes declarations with proper typing and requirement flags
5. **Output**: Writes the PropTypes either to separate files or inline with the components

The tool uses the powerful `ts-morph` library to analyze TypeScript code and maintain type accuracy.

## Type Mapping

TypeScript types are mapped to PropTypes as follows:

| TypeScript Type            | PropTypes Equivalent |
| -------------------------- | -------------------- |
| `string`                   | `PropTypes.string`   |
| `number`                   | `PropTypes.number`   |
| `boolean`                  | `PropTypes.bool`     |
| `any`                      | `PropTypes.any`      |
| `Array<T>` or `T[]`        | `PropTypes.array`    |
| `Function` or `() => void` | `PropTypes.func`     |
| `object` or `{}`           | `PropTypes.object`   |

Optional props (marked with `?`) don't include the `.isRequired` validator.

## Supported TypeScript Types

| TypeScript Type       | PropTypes Output                                            | Notes                  |
| --------------------- | ----------------------------------------------------------- | ---------------------- |
| `string`              | `PropTypes.string`                                          |                        |
| `number`              | `PropTypes.number`                                          |                        |
| `boolean`             | `PropTypes.bool`                                            |                        |
| `any`                 | `PropTypes.any`                                             |                        |
| `unknown`             | `PropTypes.any`                                             |                        |
| `object`              | `PropTypes.object`                                          | Generic object type    |
| `Record<K, V>`        | `PropTypes.object`                                          |                        |
| `Array<T>`            | `PropTypes.array`                                           |                        |
| `T[]`                 | `PropTypes.array`                                           |                        |
| `Function`            | `PropTypes.func`                                            |                        |
| `() => void`          | `PropTypes.func`                                            | Any function signature |
| `'a' \| 'b' \| 'c'`   | `PropTypes.oneOf(['a', 'b', 'c'])`                          | String literal unions  |
| `1 \| 2 \| 3`         | `PropTypes.oneOf([1, 2, 3])`                                | Number literal unions  |
| `string \| number`    | `PropTypes.oneOfType([PropTypes.string, PropTypes.number])` | Type unions            |
| `string \| undefined` | `PropTypes.string`                                          | Optional types         |
| `string?`             | `PropTypes.string`                                          | Optional properties    |

## Limitations

While `ts-to-proptypes` handles many common cases, there are some limitations:

- Generic type parameters are treated as `any`
- Intersection types (`A & B`) are simplified to their base type
- Complex mapped types may not be correctly interpreted
- Recursive types are not fully supported

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Clone your fork
3. Install dependencies with `npm install`
4. Make your changes
5. Run tests with `npm test`
6. Add tests for your changes
7. Submit a pull request

Before submitting, please ensure your code:

- Passes all tests
- Follows the existing code style
- Includes appropriate documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

This tool builds on the excellent work of:

- The TypeScript team and community
- React PropTypes
- ts-morph for TypeScript AST manipulation

## Changelog

### 1.0.0

- Initial release with core functionality
- Support for function and arrow function components
- CLI with source, output, inline, and prettier options
- TypeScript to PropTypes mapping for basic types
