/**
 * Configuration options for the formatter
 */
export interface FormatterOptions {
    /** Enable verbose logging */
    verbose?: boolean;
    /** Custom Prettier configuration to use instead of auto-detected config */
    prettierConfig?: Record<string, unknown>;
}
