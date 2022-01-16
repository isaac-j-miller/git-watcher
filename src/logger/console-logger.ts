import chalk from "chalk";
import { getFormatter, LogFormatter } from "./formatters";
import { LogFormat, Logger, LogLevel } from "./types";

export class ConsoleLogger implements Logger {
  private formatter: LogFormatter;
  constructor(
    protected logLevel: LogLevel,
    protected format: LogFormat,
    protected source: string
  ) {
    this.formatter = getFormatter(format);
  }
  private getColor(level: LogLevel): chalk.Chalk {
    switch (level) {
      case LogLevel.VERBOSE:
        return chalk.gray;
      case LogLevel.DEBUG:
        return chalk.magenta;
      case LogLevel.INFO:
        return chalk.green;
      case LogLevel.WARN:
        return chalk.yellow;
      case LogLevel.ERROR:
        return chalk.red;
      case LogLevel.FATAL:
        return chalk.cyan;
      default:
        throw new Error(`Unexpected loglevel: ${level}`);
    }
  }
  private formatMessage(
    color: chalk.Chalk,
    level: LogLevel,
    date: Date,
    message: any
  ): string {
    const formatted = this.formatter(message, level, this.source, date);
    if (this.format === "text") {
      const colorString = `[${LogLevel[level].toUpperCase()}]`;
      const after = formatted.slice(colorString.length);
      return color(colorString) + after;
    }
    return formatted;
  }
  protected log(level: LogLevel, messages: any[]): boolean {
    if (level < this.logLevel) {
      return false;
    }
    const date = new Date();
    const color = this.getColor(level);
    const formatted = messages.map((msg) =>
      this.formatMessage(color, level, date, msg)
    );
    switch (level) {
      case LogLevel.VERBOSE:
      case LogLevel.DEBUG:
        console.debug(...formatted);
        break;
      case LogLevel.INFO:
        console.info(...formatted);
        break;
      case LogLevel.WARN:
        console.warn(...formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(...formatted);
        break;
      default:
        throw new Error(`Unexpected loglevel: ${level}`);
    }
    return true;
  }
  createChild(source: string): Logger {
    return new ConsoleLogger(
      this.logLevel,
      this.format,
      `${this.source}::${source}`
    );
  }
  verbose(...messages: any[]) {
    this.log(LogLevel.VERBOSE, messages);
  }
  debug(...messages: any[]) {
    this.log(LogLevel.DEBUG, messages);
  }
  info(...messages: any[]) {
    this.log(LogLevel.INFO, messages);
  }
  warn(...messages: any[]) {
    this.log(LogLevel.WARN, messages);
  }
  error(...messages: any[]) {
    this.log(LogLevel.ERROR, messages);
  }
  fatal(...messages: any[]) {
    this.log(LogLevel.FATAL, messages);
  }
}
