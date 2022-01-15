import argparse from "argparse";
import path from "path";
import { Configuration } from "./config";
import { Poller } from "./poller";

type CliArgs = {
  configFile: string;
};

const parser = new argparse.ArgumentParser();

parser.add_argument("configFile");

async function main() {
  // TODO: fix this
  const unparsedArgs = process.argv.slice(2);
  const args: CliArgs = parser.parse_args(unparsedArgs);
  const { configFile } = args;
  const config = Configuration.getInstance(path.resolve(configFile));
  const poller = new Poller(config.runtimeConfig);
  await poller.init();
}

void main();
