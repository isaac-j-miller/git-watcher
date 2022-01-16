import fs from "fs";
import { SchemaValidator } from "../validator";
import { ConsoleLogger } from "../logger/console-logger";
import { LogLevel } from "../logger/types";
import { RuntimeConfig } from "./types";

export class Configuration {
  private config: RuntimeConfig;
  private static instance: Configuration;
  private constructor(configPathAbsolute: string, verbose: boolean) {
    const tempLogger = new ConsoleLogger(
      verbose ? LogLevel.VERBOSE : LogLevel.DEBUG,
      "text",
      "bootstrap"
    );
    const validatorLogger = tempLogger.createChild("validator");
    tempLogger.verbose("verbose console logs enabled via CLI options");
    tempLogger.debug(`reading config file at ${configPathAbsolute}...`);
    const file = fs.readFileSync(configPathAbsolute, { encoding: "utf8" });
    const parsed: RuntimeConfig = JSON.parse(file);
    if (verbose) {
      if (!parsed.logging) {
        parsed.logging = {};
      }
      if (!parsed.logging.console) {
        parsed.logging.console = {};
      }
      parsed.logging.console.level = LogLevel.VERBOSE;
    }
    const validator = new SchemaValidator(validatorLogger, "RuntimeConfig");
    const valid = validator.validate(parsed);
    if (!valid) {
      throw new Error("Invalid RuntimeConfig!");
    } else {
      validatorLogger.debug("RuntimeConfig validation successful");
      this.config = parsed;
    }
  }
  get runtimeConfig() {
    return this.config;
  }
  static getInstance(
    configPathAbsolute: string,
    verbose?: boolean
  ): Configuration {
    if (!Configuration.instance) {
      if (!configPathAbsolute) {
        throw new Error("Configuration path missing!");
      }
      Configuration.instance = new Configuration(
        configPathAbsolute,
        verbose ?? false
      );
    }
    return this.instance;
  }
}
