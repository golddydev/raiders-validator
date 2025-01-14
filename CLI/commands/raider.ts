import { get, mayFailAsync } from "raiders-helper";

import { claim, create, list, remove } from "../../src/raider.js";
import {
  lucidLoader,
  parseAmount,
  parseQuantity,
  parseTokenId,
  parseTxHash,
  parseTxIndex,
} from "../../src/utils/index.js";
import program from "../cli.js";

const raiderCommand = program
  .command("raider")
  .description("Create, Update and Delete Raider");

raiderCommand
  .command("create")
  .description("Create a Raider")
  .argument("<quantity>", "Quantity of Raider's bounty")
  .argument("<price>", "Each bounty's Price in Ada")
  .argument("<user-address>", "User's Bech32 Address")
  .action(async (quantity: string, price: string, userAddress: string) => {
    const lucidResult = await lucidLoader(userAddress);
    if (!lucidResult.ok) return program.error(lucidResult.error);
    const lucid = lucidResult.data;

    const parameterRefUtxoTxHash = get("PARAMETER_REF_UTXO_TX_HASH", "string");
    if (!parameterRefUtxoTxHash.ok)
      return program.error(parameterRefUtxoTxHash.error);

    const parameterRefUtxoTxIndex = get(
      "PARAMETER_REF_UTXO_TX_INDEX",
      "string"
    );
    if (!parameterRefUtxoTxIndex.ok)
      return program.error(parameterRefUtxoTxIndex.error);

    const parameterRefUtxo = await mayFailAsync(() =>
      lucid.utxosByOutRef([
        {
          txHash: parseTxHash(program, parameterRefUtxoTxHash.data),
          outputIndex: parseTxIndex(program, parameterRefUtxoTxIndex.data),
        },
      ])
    ).complete();
    if (!parameterRefUtxo.ok || parameterRefUtxo.data.length == 0)
      return program.error("Parameter Ref UTxO not found");

    const result = await create(
      lucid,
      parseQuantity(program, quantity),
      parseAmount(program, price),
      userAddress,
      parameterRefUtxo.data[0]
    );
    if (!result.ok) return program.error(result.error);
    console.log("\nTransaction to submit (copy and paste into wallet): \n");
    console.log(result.data.tx.toCBOR());
    console.log("\nRaid Asset Id: \n");
    console.log(result.data.assetId);
  });

raiderCommand
  .command("claim")
  .description("Claim a Bounty from Raider")
  .argument("<raid-unit>", "Unit of Raid NFT from which to Claim")
  .argument("<user-address>", "Address to perform Claim")
  .action(async (unit: string, userAddress: string) => {
    const lucidResult = await lucidLoader(userAddress);
    if (!lucidResult.ok) return program.error(lucidResult.error);
    const lucid = lucidResult.data;

    const adminAddress = get("ADMIN_ADDRESS", "string");
    if (!adminAddress.ok) return program.error(adminAddress.error);

    const result = await claim(
      lucid,
      adminAddress.data,
      parseTokenId(program, unit)
    );
    if (!result.ok) return program.error(result.error);
    console.log("\nTransaction to submit (copy and paste into wallet): \n");
    console.log(result.data.toCBOR());
  });

raiderCommand
  .command("remove")
  .description("Remove a Raider")
  .argument("<raid-unit>", "Unit of Raid NFT to Remove")
  .argument("<user-address>", "Address to perform Remove")
  .action(async (unit: string, userAddress: string) => {
    const lucidResult = await lucidLoader(userAddress);
    if (!lucidResult.ok) return program.error(lucidResult.error);
    const lucid = lucidResult.data;

    const result = await remove(lucid, parseTokenId(program, unit));
    if (!result.ok) return program.error(result.error);
    console.log("\nTransaction to submit (copy and paste into wallet): \n");
    console.log(result.data.toCBOR());
  });

raiderCommand
  .command("list")
  .description("List available Raiders")
  .action(async () => {
    const blockfrostApiKey = get("BLOCKFROST_API_KEY", "string");
    if (!blockfrostApiKey.ok) return program.error(blockfrostApiKey.error);

    const result = await list(blockfrostApiKey.data);
    if (!result.ok) return program.error(result.error);
    console.log("Raider Assets' Units: \n");
    console.log(result.data);
  });
