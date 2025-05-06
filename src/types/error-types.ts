export class PropTypesError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PropTypesError';
    }
}

export class ParsingError extends PropTypesError {
    constructor(
        message: string,
        public filePath: string
    ) {
        super(`Error parsing file ${filePath}: ${message}`);
        this.name = 'ParsingError';
    }
}

export class GenerationError extends PropTypesError {
    constructor(
        message: string,
        public componentName: string
    ) {
        super(`Error generating PropTypes for ${componentName}: ${message}`);
        this.name = 'GenerationError';
    }
}

export class ValidationError extends PropTypesError {
    constructor(message: string) {
        super(`Validation error: ${message}`);
        this.name = 'ValidationError';
    }
}
