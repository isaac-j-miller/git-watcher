import argparse from "argparse";
import path from "path";
import { getLogger } from "./logger";
import { Configuration } from "./config";
import { PollerListener } from "./poller";

type CliArgs = {
  configFile: string;
  verbose: boolean;
};

const parser = new argparse.ArgumentParser();

parser.add_argument("configFile");

parser.add_argument("--verbose", {
  dest: "verbose",
  action: "store_true",
});

async function main() {
  const indexOf = process.argv.findIndex((arg) => arg.endsWith(__filename));
  const unparsedArgs = process.argv.slice(indexOf + 1);
  const args: CliArgs = parser.parse_args(unparsedArgs);
  const { configFile, verbose } = args;
  const config = Configuration.getInstance(path.resolve(configFile), verbose);
  if (config.runtimeConfig.logging?.file?.path) {
    const logger = getLogger(config.runtimeConfig, "root");
    logger.info(
      `Writing logs to ${path.resolve(config.runtimeConfig.logging.file.path)}`
    );
  }
  const poller = new PollerListener(config.runtimeConfig);
  await poller.init();
}

void main();
