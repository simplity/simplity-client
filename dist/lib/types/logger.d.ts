/**
 * Logger that provides the three basic logging utilities
 */
export type Logger = {
    /**
     * log some information
     * @param args
     */
    info(...args: any[]): void;
    /**
     * log some error
     * @param args
     */
    error(...args: any[]): void;
    /**
     * log some warning
     * @param args
     */
    warn(...args: any[]): void;
};
