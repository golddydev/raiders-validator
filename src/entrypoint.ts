import fs from "fs/promises";
import path from "path";
import { getDirname, loadEnv } from "raiders-helper";

import program from "./cli.js";

const commandsDir = path.join(getDirname(import.meta.url), "commands");

const loadCommands = async (directory: string) => {
  const items = await fs.readdir(directory, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(directory, item.name);

    if (item.isDirectory()) await loadCommands(fullPath);
    else if (
      item.isFile() &&
      item.name.endsWith(".ts") &&
      !item.name.endsWith(".d.ts")
    )
      await import(fullPath);
  }
};

const run = async () => {
  loadEnv();
  await loadCommands(commandsDir);

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
