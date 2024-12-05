import { get, getLucid } from "raiders-helper";

import program from "../cli.js";
import { burn, mint } from "../parameter.js";
import { parseTokenId } from "../utils/index.js";

const parameterCommand = program
  .command("parameter")
  .description("Raiders Parameter");

parameterCommand
  .command("mint")
  .description("Mint a Raiders Parameter NFT")
  .action(async () => {
    const blockfrostApiKey = get("BLOCKFROST_API_KEY", "string");
    if (!blockfrostApiKey.ok) return program.error(blockfrostApiKey.error);

    const lucid = await getLucid(blockfrostApiKey.data);

    const adminAddress = get("ADMIN_ADDRESS", "string");
    if (!adminAddress.ok) return program.error(adminAddress.error);

    const projectAddress = get("PROJECT_ADDRESS", "string");
    if (!projectAddress.ok) return program.error(projectAddress.error);

    const authorizerAddress = get("AUTHORIZER_ADDRESS", "string");
    if (!authorizerAddress.ok) return program.error(authorizerAddress.error);

    const feePercentage = get("FEE_PERCENTAGE", "number");
    if (!feePercentage.ok) return program.error(feePercentage.error);

    const result = await mint(
      lucid,
      adminAddress.data,
      projectAddress.data,
      [authorizerAddress.data],
      feePercentage.data
    );
    if (!result.ok) return program.error(result.error);
    console.log(
      "Parameter reference Tx Hash (record this!):",
      result.data.toHash()
    );
    console.log("\nTransaction to submit (copy and paste into wallet): \n");
    console.log(result.data.toCBOR());
  });

parameterCommand
  .command("burn")
  .description("Burn a Raiders Parameter NFT")
  .argument("<unit>", "Asset Id of Parameter NFT")
  .action(async (unit: string) => {
    const blockfrostApiKey = get("BLOCKFROST_API_KEY", "string");
    if (!blockfrostApiKey.ok) return program.error(blockfrostApiKey.error);

    const lucid = await getLucid(blockfrostApiKey.data);

    const adminAddress = get("ADMIN_ADDRESS", "string");
    if (!adminAddress.ok) return program.error(adminAddress.error);

    const result = await burn(
      lucid,
      adminAddress.data,
      parseTokenId(program, unit)
    );
    if (!result.ok) return program.error(result.error);
    console.log("Transaction to submit (copy and paste into wallet): \n");
    console.log(result.data.toCBOR());
  });
