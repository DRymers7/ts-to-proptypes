export enum LogLevel {
    SILENT = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

/**
 * Simple logging class to handle...
 *
 */
class Logger {
    private level: LogLevel = LogLevel.INFO;

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    debug(message: string): void {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`);
        }
    }

    info(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(`[INFO] ${message}`);
        }
    }

    warn(message: string): void {
        if (this.level >= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`);
        }
    }

    error(message: string, error?: Error): void {
        if (this.level >= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}; Error type: ${error}`);
        }
    }
}

export const logger = new Logger();
