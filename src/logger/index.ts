import { RuntimeConfig } from "config/types";
import { ConsoleLogger } from "./console-logger";
import { FileLogger } from "./file-logger";
import { Logger, LogLevel } from "./types";

export function getLogger(config: RuntimeConfig, source: string): Logger {
  const { logFilePath, logLevel, logFormat } = config;
  const level = logLevel ?? LogLevel.TRACE;
  if (logFilePath) {
    return new FileLogger(logFilePath, logFormat ?? "json", level, source);
  } else {
    return new ConsoleLogger(level, source);
  }
}
