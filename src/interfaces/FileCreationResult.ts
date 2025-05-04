/**
 * Result of the file creation operation
 */
export interface FileCreationResult {
    /** Whether the operation was successful */
    success: boolean;
    /** Path to the created or modified file */
    filePath: string;
    /** Error message if any */
    error?: string;
}
