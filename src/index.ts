import { program } from "commander";
import path from "path";
import { getLogger } from "./logger";
import { Configuration } from "./config";
import { PollerListener } from "./poller";

type CliArgs = {
  configFile: string;
  verbose: boolean;
};

async function main() {
  program.argument(
    "[configFile]",
    "Path to the configfile",
    "./.lite-ci.config.json"
  );
  program.option("--verbose", "whether to be verbose", false);
  program.parse();
  const args: CliArgs = program.opts();
  const { verbose } = args;
  const [configFile] = program.processedArgs;
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
