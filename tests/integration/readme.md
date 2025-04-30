# ts-to-proptypes Integration Tests

This directory contains integration tests for the `ts-to-proptypes` package which verify that the CLI correctly processes TypeScript component files and generates PropTypes.

## Running Integration Tests

You can run the integration tests using the following command:

```
npm run test:integration
```

## Test Structure

The integration tests work by:

1. Reading TypeScript React component files from the `input_files` directory
2. Running the CLI to process these files with different options
3. Verifying that the generated PropTypes files match the expected output based on the TypeScript types

## Main Test Cases

The integration tests verify:

1. **Basic PropTypes Generation**: Processes all components in the `input_files` directory and validates that:
   - PropTypes imports are correctly added
   - PropTypes definitions match the TypeScript type definitions
   - Required/optional flags are correctly applied

2. **Inline PropTypes**: Tests the `--inline` flag by:
   - Copying a component to the test output directory
   - Running the CLI with the `--inline` flag
   - Verifying that PropTypes are inserted into the original file

3. **Prettier Formatting**: Tests the `--prettier` flag by:
   - Processing a component with the `--prettier` flag
   - Verifying that the output is formatted according to project settings

## Adding Test Files

To add new test cases, simply add TypeScript component files to the `input_files` directory. The test will automatically detect and process all `.tsx` files in this directory.

Good test files would include:
- Basic components with required props
- Components with optional props
- Components with complex prop types (arrays, objects, functions)
- Arrow function components
- Class components (if supported)

## Folder Structure

```
project_root/
├── input_files/     # Contains test component files
├── tests/
│   └── integration/
│       ├── output/  # Temporary directory for generated files
│       └── integration.test.js
```

## Troubleshooting

If you encounter issues with the tests:

1. Make sure the `input_files` directory contains valid TypeScript React component files
2. Verify that each component has a properly defined `Props` type
3. Check that the CLI is correctly installed and can be run with `npm run dev`
4. Ensure that the project is correctly set up with ES modules (check `"type": "module"` in package.json)