import fs from "fs";
import { ConsoleLogger } from "../logger/console-logger";
import { LogLevel } from "../logger/types";
import { RuntimeConfig } from "./types";

export class Configuration {
  private config: RuntimeConfig;
  private static instance: Configuration;
  private constructor(configPathAbsolute: string) {
    const tempLogger = new ConsoleLogger(LogLevel.DEBUG, "bootstrap");
    tempLogger.debug(`reading config file at ${configPathAbsolute}...`);
    const file = fs.readFileSync(configPathAbsolute, { encoding: "utf8" });
    this.config = JSON.parse(file);
  }
  get runtimeConfig() {
    return this.config;
  }
  static getInstance(configPathAbsolute?: string): Configuration {
    if (!Configuration.instance) {
      if (!configPathAbsolute) {
        throw new Error("Configuration path missing!");
      }
      Configuration.instance = new Configuration(configPathAbsolute);
    }
    return this.instance;
  }
}