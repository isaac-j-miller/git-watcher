import argparse from "argparse";
import path from "path";
import { Configuration } from "config";
import { Poller } from "poller";

type CliArgs = {
  configFile: string;
};

const parser = new argparse.ArgumentParser();

parser.add_argument("config-file", {
  required: true,
  dest: "configFile",
});

async function main() {
  const unparsedArgs = process.argv;
  const args: CliArgs = parser.parse_args(unparsedArgs);
  const { configFile } = args;
  const config = Configuration.getInstance(path.resolve(configFile));
  const poller = new Poller(config.runtimeConfig);
  await poller.init();
}

void main();
