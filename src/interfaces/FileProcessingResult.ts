/**
 * Result of processing a source file
 */
export interface FileProcessingResult {
    /** Path to the processed file */
    filePath: string;
    /** Number of components found */
    componentCount: number;
    /** Whether processing was successful */
    success: boolean;
    /** Error message if any */
    error?: string;
}
