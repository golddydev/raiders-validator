import { Command } from "commander";
import { packageJson } from "raiders-helper";

const program = new Command();

program
  .name("raiders")
  .version(packageJson.version)
  .description(packageJson.description);

export default program;
