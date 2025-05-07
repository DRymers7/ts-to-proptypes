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