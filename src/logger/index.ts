import { RuntimeConfig } from "../config/types";
import { ConsoleLogger } from "./console-logger";
import { FileLogger } from "./file-logger";
import { Logger, LogLevel } from "./types";

export function getLogger(config: RuntimeConfig, source: string): Logger {
  const { logging } = config;
  const { level, format, file, console } = logging;
  const defaultLevel = level ?? LogLevel.INFO;
  if (file?.path) {
    return new FileLogger(
      file.path,
      console.format ?? format ?? "json",
      console.level ?? defaultLevel,
      file.level ?? defaultLevel,
      file.format ?? "json",
      source
    );
  } else {
    return new ConsoleLogger(
      console.level ?? defaultLevel,
      console.format ?? format ?? "text",
      source
    );
  }
}
