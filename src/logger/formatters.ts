import { LogLevel, LogFormat } from "./types";

export type LogFormatter = (
  message: any,
  level: LogLevel,
  source: string,
  date: Date
) => string;

export const formatJson: LogFormatter = (
  message: any,
  level: LogLevel,
  source: string,
  date: Date
): string => {
  return JSON.stringify({
    timestamp: date.toISOString(),
    level,
    source,
    message: typeof message === "string" ? message : JSON.stringify(message),
  });
};

export const formatText: LogFormatter = (
  message: any,
  level: LogLevel,
  source: string,
  date: Date
): string => {
  return `[${LogLevel[
    level
  ].toUpperCase()}]\t${date.toISOString()}\t[${source}]\t${
    typeof message === "string" ? message : JSON.stringify(message)
  }`;
};

export function getFormatter(fmt: LogFormat): LogFormatter {
  switch (fmt) {
    case "json":
      return formatJson;
    case "text":
      return formatText;
    default:
      throw new Error(`Unexpected format: ${fmt}`);
  }
}
