export type LogFormat = "json" | "text";
export enum LogLevel {
  TRACE = 0,
  DEBUG,
  INFO,
  WARN,
  ERROR,
  FATAL,
}

export interface Logger {
  trace: (...mesages: any[]) => void;
  debug: (...mesages: any[]) => void;
  info: (...mesages: any[]) => void;
  warn: (...mesages: any[]) => void;
  error: (...mesages: any[]) => void;
  fatal: (...mesages: any[]) => void;
  createChild: (source: string) => Logger;
}
