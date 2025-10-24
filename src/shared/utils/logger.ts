type LogLevel = "debug" | "log" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

declare const __DEV__: boolean;

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: __DEV__ ?? true,
      level: "debug",
      prefix: "[HTJ]",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return level === "error"; // Always log errors
    }
    return true;
  }

  private formatMessage(context: string, ...args: any[]): any[] {
    const timestamp = new Date().toISOString().split("T")[1].slice(0, -1);
    return [`${this.config.prefix} [${timestamp}] ${context}`, ...args];
  }

  debug(context: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(...this.formatMessage(context, ...args));
    }
  }

  log(context: string, ...args: any[]): void {
    if (this.shouldLog("log")) {
      console.log(...this.formatMessage(context, ...args));
    }
  }

  info(context: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage(context, ...args));
    }
  }

  warn(context: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage(context, ...args));
    }
  }

  error(context: string, ...args: any[]): void {
    // Always log errors, even in production
    console.error(...this.formatMessage(context, ...args));
  }
}

// Export singleton instances for different modules
export const contentLogger = new Logger({ prefix: "[HTJ Content]" });
export const backgroundLogger = new Logger({ prefix: "[HTJ Background]" });
export const popupLogger = new Logger({ prefix: "[HTJ Popup]" });

// For specific contexts
export const createLogger = (prefix: string) => new Logger({ prefix });
