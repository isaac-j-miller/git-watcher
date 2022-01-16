import fs from "fs";
import { promisify } from "util";
import { ConsoleLogger } from "./console-logger";
import { getFormatter, LogFormatter } from "./formatters";
import { LogFormat, Logger, LogLevel } from "./types";

const appendFile = promisify(fs.appendFile);

export class FileLogger extends ConsoleLogger implements Logger {
  private logFormatter: LogFormatter;
  constructor(
    private logFilePath: string,
    private logFormat: LogFormat,
    logLevel: LogLevel,
    private fileLogLevel: LogLevel,
    private fileLogFormat: LogFormat,
    source: string
  ) {
    super(logLevel, logFormat, source);
    this.logFormatter = getFormatter(fileLogFormat);
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "", { encoding: "utf8" });
    }
  }
  private async writeToFile(lines: string[]): Promise<void> {
    await appendFile(this.logFilePath, lines.join("\n") + "\n");
  }
  protected override log(level: LogLevel, messages: any[]): boolean {
    super.log(level, messages);
    const shouldLogToFile = level > this.fileLogLevel;
    if (!shouldLogToFile) {
      return false;
    }
    const date = new Date();
    const formatted = messages.map((msg) =>
      this.logFormatter(msg, level, this.source, date)
    );
    this.writeToFile(formatted).catch((err) => {
      // don't try to write the error about not being able to write to the file, to the file
      super.error(`Error writing to file: ${err}`);
    });
    return true;
  }
  createChild(source: string): Logger {
    return new FileLogger(
      this.logFilePath,
      this.logFormat,
      this.logLevel,
      this.fileLogLevel,
      this.fileLogFormat,
      `${this.source}::${source}`
    );
  }
}
