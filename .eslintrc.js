module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        jquery: true,
    },
    extends: [
        'airbnb-base', // Airbnb JS style guide
        'prettier'     // Prettier compatibility
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        indent: ['error', 4],
        'object-curly-spacing': ['error', 'never'],
        'no-console': 'off',
        'import/extensions': ['error', 'ignorePackages', {
            js: 'always',
            jsx: 'never'
        }],
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
    },
    overrides: [
        {
            // Target all test and setup files
            files: [
                '**/*.test.js', 
                '**/*.spec.js', 
                '**/jest-setup.js', 
                '**/setup.js', 
                'tests/**/*.js',
                'jest.config.js'
            ],
            env: {
                // Add Jest environment
                jest: true
            },
            rules: {
                // Disable the no-extraneous-dependencies rule for test files
                'import/no-extraneous-dependencies': 'off'
            }
        }
    ]
};