import { get, getLucid } from "raiders-helper";

import program from "../cli.js";
import { deploy } from "../deploy.js";
import { getSeed } from "../utils/index.js";

program
  .command("deploy")
  .description("Deploy Raider's Mint and Lock Contract")
  .action(async () => {
    const blockfrostApiKey = get("BLOCKFROST_API_KEY", "string");
    if (!blockfrostApiKey.ok) return program.error(blockfrostApiKey.error);

    const lucid = await getLucid(blockfrostApiKey.data);

    const adminAddress = get("ADMIN_ADDRESS", "string");
    if (!adminAddress.ok) return program.error(adminAddress.error);

    const result = await deploy(
      lucid,
      adminAddress.data,
      await getSeed(program)
    );
    if (!result.ok) program.error(result.error);
  });
