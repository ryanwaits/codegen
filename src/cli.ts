#!/usr/bin/env node
import { program } from "commander";
import { generate } from "./commands/generate.js";

/**
 * CLI entry point
 */

program
  .name("stacks")
  .description("CLI tool for generating type-safe Stacks contract interfaces")
  .version("0.1.0");

program
  .command("generate")
  .alias("gen")
  .description("Generate TypeScript interfaces from Clarity contracts")
  .option("-c, --config <path>", "Path to config file")
  .option("-w, --watch", "Watch for changes")
  .action(generate);

program
  .command("init")
  .description("Initialize a new stacks.config.ts file")
  .action(async () => {
    const { init } = await import("./commands/init.js");
    await init();
  });

program.parse();
