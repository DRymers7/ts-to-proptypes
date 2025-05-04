/**
 * Result of a formatting operation
 */
export interface FormattingResult {
    /** Path to the file that was processed */
    filePath: string;
    /** Whether formatting was successful */
    success: boolean;
    /** Error message if formatting failed */
    error?: string;
}
